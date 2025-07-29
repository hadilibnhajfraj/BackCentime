// src/models/rendezvous.model.js
module.exports = (sequelize, DataTypes) => {
  const RendezVous = sequelize.define('rendezvous', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dateRdv: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duree: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    objet: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM('en_attente', 'valide', 'annule'),
      defaultValue: 'en_attente',
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    agentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return RendezVous;
};
