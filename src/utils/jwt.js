const jwt = require('jsonwebtoken');
exports.sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
