const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} = require('../controllers/inventoryController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllInventory);
router.post('/', verifyToken, addInventoryItem);
router.put('/:id', verifyToken, updateInventoryItem);
router.delete('/:id', verifyToken, deleteInventoryItem);

module.exports = router;