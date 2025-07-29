module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Sans nom' },
    type: { type: DataTypes.STRING, allowNull: false },
    cheminFichier: DataTypes.STRING,
    taille: DataTypes.BIGINT,
    dateUpload: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    dossierId: DataTypes.BIGINT,
    nom_projet: DataTypes.STRING,
    activite: DataTypes.STRING,
    date: DataTypes.DATE,
    entete_texte: DataTypes.TEXT,
    client: DataTypes.STRING,
    adresse_client: DataTypes.STRING,
    departement: DataTypes.STRING,
    reference_bordereau: DataTypes.STRING,
    bureau_order: DataTypes.STRING,
    t: DataTypes.STRING,
    iat: DataTypes.STRING,
    pays: DataTypes.STRING,
    actif: DataTypes.BOOLEAN
  }, {
    tableName: 'documents',
    timestamps: false
  });

  Document.associate = (models) => {
    Document.belongsTo(models.Dossier, {
      foreignKey: 'dossierId',
      as: 'dossier'
    });
  };

  return Document;
};
