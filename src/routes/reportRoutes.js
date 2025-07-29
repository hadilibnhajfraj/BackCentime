const express = require('express');
const router = express.Router();
// const controller = require('../controllers/reportController');

router.get('/ping', (req, res) => res.json({ route: 'report', status: 'ok' }));

module.exports = router;
