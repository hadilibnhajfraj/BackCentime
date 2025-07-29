const express = require('express');
const router = express.Router();
const dossierController = require('../controllers/dossierController');
const { verifyToken,isClient} = require('../middleware/auth'); // 🛡️
router.post('/', dossierController.createDossier);
router.get("/byClient",verifyToken,isClient,  dossierController.getDossiersByClient);
router.get('/all', dossierController.getAllDossiers);
router.get('/:id', dossierController.getDossierById);
router.put('/:id', dossierController.updateDossier);
router.get("/all", dossierController.getAllDossiers);
router.delete('/dossier/:id', dossierController.deleteDossier);
router.get("/all", dossierController.getAllDossiers);


module.exports = router;
