const router = require("express").Router();
const rdvCtrl = require("../controllers/rendezVousController");
const { verifyToken, isClient,isAdmin } = require('../middleware/auth');

// Client
router.post("/reserver", verifyToken, isClient, rdvCtrl.reserver);
router.get("/client", verifyToken, isClient, rdvCtrl.clientRdvs);

// Admin
router.put("/confirmer/:id", verifyToken, isAdmin, rdvCtrl.confirmer);
router.put("/annuler/:id", verifyToken, isAdmin, rdvCtrl.annuler);

// Agent
router.get("/agent/:agentId", verifyToken, rdvCtrl.agentRdvs);
router.get('/admin', verifyToken, isAdmin, rdvCtrl.rdvAdmin);

module.exports = router;
