const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { getUnreadCount } = require('../controllers/gmailController');
router.post('/login', authController.login);
router.post('/register', authController.register);

router.get('/summary', authController.getUserStats);
router.get('/clients', authController.getClients);
router.get('/user/:id', authController.getUserById);
router.put('/user/:id', authController.updateUser);
router.get('/gmail/unread-count', getUnreadCount);

module.exports = router;
