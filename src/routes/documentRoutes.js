const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');

router.post('/', upload.single('file'), documentController.createDocument);
router.get('/', documentController.getAllDocuments);
router.get('/:id', documentController.getDocumentById);
router.get('/byDossier/:dossierId', documentController.getDocumentsByDossier);

module.exports = router;
