'use strict';
module.exports = (sequelize, DataTypes) => {
  const Rapport = sequelize.define('Rapport', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // TODO: add attributes
  }, {
    tableName: 'reports',
    underscored: true,
  });
  Rapport.associate = function(models) {
    // associations
  };
  return Rapport;
};
