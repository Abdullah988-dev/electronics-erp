const { sql, connectDB } = require('../config/db');

async function getAllShopOut(req, res) {
  try {
    const pool = await connectDB();
    const recordsResult = await pool.request().query('SELECT * FROM ShopOutRecords ORDER BY TransactionDate DESC');
    const records = recordsResult.recordset;

    if (records.length === 0) return res.json([]);

    const ids = records.map((r) => r.Id).join(',');
    const itemsResult = await pool.request().query(`SELECT * FROM ShopOutItems WHERE ShopOutRecordId IN (${ids})`);
    const items = itemsResult.recordset;

    const combined = records.map((r) => ({
      ...r,
      items: items.filter((i) => i.ShopOutRecordId === r.Id),
    }));

    res.json(combined);
  } catch (err) {
    console.error('Get shop-out error:', err.message);
    res.status(500).json({ message: 'Failed to fetch sales records.' });
  }
}

async function addShopOut(req, res) {
  const { customerId, items, discount, paid, invoiceNumber, paymentMethod, notes } = req.body;

  if (!customerId || !items || items.length === 0 || paid == null) {
    return res.status(400).json({ message: 'customerId, items, and paid are required.' });
  }

  const subTotal = items.reduce((sum, i) => sum + Number(i.qty) * Number(i.salePrice), 0);
  const discountAmount = Number(discount) || 0;
  const totalBill = Math.max(0, subTotal - discountAmount);
  const remaining = totalBill - paid;

  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const recordResult = await new sql.Request(transaction)
      .input('invoiceNumber', sql.NVarChar, invoiceNumber || `INV-${Date.now()}`)
      .input('customerId', sql.Int, customerId)
      .input('totalBill', sql.Decimal(18, 2), totalBill)
      .input('discount', sql.Decimal(18, 2), discountAmount)
      .input('paid', sql.Decimal(18, 2), paid)
      .input('remaining', sql.Decimal(18, 2), remaining)
      .input('paymentMethod', sql.NVarChar, paymentMethod || 'Cash')
      .input('notes', sql.NVarChar, notes || '')
      .query(`
        INSERT INTO ShopOutRecords (InvoiceNumber, CustomerId, TotalBill, Discount, Paid, Remaining, PaymentMethod, Notes)
        OUTPUT INSERTED.*
        VALUES (@invoiceNumber, @customerId, @totalBill, @discount, @paid, @remaining, @paymentMethod, @notes)
      `);

    const shopOutRecord = recordResult.recordset[0];
    const insertedItems = [];

    for (const item of items) {
      if (!item.inventoryId) {
        throw new Error(`Product not found in inventory for one of the items.`);
      }
      const inventoryId = Number(item.inventoryId);

      await new sql.Request(transaction)
        .input('id', sql.Int, inventoryId)
        .input('qty', sql.Int, Number(item.qty))
        .query(`
          UPDATE Inventory
          SET Qty = CASE WHEN Qty - @qty < 0 THEN 0 ELSE Qty - @qty END, UpdatedAt = GETDATE()
          WHERE Id = @id
        `);

      const itemResult = await new sql.Request(transaction)
        .input('shopOutRecordId', sql.Int, shopOutRecord.Id)
        .input('inventoryId', sql.Int, inventoryId)
        .input('qty', sql.Int, Number(item.qty))
        .input('salePrice', sql.Decimal(18, 2), Number(item.salePrice) || 0)
        .query(`
          INSERT INTO ShopOutItems (ShopOutRecordId, InventoryId, Qty, SalePrice)
          OUTPUT INSERTED.*
          VALUES (@shopOutRecordId, @inventoryId, @qty, @salePrice)
        `);

      insertedItems.push(itemResult.recordset[0]);
    }

    await new sql.Request(transaction)
      .input('customerId', sql.Int, customerId)
      .input('remaining', sql.Decimal(18, 2), remaining)
      .query(`
        UPDATE Customers
        SET TotalDue = TotalDue + @remaining
        WHERE Id = @customerId
      `);

    await transaction.commit();

    res.status(201).json({ ...shopOutRecord, items: insertedItems });
  } catch (err) {
    console.error('Add shop-out error:', err.message);
    try { await transaction.rollback(); } catch (_) {}
    res.status(500).json({ message: err.message || 'Failed to save sales invoice.' });
  }
}

async function deleteShopOut(req, res) {
  const { id } = req.params;
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const recordResult = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query('SELECT * FROM ShopOutRecords WHERE Id = @id');

    if (recordResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Record not found.' });
    }
    const record = recordResult.recordset[0];

    const itemsResult = await new sql.Request(transaction)
      .input('recordId', sql.Int, id)
      .query('SELECT * FROM ShopOutItems WHERE ShopOutRecordId = @recordId');

    for (const item of itemsResult.recordset) {
      await new sql.Request(transaction)
        .input('invId', sql.Int, item.InventoryId)
        .input('qty', sql.Int, item.Qty)
        .query('UPDATE Inventory SET Qty = Qty + @qty WHERE Id = @invId');
    }

    await new sql.Request(transaction)
      .input('customerId', sql.Int, record.CustomerId)
      .input('remaining', sql.Decimal(18, 2), record.Remaining)
      .query('UPDATE Customers SET TotalDue = CASE WHEN TotalDue - @remaining < 0 THEN 0 ELSE TotalDue - @remaining END WHERE Id = @customerId');

    await new sql.Request(transaction).input('recordId', sql.Int, id).query('DELETE FROM ShopOutItems WHERE ShopOutRecordId = @recordId');
    await new sql.Request(transaction).input('id', sql.Int, id).query('DELETE FROM ShopOutRecords WHERE Id = @id');

    await transaction.commit();
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    console.error('Delete shop-out error:', err.message);
    try { await transaction.rollback(); } catch (_) {}
    res.status(500).json({ message: 'Failed to delete record.' });
  }
}

module.exports = { getAllShopOut, addShopOut, deleteShopOut };