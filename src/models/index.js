const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ✅ Import des modèles
db.res_users = require('./res_users')(sequelize, DataTypes);
db.res_partner = require('./res_partner')(sequelize, DataTypes);
db.res_groups = require('./res_groups')(sequelize, DataTypes);
db.res_users_res_groups_rel = require('./res_users_res_groups_rel')(sequelize, DataTypes);

db.Dossier = require('./Dossier')(sequelize, DataTypes);
db.Document = require('./Document')(sequelize, DataTypes);
db.Department = require('./Department')(sequelize, DataTypes);
db.RendezVous = require('./RendezVous')(sequelize, DataTypes);
db.Disponibilite = require('./Disponibilite')(sequelize, DataTypes);

// 🔗 Associations : utilisateurs <-> groupes
db.res_users.belongsToMany(db.res_groups, {
  through: db.res_users_res_groups_rel,
  foreignKey: 'uid',
  otherKey: 'gid',
  as: 'groups'
});

db.res_groups.belongsToMany(db.res_users, {
  through: db.res_users_res_groups_rel,
  foreignKey: 'gid',
  otherKey: 'uid',
  as: 'users'
});

// 🔗 User <-> Partner
db.res_users.belongsTo(db.res_partner, {
  foreignKey: 'partner_id',
  as: 'partner'
});
db.res_partner.hasOne(db.res_users, {
  foreignKey: 'partner_id',
  as: 'user'
});

// 🔗 RDV
db.RendezVous.belongsTo(db.res_users, { foreignKey: 'clientId', as: 'client' });
db.RendezVous.belongsTo(db.res_users, { foreignKey: 'agentId', as: 'agent' });

module.exports = db;
