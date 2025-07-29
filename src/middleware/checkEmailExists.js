// middleware/checkEmailExists.js
const { User } = require('../models');

const checkEmailExists = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis.' });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email déjà utilisé.' });
    }
    next();
  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = checkEmailExists;
