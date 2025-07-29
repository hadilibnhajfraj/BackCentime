module.exports = (sequelize, DataTypes) => {
  const Dossier = sequelize.define('Dossier', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    type: DataTypes.STRING,
    dossierId: DataTypes.BIGINT,
    cheminFichier: DataTypes.STRING,
    taille: DataTypes.INTEGER,
    nom_projet: DataTypes.STRING,
    activite: DataTypes.STRING,
    date: DataTypes.DATEONLY,
    entete_texte: DataTypes.TEXT,
    client: DataTypes.STRING,
    adresse_client: DataTypes.STRING,
    departement: DataTypes.STRING,
    reference_bordereau: DataTypes.STRING,
    bureau_order: DataTypes.STRING,
    t: { type: DataTypes.BOOLEAN, defaultValue: false },
    iat: DataTypes.STRING,
    pays: DataTypes.STRING,
    actif: { type: DataTypes.BOOLEAN, defaultValue: true },
    numPrestation: DataTypes.STRING,
    chefProjet: DataTypes.STRING,
    intervenants: DataTypes.TEXT,
    dateCreation: DataTypes.DATEONLY,
    dateDebutPrevue: DataTypes.DATEONLY,
    dateFacturation: DataTypes.DATEONLY,
    dateOffre: DataTypes.DATEONLY,
    dateCloture: DataTypes.DATEONLY,
    dateReception: DataTypes.DATEONLY,
    etat: DataTypes.STRING
  }, {
    tableName: 'dossiers',
    timestamps: false
  });

  Dossier.associate = (models) => {
    Dossier.hasMany(models.Document, {
      foreignKey: 'dossierId',
      as: 'documents'
    });
  };

  return Dossier;
};
