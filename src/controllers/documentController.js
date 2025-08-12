const { Document } = require('../models');

exports.createDocument = async (req, res) => {
  try {
    const file = req.file;
    const {
      nom, type, prestationId, nom_projet, activite, date,
      entete_texte, client, adresse_client, departement,
      reference_bordereau, bureau_order, t, iat, pays, actif,
    } = req.body;

    if (!type || !prestationId) {
      return res.status(400).json({ message: "Champs requis manquants : type ou prestationId." });
    }

    const cheminFichier = file ? file.path : null;
    const taille = file ? file.size : null;

    const document = await Document.create({
      nom: nom || (file?.originalname ?? "Sans nom"),
      type,
      prestationId,
      cheminFichier,
      taille,
      mimeType: file?.mimetype,
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

// === Multi-fichiers
exports.createDocumentsBulk = async (req, res) => {
  try {
    const files = req.files || [];
    const {
      type, prestationId,
      nom_projet, activite, date, entete_texte,
      client, adresse_client, departement,
      reference_bordereau, bureau_order, t, iat, pays, actif
    } = req.body;

    if (!prestationId) {
      return res.status(400).json({ message: "prestationId est requis." });
    }
    if (!files.length) {
      return res.status(400).json({ message: "Aucun fichier reçu (champ 'files')." });
    }

    const common = {
      type: type || 'document',
      prestationId,
      nom_projet, activite, date, entete_texte, client, adresse_client,
      departement, reference_bordereau, bureau_order, t, iat, pays,
      actif: actif === "true" || actif === true
    };

    const created = await Promise.all(
      files.map((f) =>
        Document.create({
          ...common,
          nom: f.originalname || 'Sans nom',
          cheminFichier: f.path,
          taille: f.size,
          mimeType: f.mimetype
        })
      )
    );

    return res.status(201).json({ count: created.length, documents: created });
  } catch (error) {
    console.error("Erreur création documents (bulk):", error);
    return res.status(500).json({ message: "Erreur lors de la création des documents", error: error.message });
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

exports.getDocumentsByPrestation = async (req, res) => {
  try {
    const { prestationId } = req.params;
    const documents = await Document.findAll({
      where: { prestationId },                 // <<<<<<<<<<<<<<
      order: [['dateUpload', 'DESC']],
    });
    res.status(200).json(documents);
  } catch (error) {
    console.error('Erreur récupération documents par prestation:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};