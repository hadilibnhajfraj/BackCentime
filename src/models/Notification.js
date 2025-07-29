'use strict';
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // TODO: add attributes
  }, {
    tableName: 'notifications',
    underscored: true,
  });
  Notification.associate = function(models) {
    // associations
  };
  return Notification;
};
