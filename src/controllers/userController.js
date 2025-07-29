const { User } = require("../models");

exports.validateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.actif = true;
    await user.save();

    res.status(200).json({ message: "Utilisateur activé avec succès", user });
  } catch (error) {
    console.error("❌ Erreur validation utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

