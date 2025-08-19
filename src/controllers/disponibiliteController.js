// src/controllers/disponibilite.controller.js
const db = require("../models");
const Disponibilite = db.Disponibilite;

exports.createDisponibilite = async (req, res) => {
  try {
    const { agentId, start, end } = req.body;
    const dispo = await Disponibilite.create({ agentId, start, end });
    res.status(201).json(dispo);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout", error });
  }
};

exports.getAllDisponibilites = async (req, res) => {
  try {
    const all = await Disponibilite.findAll();
    res.json(all);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération", error });
  }
};
// NEW: lister les dispos d’un agent
exports.listByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;                 // id dans l’URL
    const { id: userId, role } = req.user || {};
    const isAdmin = (role || '').toUpperCase() === 'ADMIN';

    // sécurité: un agent ne peut voir que ses propres dispos
    if (!isAdmin && Number(agentId) !== Number(userId)) {
      return res.status(403).json({ message: '⛔ Accès refusé' });
    }

    const rows = await db.Disponibilite.findAll({
      where: { agentId: Number(agentId) },
      order: [['start', 'ASC']],
    });

    res.json(rows);
  } catch (e) {
    console.error('listByAgent error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
