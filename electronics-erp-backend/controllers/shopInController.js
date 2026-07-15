const { sql, connectDB } = require('../config/db');

async function getAllShopIn(req, res) {
  try {
    const pool = await connectDB();
    const recordsResult = await pool.request().query('SELECT * FROM ShopInRecords ORDER BY TransactionDate DESC');
    const records = recordsResult.recordset;

    if (records.length === 0) return res.json([]);

    const ids = records.map((r) => r.Id).join(',');
    const itemsResult = await pool.request().query(`SELECT * FROM ShopInItems WHERE ShopInRecordId IN (${ids})`);
    const items = itemsResult.recordset;

    const combined = records.map((r) => ({
      ...r,
      items: items.filter((i) => i.ShopInRecordId === r.Id),
    }));

    res.json(combined);
  } catch (err) {
    console.error('Get shop-in error:', err.message);
    res.status(500).json({ message: 'Failed to fetch purchase records.' });
  }
}

async function addShopIn(req, res) {
  const { supplierId, items, totalBill, paid, invoiceNumber, paymentMethod, notes } = req.body;

  if (!supplierId || !items || items.length === 0 || totalBill == null || paid == null) {
    return res.status(400).json({ message: 'supplierId, items, totalBill, and paid are required.' });
  }

  const remaining = totalBill - paid;
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const recordResult = await new sql.Request(transaction)
      .input('invoiceNumber', sql.NVarChar, invoiceNumber || `PUR-${Date.now()}`)
      .input('supplierId', sql.Int, supplierId)
      .input('totalBill', sql.Decimal(18, 2), totalBill)
      .input('paid', sql.Decimal(18, 2), paid)
      .input('remaining', sql.Decimal(18, 2), remaining)
      .input('paymentMethod', sql.NVarChar, paymentMethod || 'Cash')
      .input('notes', sql.NVarChar, notes || '')
      .query(`
        INSERT INTO ShopInRecords (InvoiceNumber, SupplierId, TotalBill, Paid, Remaining, PaymentMethod, Notes)
        OUTPUT INSERTED.*
        VALUES (@invoiceNumber, @supplierId, @totalBill, @paid, @remaining, @paymentMethod, @notes)
      `);

    const shopInRecord = recordResult.recordset[0];
    const insertedItems = [];

    for (const item of items) {
      let inventoryId = item.inventoryId ? Number(item.inventoryId) : null;

      if (inventoryId) {
        await new sql.Request(transaction)
          .input('id', sql.Int, inventoryId)
          .input('qty', sql.Int, Number(item.qty))
          .input('purchasePrice', sql.Decimal(18, 2), Number(item.purchasePrice) || 0)
          .query(`
            UPDATE Inventory
            SET Qty = Qty + @qty, PurchasePrice = @purchasePrice, UpdatedAt = GETDATE()
            WHERE Id = @id
          `);
      } else {
        const invResult = await new sql.Request(transaction)
          .input('name', sql.NVarChar, item.name)
          .input('category', sql.NVarChar, item.category || 'Spare Parts')
          .input('qty', sql.Int, Number(item.qty))
          .input('purchasePrice', sql.Decimal(18, 2), Number(item.purchasePrice) || 0)
          .input('salePrice', sql.Decimal(18, 2), Number(item.salePrice) || 0)
          .query(`
            INSERT INTO Inventory (Name, Category, Qty, PurchasePrice, SalePrice)
            OUTPUT INSERTED.*
            VALUES (@name, @category, @qty, @purchasePrice, @salePrice)
          `);
        inventoryId = Number(invResult.recordset[0].Id);
      }

      const itemResult = await new sql.Request(transaction)
        .input('shopInRecordId', sql.Int, shopInRecord.Id)
        .input('inventoryId', sql.Int, inventoryId)
        .input('qty', sql.Int, Number(item.qty))
        .input('purchasePrice', sql.Decimal(18, 2), Number(item.purchasePrice) || 0)
        .query(`
          INSERT INTO ShopInItems (ShopInRecordId, InventoryId, Qty, PurchasePrice)
          OUTPUT INSERTED.*
          VALUES (@shopInRecordId, @inventoryId, @qty, @purchasePrice)
        `);

      insertedItems.push(itemResult.recordset[0]);
    }

    await new sql.Request(transaction)
      .input('supplierId', sql.Int, supplierId)
      .input('remaining', sql.Decimal(18, 2), remaining)
      .query(`
        UPDATE Suppliers
        SET TotalPayable = TotalPayable + @remaining
        WHERE Id = @supplierId
      `);

    await transaction.commit();

    res.status(201).json({ ...shopInRecord, items: insertedItems });
  } catch (err) {
    console.error('Add shop-in error:', err.message);
    try { await transaction.rollback(); } catch (_) {}
    res.status(500).json({ message: 'Failed to save purchase invoice.' });
  }
}

async function deleteShopIn(req, res) {
  const { id } = req.params;
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const recordResult = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query('SELECT * FROM ShopInRecords WHERE Id = @id');

    if (recordResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Record not found.' });
    }
    const record = recordResult.recordset[0];

    const itemsResult = await new sql.Request(transaction)
      .input('recordId', sql.Int, id)
      .query('SELECT * FROM ShopInItems WHERE ShopInRecordId = @recordId');

    for (const item of itemsResult.recordset) {
      await new sql.Request(transaction)
        .input('invId', sql.Int, item.InventoryId)
        .input('qty', sql.Int, item.Qty)
        .query('UPDATE Inventory SET Qty = CASE WHEN Qty - @qty < 0 THEN 0 ELSE Qty - @qty END WHERE Id = @invId');
    }

    await new sql.Request(transaction)
      .input('supplierId', sql.Int, record.SupplierId)
      .input('remaining', sql.Decimal(18, 2), record.Remaining)
      .query('UPDATE Suppliers SET TotalPayable = CASE WHEN TotalPayable - @remaining < 0 THEN 0 ELSE TotalPayable - @remaining END WHERE Id = @supplierId');

    await new sql.Request(transaction).input('recordId', sql.Int, id).query('DELETE FROM ShopInItems WHERE ShopInRecordId = @recordId');
    await new sql.Request(transaction).input('id', sql.Int, id).query('DELETE FROM ShopInRecords WHERE Id = @id');

    await transaction.commit();
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    console.error('Delete shop-in error:', err.message);
    try { await transaction.rollback(); } catch (_) {}
    res.status(500).json({ message: 'Failed to delete record.' });
  }
}

module.exports = { getAllShopIn, addShopIn, deleteShopIn };