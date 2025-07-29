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
