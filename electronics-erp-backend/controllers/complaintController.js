const { sql, connectDB } = require('../config/db');

async function getAllComplaints(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Complaints ORDER BY ComplaintDate DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get complaints error:', err.message);
    res.status(500).json({ message: 'Failed to fetch complaints.' });
  }
}

async function addComplaint(req, res) {
  const { customerName, phone, product, complaintDetails, priority } = req.body;

  if (!customerName || !phone || !complaintDetails) {
    return res.status(400).json({ message: 'Customer name, phone, and complaint details are required.' });
  }

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('customerName', sql.NVarChar, customerName)
      .input('phone', sql.NVarChar, phone)
      .input('product', sql.NVarChar, product || '')
      .input('complaintDetails', sql.NVarChar, complaintDetails)
      .input('priority', sql.NVarChar, priority || 'Medium')
      .query(`
        INSERT INTO Complaints (CustomerName, Phone, Product, ComplaintDetails, Priority)
        OUTPUT INSERTED.*
        VALUES (@customerName, @phone, @product, @complaintDetails, @priority)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Add complaint error:', err.message);
    res.status(500).json({ message: 'Failed to add complaint.' });
  }
}

async function updateComplaintStatus(req, res) {
  const { id } = req.params;
  const { status, resolutionNotes } = req.body;

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .input('resolutionNotes', sql.NVarChar, resolutionNotes || '')
      .query(`
        UPDATE Complaints
        SET Status = @status, ResolutionNotes = @resolutionNotes
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Update complaint error:', err.message);
    res.status(500).json({ message: 'Failed to update complaint.' });
  }
}

async function deleteComplaint(req, res) {
  const { id } = req.params;

  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Complaints WHERE Id = @id');

    res.json({ message: 'Complaint deleted successfully.' });
  } catch (err) {
    console.error('Delete complaint error:', err.message);
    res.status(500).json({ message: 'Failed to delete complaint.' });
  }
}

module.exports = { getAllComplaints, addComplaint, updateComplaintStatus, deleteComplaint };