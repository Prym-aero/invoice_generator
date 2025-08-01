require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

const seedUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'accountsalamkisan@gmail.com' });
    if (existingUser) {
      console.log('Default user already exists');
      process.exit(0);
    }

    // Create default user
    const defaultUser = new User({
      email: 'accountsalamkisan@gmail.com',
      password: 'account@123',
      name: 'Account Admin',
      role: 'admin'
    });

    await defaultUser.save();
    console.log('Default user created successfully');
    console.log('Email: accountsalamkisan@gmail.com');
    console.log('Password: account@123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
};

seedUser();
