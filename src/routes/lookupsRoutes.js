// src/routes/lookups.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/lookupsController');


router.get('/activities', /*verifyToken,*/ ctrl.searchActivities);
router.get('/departments', /*verifyToken,*/ ctrl.listDepartments);
router.get('/users/by-group', /*verifyToken,*/ ctrl.usersByGroup);

module.exports = router;
