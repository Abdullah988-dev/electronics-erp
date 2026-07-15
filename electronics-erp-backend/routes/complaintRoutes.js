const express = require('express');
const router = express.Router();
const {
  getAllComplaints,
  addComplaint,
  updateComplaintStatus,
  deleteComplaint,
} = require('../controllers/complaintController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllComplaints);
router.post('/', verifyToken, addComplaint);
router.put('/:id', verifyToken, updateComplaintStatus);
router.delete('/:id', verifyToken, deleteComplaint);

module.exports = router;