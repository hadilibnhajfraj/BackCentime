const router = require("express").Router();
const rdvCtrl = require("../controllers/rendezVousController");
const { verifyToken, isClient,isAdmin,isAgent } = require('../middleware/auth');

// Client
router.post("/reserver", verifyToken, isClient, rdvCtrl.reserver);
router.get("/client", verifyToken, isClient, rdvCtrl.clientRdvs);
// routes/disponibilite.routes.js
router.post('/affecter/admin', verifyToken, isAdmin, rdvCtrl.createByAdmin);

// Admin
router.post("/confirmer/:id", verifyToken, isAdmin, rdvCtrl.confirmer);
router.put("/annuler/:id", verifyToken, isAdmin, rdvCtrl.annuler);
router.get('/admin', verifyToken, isAdmin, rdvCtrl.rdvAdmin);
router.put('/:id/reassign', verifyToken, isAdmin, rdvCtrl.reassign);
// Agent
router.get("/agent/:agentId", verifyToken, isAgent, rdvCtrl.agentRdvs);
router.get("/pending-validation", verifyToken, isAgent, rdvCtrl.getPendingForAgent);
router.put("/agent/valider/:id", verifyToken, isAgent, rdvCtrl.agentValider);

module.exports = router;
