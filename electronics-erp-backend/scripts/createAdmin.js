require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');

async function createAdmin() {
  const email = 'admin@shop.com';
  const plainPassword = 'admin123';

  try {
    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('⚠️ Admin already exists, skipping creation.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await User.create({ email, passwordHash: hashedPassword, role: 'Admin' });

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