const router = require('express').Router();
const ctrl = require('../controllers/kpiController');

router.get('/dashboard', ctrl.dashboard);
module.exports = router;
