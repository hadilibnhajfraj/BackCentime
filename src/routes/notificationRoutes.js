const express = require('express');
const router = express.Router();
// const controller = require('../controllers/notificationController');
const { getUnreadEmails } = require("../services/gmailService");
router.get('/ping', (req, res) => res.json({ route: 'notification', status: 'ok' }));
router.get("/gmail", async (req, res) => {
  try {
    const emails = await getUnreadEmails(10);
    res.json(emails);
  } catch (err) {
    console.error("Erreur Gmail API:", err);
    res.status(500).json({ error: "Erreur Gmail API" });
  }
});
module.exports = router;
