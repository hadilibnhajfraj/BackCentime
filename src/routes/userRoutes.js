const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const checkEmailExists = require('../middleware/checkEmailExists');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router = express.Router();
const authController = require('../controllers/authController');
// ✅ Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, role } = req.body;

    // rôle obligatoire et seulement agent/client
    if (!['agent', 'client'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide. Utilisez "agent" ou "client".' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      nom,
      prenom,
      telephone,
      role,
      actif: false // L’admin devra approuver
    });

    res.status(201).json({
      message: 'Inscription réussie. En attente de validation par un administrateur.',
      user: { id: newUser.id, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// ✅ Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
console.log("🔐 Requête reçue:", req.body);

    if (!login || !password)
      return res.status(400).json({ message: 'Login et mot de passe requis.' });

    const user = await res_users.findOne({ where: { login } });

    if (!user)
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: 'Mot de passe incorrect.' });

    if (!user.active)
      return res.status(403).json({ message: 'Compte inactif, contactez l’administrateur.' });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ message: 'Connexion réussie', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.patch('/validate/:id', verifyToken, isAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de modifier un compte admin' });
    }

    user.actif = true;
    await user.save();

    res.status(200).json({ message: `✅ Utilisateur ${user.email} validé avec succès.` });
  } catch (error) {
    console.error('❌ Erreur lors de la validation du compte :', error);
    res.status(500).json({ message: 'Erreur serveur interne.' });
  }
});

router.get('/summary', authController.getUserStats);
module.exports = router;
