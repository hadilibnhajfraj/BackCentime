// Document (table custom "documents")
module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Sans nom' },
    type: { type: DataTypes.STRING, allowNull: false },
    cheminFichier: { type: DataTypes.STRING, field: 'cheminFichier' },
    taille: { type: DataTypes.BIGINT, field: 'taille' },
    dateUpload: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'dateUpload' },

    // 🔁 On remplace dossierId par prestation_id pour coller au nouveau modèle
    prestationId: { type: DataTypes.BIGINT, field: 'prestation_id' },

    nom_projet: { type: DataTypes.STRING, field: 'nom_projet' },
    activite: { type: DataTypes.STRING, field: 'activite' },
    date: { type: DataTypes.DATE, field: 'date' },
    entete_texte: { type: DataTypes.TEXT, field: 'entete_texte' },
    client: { type: DataTypes.STRING, field: 'client' },
    adresse_client: { type: DataTypes.STRING, field: 'adresse_client' },
    departement: { type: DataTypes.STRING, field: 'departement' },
    reference_bordereau: { type: DataTypes.STRING, field: 'reference_bordereau' },
    bureau_order: { type: DataTypes.STRING, field: 'bureau_order' },
    t: { type: DataTypes.STRING, field: 't' },
    iat: { type: DataTypes.STRING, field: 'iat' },
    pays: { type: DataTypes.STRING, field: 'pays' },
    actif: { type: DataTypes.BOOLEAN, field: 'actif' },
  }, {
    tableName: 'documents',
    timestamps: false,
    underscored: true,
    freezeTableName: true,
  });

  Document.associate = (models) => {
    Document.belongsTo(models.Prestation, { foreignKey: 'prestation_id', as: 'prestation' });
  };

  return Document;
};
