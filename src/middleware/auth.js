const jwt = require('jsonwebtoken');

// Vérifie que le token JWT est bien présent et valide
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contient id, role, iat, exp
    console.log('✅ Token décodé:', decoded);
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

const isClient = (req, res, next) => {
  const role = (req.user?.role || '').toUpperCase();
  if (role === 'CLIENT') return next();
  return res.status(403).json({ message: '⛔ Accès réservé aux clients.' });
};

const isAdmin = (req, res, next) => {
  const role = (req.user?.role || '').toUpperCase();
  if (role === 'ADMIN') return next();
  return res
    .status(403)
    .json({ message: '⛔ Accès réservé aux administrateurs.' });
};
const isAgent = (req, res, next) => {
  const role = (req.user?.role || '').toUpperCase();
  // ✅ Accepte les deux libellés
  if (role === 'AGENT' || role === 'EMPLOYEE') return next();
  return res
    .status(403)
    .json({ message: '⛔ Accès réservé aux agents/employés.' });
};

module.exports = { verifyToken, isClient, isAdmin, isAgent };
