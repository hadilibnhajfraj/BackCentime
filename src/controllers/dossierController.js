// src/controllers/dossier.controller.js
const db = require('../models');
const Dossier = db.Dossier;

exports.createDossier = async (req, res) => {
  try {
    const {
      type,
      dossierId,
      cheminFichier,
      taille,
      nom_projet,
      activite,
      date,
      entete_texte,
      client,
      adresse_client,
      departement,
      reference_bordereau,
      bureau_order,
      t,
      iat,
      pays,
      actif,
      numPrestation,
      chefProjet,
      intervenants,
      dateCreation,
      dateDebutPrevue,
      dateFacturation,
      dateOffre,
      dateCloture,
      dateReception,
      etat
    } = req.body;

    // Vérification d’un champ requis (exemple)
    if (!nom_projet) {
      return res.status(400).json({ message: "Le champ 'nom_projet' est requis." });
    }

    const newDossier = await Dossier.create({
      type,
      dossierId,
      cheminFichier,
      taille,
      nom_projet,
      activite,
      date,
      entete_texte,
      client,
      adresse_client,
      departement,
      reference_bordereau,
      bureau_order,
      t,
      iat,
      pays,
      actif,
      numPrestation,
      chefProjet,
      intervenants,
      dateCreation,
      dateDebutPrevue,
      dateFacturation,
      dateOffre,
      dateCloture,
      dateReception,
      etat
    });

    res.status(201).json(newDossier);
  } catch (error) {
    console.error("Erreur création dossier :", error);
    res.status(500).json({ message: "Erreur lors de la création", error });
  }
};


exports.getAllDossiers = async (req, res) => {
  try {
    const dossiers = await Dossier.findAll();
    res.json(dossiers);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération dossiers", error });
  }
};

exports.getDossierById = async (req, res) => {
  try {
    const dossier = await Dossier.findByPk(req.params.id);
    if (!dossier) return res.status(404).json({ message: "Dossier non trouvé" });
    res.json(dossier);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération dossier", error });
  }
};

exports.updateDossier = async (req, res) => {
  try {
    const dossier = await Dossier.findByPk(req.params.id);
    if (!dossier) return res.status(404).json({ message: "Dossier non trouvé" });

    await dossier.update(req.body);
    res.json(dossier);
  } catch (error) {
    res.status(500).json({ message: "Erreur mise à jour dossier", error });
  }
};

exports.deleteDossier = async (req, res) => {
  try {
    const dossier = await Dossier.findByPk(req.params.id);
    if (!dossier) return res.status(404).json({ message: "Dossier non trouvé" });

    await dossier.destroy();
    res.json({ message: "Dossier supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression dossier", error });
  }
};
exports.getDossiersByClient = async (req, res) => {
  try {
    const role = req.user.role?.toUpperCase();
    const clientId = String(req.user.id);

    console.log("🔐 Utilisateur :", req.user);

    if (role !== "CLIENT") {
      return res.status(403).json({ message: "Accès réservé aux clients" });
    }

    const dossiers = await Dossier.findAll({
      where: { client: clientId }
    });

    res.status(200).json(dossiers);
  } catch (err) {
    console.error("❌ Erreur getDossiersByClient:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
exports.getAllDossiers = async (req, res) => {
  try {
    const dossiers = await Dossier.findAll({
      include: [
        {
          model: db.Document,
          as: 'documents',
          attributes: ['id', 'type', 'cheminFichier', 'actif', 'date']
        }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json(dossiers);
  } catch (error) {
    console.error("Erreur lors de la récupération des dossiers :", error);
    res.status(500).json({ error: "Erreur lors de la récupération des dossiers" });
  }
};

