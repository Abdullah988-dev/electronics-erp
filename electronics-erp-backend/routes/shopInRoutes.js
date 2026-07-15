const express = require('express');
const router = express.Router();
const { getAllShopIn, addShopIn, deleteShopIn } = require('../controllers/shopInController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllShopIn);
router.post('/', verifyToken, addShopIn);
router.delete('/:id', verifyToken, deleteShopIn);

module.exports = router;