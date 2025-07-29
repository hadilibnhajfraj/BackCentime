const express = require('express');
const router = express.Router();
// const controller = require('../controllers/chatbotController');

router.get('/ping', (req, res) => res.json({ route: 'chatbot', status: 'ok' }));

module.exports = router;
