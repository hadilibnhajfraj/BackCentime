// src/routes/disponibilite.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/disponibiliteController");

router.post("/", ctrl.createDisponibilite); // POST /disponibilites
router.get("/all", ctrl.getAllDisponibilites); // GET /disponibilites/all
router.put("/agent/:agentId", ctrl.listByAgent);
module.exports = router;
