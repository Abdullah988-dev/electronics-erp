const { sql, connectDB } = require('../config/db');

async function getAllCustomers(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Customers ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get customers error:', err.message);
    res.status(500).json({ message: 'Failed to fetch customers.' });
  }
}

async function addCustomer(req, res) {
  const { name, phone, city } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Customer name is required.' });
  }

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || '')
      .input('city', sql.NVarChar, city || '')
      .query(`
        INSERT INTO Customers (Name, Phone, City)
        OUTPUT INSERTED.*
        VALUES (@name, @phone, @city)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Add customer error:', err.message);
    res.status(500).json({ message: 'Failed to add customer.' });
  }
}

async function deleteCustomer(req, res) {
  const { id } = req.params;

  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Customers WHERE Id = @id');

    res.json({ message: 'Customer deleted successfully.' });
  } catch (err) {
    console.error('Delete customer error:', err.message);
    res.status(500).json({ message: 'Failed to delete customer.' });
  }
}

module.exports = { getAllCustomers, addCustomer, deleteCustomer };