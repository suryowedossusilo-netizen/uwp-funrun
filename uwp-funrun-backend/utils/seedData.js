const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Race = require('../models/Race');
require('dotenv').config();

const connectDB = require('../config/database');
connectDB();

const seedData = async () => {
  try {
    await User.deleteMany();
    await Race.deleteMany();
    
    console.log('Data cleared...');
    
    // Create admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'superadmin'
    });
    
    console.log('Admin created (admin/admin123)');
    
    // Create race with Early Bird
    await Race.create({
      name: 'UWP Fun Run 2024',
      year: 2024,
      date: new Date('2024-12-15'),
      location: {
        name: 'GBK Senayan',
        address: 'Jl. Pintu Satu Senayan, Jakarta Pusat',
        coordinates: { lat: -6.2183, lng: 106.8028 }
      },
      earlyBird: {
        enabled: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-10-31'),
        discountPercent: 20,
        maxQuota: 200,
        currentQuota: 0
      },
      categories: [
        {
          id: '5k',
          name: '5K Fun Run',
          distance: 5,
          price: 200000,        // Harga normal
          earlyBirdPrice: 160000, // Harga early bird (20% off)
          quota: 1000,
          startTime: '06:00',
          description: 'Lari santai 5K untuk semua kalangan'
        },
        {
          id: '10k',
          name: '10K Challenge',
          distance: 10,
          price: 300000,        // Harga normal
          earlyBirdPrice: 240000, // Harga early bird (20% off)
          quota: 500,
          startTime: '06:30',
          description: 'Tantangan lari 10K dengan timing chip'
        }
      ],
      registrationOpen: true,
      registrationDeadline: new Date('2024-12-10')
    });
    
    console.log('Race created with Early Bird pricing!');
    console.log('5K: Rp 200.000 → Rp 160.000 (Early Bird)');
    console.log('10K: Rp 300.000 → Rp 240.000 (Early Bird)');
    console.log('Seeding completed!');
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedData();