const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
// ➜ adapte au besoin (nom de dossier, règles de nommage, etc.)
const upload = multer({
  dest: 'uploads/', // ou diskStorage(...) si tu veux conserver le nom original
  limits: { fileSize: 50 * 1024 * 1024 } // 50Mo
});
router.post('/document', upload.single('file'), documentController.createDocument);
router.post('/document/bulk', upload.array('files', 20), documentController.createDocumentsBulk);

router.get('/', documentController.getAllDocuments);
router.get('/:id', documentController.getDocumentById);
router.get('/byDossier/:dossierId', documentController.getDocumentsByDossier);

module.exports = router;
