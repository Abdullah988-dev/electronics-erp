const { sql, connectDB } = require('../config/db');

async function getAllInventory(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Inventory ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get inventory error:', err.message);
    res.status(500).json({ message: 'Failed to fetch inventory.' });
  }
}

async function addInventoryItem(req, res) {
  const { name, category, qty, purchasePrice, salePrice } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Name and category are required.' });
  }

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('category', sql.NVarChar, category)
      .input('qty', sql.Int, qty || 0)
      .input('purchasePrice', sql.Decimal(18, 2), purchasePrice || 0)
      .input('salePrice', sql.Decimal(18, 2), salePrice || 0)
      .query(`
        INSERT INTO Inventory (Name, Category, Qty, PurchasePrice, SalePrice)
        OUTPUT INSERTED.*
        VALUES (@name, @category, @qty, @purchasePrice, @salePrice)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Add inventory error:', err.message);
    res.status(500).json({ message: 'Failed to add inventory item.' });
  }
}

async function updateInventoryItem(req, res) {
  const { id } = req.params;
  const { name, category, qty, purchasePrice, salePrice } = req.body;

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('category', sql.NVarChar, category)
      .input('qty', sql.Int, qty)
      .input('purchasePrice', sql.Decimal(18, 2), purchasePrice)
      .input('salePrice', sql.Decimal(18, 2), salePrice)
      .query(`
        UPDATE Inventory
        SET Name = @name, Category = @category, Qty = @qty,
            PurchasePrice = @purchasePrice, SalePrice = @salePrice,
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Update inventory error:', err.message);
    res.status(500).json({ message: 'Failed to update inventory item.' });
  }
}

async function deleteInventoryItem(req, res) {
  const { id } = req.params;

  try {
    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Inventory WHERE Id = @id');

    res.json({ message: 'Inventory item deleted successfully.' });
  } catch (err) {
    console.error('Delete inventory error:', err.message);
    res.status(500).json({ message: 'Failed to delete inventory item.' });
  }
}

module.exports = { getAllInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem };