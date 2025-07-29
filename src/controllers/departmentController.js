const { Department } = require('../models');

// ➕ Créer un département
// ➕ Créer un département
exports.createDepartment = async (req, res) => {
  try {
    const { create_date, active, name, code } = req.body;

    const now = new Date(); // timestamp actuel

    const newDep = await Department.create({
      create_date: create_date || now,
      write_date: now,
      active,
      name,
      code
    });

    res.status(201).json(newDep);
  } catch (error) {
    console.error("Erreur création département :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// 📄 Obtenir tous les départements
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération départements", error });
  }
};

// 🔍 Obtenir un département par ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: "Département non trouvé" });
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✏️ Modifier un département
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: "Département non trouvé" });

    await department.update(req.body);
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: "Erreur mise à jour", error });
  }
};

// 🗑 Supprimer un département
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: "Département non trouvé" });

    await department.destroy();
    res.json({ message: "Département supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression", error });
  }
};
exports.getAll = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.status(200).json(departments);
  } catch (err) {
    res.status(500).json({ message: "Erreur récupération départements", err });
  }
};