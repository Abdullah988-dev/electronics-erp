const express = require('express');
const router = express.Router();
const { getAllCustomers, addCustomer, deleteCustomer } = require('../controllers/customerController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllCustomers);
router.post('/', verifyToken, addCustomer);
router.delete('/:id', verifyToken, deleteCustomer);

module.exports = router;