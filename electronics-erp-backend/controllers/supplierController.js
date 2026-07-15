const { sql, connectDB } = require('../config/db');

async function getAllSuppliers(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Suppliers ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get suppliers error:', err.message);
    res.status(500).json({ message: 'Failed to fetch suppliers.' });
  }
}

async function addSupplier(req, res) {
  const { name, phone, address } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Supplier name is required.' });
  }

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || '')
      .input('address', sql.NVarChar, address || '')
      .query(`
        INSERT INTO Suppliers (Name, Phone, Address)
        OUTPUT INSERTED.*
        VALUES (@name, @phone, @address)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Add supplier error:', err.message);
    res.status(500).json({ message: 'Failed to add supplier.' });
  }
}

async function deleteSupplier(req, res) {
  const { id } = req.params;

  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Suppliers WHERE Id = @id');

    res.json({ message: 'Supplier deleted successfully.' });
  } catch (err) {
    console.error('Delete supplier error:', err.message);
    res.status(500).json({ message: 'Failed to delete supplier.' });
  }
}

module.exports = { getAllSuppliers, addSupplier, deleteSupplier };