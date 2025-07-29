const { Document } = require('../models');

exports.createDocument = async (req, res) => {
  try {
    const file = req.file;
    const {
      nom, type, dossierId, nom_projet, activite, date,
      entete_texte, client, adresse_client, departement,
      reference_bordereau, bureau_order, t, iat, pays, actif,
    } = req.body;

    if (!type || !dossierId) {
      return res.status(400).json({ message: "Champs requis manquants : type ou dossierId." });
    }

    const cheminFichier = file ? file.path : null;
    const taille = file ? file.size : null;

    const document = await Document.create({
      nom: nom || "Sans nom", type, dossierId, cheminFichier, taille,
      nom_projet, activite, date, entete_texte, client, adresse_client,
      departement, reference_bordereau, bureau_order, t, iat, pays,
      actif: actif === "true" || actif === true
    });

    res.status(201).json(document);
  } catch (error) {
    console.error("Erreur création document :", error);
    res.status(500).json({ message: "Erreur lors de la création du document", error: error.message });
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll();
    res.json(documents);
  } catch (error) {
    res
      .status(500)
      .json({
        message: 'Erreur lors de la récupération des documents',
        error: error.message,
      });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document non trouvé.' });
    res.json(doc);
  } catch (error) {
    res
      .status(500)
      .json({
        message: 'Erreur lors de la récupération du document',
        error: error.message,
      });
  }
};

exports.getDocumentsByDossier = async (req, res) => {
  try {
    const { dossierId } = req.params;
    const documents = await Document.findAll({
      where: { dossierId },
      order: [['dateUpload', 'DESC']],
    });
    res.status(200).json(documents);
  } catch (error) {
    console.error('Erreur récupération documents par dossier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
