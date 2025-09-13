const router = require('express').Router();
const ctrl = require('../controllers/kpiController');

router.get('/dashboard', ctrl.dashboard);

router.get('/prestations-by-activity', ctrl.prestationsByActivity);
router.get("/prestations-by-state", ctrl.prestationsByState); 
module.exports = router;
