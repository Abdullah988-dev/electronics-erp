const express = require('express');
const router = express.Router();
const { getAllSuppliers, addSupplier, deleteSupplier } = require('../controllers/supplierController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllSuppliers);
router.post('/', verifyToken, addSupplier);
router.delete('/:id', verifyToken, deleteSupplier);

module.exports = router;