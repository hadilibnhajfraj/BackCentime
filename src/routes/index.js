const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/dossiers', require('./dossierRoutes'));
router.use('/rendez-vous', require('./rendezVousRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/chatbot', require('./chatbotRoutes'));

module.exports = router;
