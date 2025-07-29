// src/models/res_groups.js

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('res_groups', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING
    },
    comment: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'res_groups',
    timestamps: false
  });
};
