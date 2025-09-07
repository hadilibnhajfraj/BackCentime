const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/dossierController'); // <-- tes exports listés dans le log
const { verifyToken, isClient } = require('../middleware/auth');

// CRUD Prestations
router.post('/', ctrl.createPrestation);
router.get('/prestations/summary', ctrl.summary); // <- spécifique
router.get('/prestations', ctrl.listByState);
//router.get('/all', ctrl.getAllPrestations);
router.get('/by-client', verifyToken, isClient, ctrl.getPrestationsByClient);
router.get('/:id', ctrl.getPrestationById);
router.put('/:id', ctrl.updatePrestation);
router.delete('/:id', ctrl.deletePrestation);
router.get('/:id/full', ctrl.getPrestationFull);

module.exports = router;
