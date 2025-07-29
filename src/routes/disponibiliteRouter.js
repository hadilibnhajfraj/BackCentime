// src/routes/disponibilite.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/disponibiliteController");

router.post("/", ctrl.createDisponibilite); // POST /disponibilites
router.get("/all", ctrl.getAllDisponibilites); // GET /disponibilites/all

module.exports = router;
