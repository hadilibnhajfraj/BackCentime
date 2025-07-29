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

// Chargement des modèles
db.res_users = require('./res_users')(sequelize, DataTypes);
db.res_partner = require('./res_partner')(sequelize, DataTypes);
db.res_groups = require('./res_groups')(sequelize, DataTypes);
db.Dossier = require('./Dossier')(sequelize, DataTypes); // ✅ Majuscule
db.Document = require('./Document')(sequelize, DataTypes);
db.Department = require('./Department')(sequelize, DataTypes);
db.res_users_res_groups_rel = require('./res_users_res_groups_rel')(sequelize, DataTypes);
db.RendezVous = require('./RendezVous')(sequelize, DataTypes);
db.Disponibilite = require('./Disponibilite')(sequelize, DataTypes);

// Relations utilisateurs et groupes
db.res_users.hasMany(db.res_users_res_groups_rel, {
  foreignKey: 'uid',
  as: 'groupLinks',
  constraints: false
});
db.res_users_res_groups_rel.belongsTo(db.res_users, {
  foreignKey: 'uid',
  as: 'user',
  constraints: false
});
db.res_users_res_groups_rel.belongsTo(db.res_groups, {
  foreignKey: 'gid',
  as: 'group',
  constraints: false
});
db.res_groups.hasMany(db.res_users_res_groups_rel, {
  foreignKey: 'gid',
  as: 'userLinks',
  constraints: false
});
// Un rendez-vous appartient à un client
db.RendezVous.belongsTo(db.res_users, {
  foreignKey: 'clientId',
  as: 'client'
});

// Un rendez-vous appartient à un agent
db.RendezVous.belongsTo(db.res_users, {
  foreignKey: 'agentId',
  as: 'agent'
});

// Relation user <-> partner
db.res_users.belongsTo(db.res_partner, {
  foreignKey: 'partner_id',
  as: 'partner'
});
db.res_partner.hasOne(db.res_users, {
  foreignKey: 'partner_id',
  as: 'user'
});

// Initialiser les associations des modèles
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
