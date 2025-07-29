module.exports = (sequelize, DataTypes) => {
  return sequelize.define('res_users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // ✅ important
      allowNull: false
    },

    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true, // ✅ éviter NOT NULL ici si la colonne n'est pas encore remplie dans la base
      validate: {
        isEmail: true
      }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    partner_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'res_users',
    timestamps: false
  });
};
