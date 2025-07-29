// src/models/Disponibilite.js
module.exports = (sequelize, DataTypes) => {
  const Disponibilite = sequelize.define('disponibilite', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    agentId: { type: DataTypes.INTEGER, allowNull: false },
    start: { type: DataTypes.DATE, allowNull: false },
    end: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'disponibilite',
    timestamps: true
  });

  return Disponibilite;
};
