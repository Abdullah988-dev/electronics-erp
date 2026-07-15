const bcrypt = require('bcryptjs');
const { sql, connectDB } = require('../config/db');

async function createAdmin() {
  const email = 'admin@shop.com';
  const plainPassword = 'admin123';

  try {
    const pool = await connectDB();

    // Check if admin already exists
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');

    if (existing.recordset.length > 0) {
      console.log('⚠️ Admin already exists, skipping creation.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await pool.request()
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, 'Admin')
      .query('INSERT INTO Users (Email, PasswordHash, Role) VALUES (@email, @passwordHash, @role)');

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${plainPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();