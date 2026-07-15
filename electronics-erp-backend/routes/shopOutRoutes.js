const express = require('express');
const router = express.Router();
const { getAllShopOut, addShopOut, deleteShopOut } = require('../controllers/shopOutController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllShopOut);
router.post('/', verifyToken, addShopOut);
router.delete('/:id', verifyToken, deleteShopOut);

module.exports = router;