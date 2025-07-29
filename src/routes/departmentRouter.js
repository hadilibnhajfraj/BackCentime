const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, isAdmin } = require('../middleware/auth'); // 🛡️

router.post('/add', verifyToken, isAdmin, departmentController.createDepartment); // ✅ Admin only
router.get('/all', verifyToken,isAdmin, departmentController.getAllDepartments);
router.get('/getAll',  departmentController.getAll);
router.get('/:id', verifyToken, departmentController.getDepartmentById);
router.put('/:id', verifyToken, isAdmin, departmentController.updateDepartment); // 🔒 Admin
router.delete('/:id', verifyToken, isAdmin, departmentController.deleteDepartment); // 🔒 Admin

module.exports = router;
