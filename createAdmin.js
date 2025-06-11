const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Admin details - you can change these values
const adminData = {
  username: 'admin',
  password: 'admin123',  // This will be hashed by the pre-save hook in the Admin model
  email: 'admin@example.com',
  role: 'super-admin'
};

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { username: adminData.username },
        { email: adminData.email }
      ]
    });

    if (existingAdmin) {
      console.log('Admin already exists with this username or email');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin(adminData);
    await admin.save();
    
    console.log('Admin created successfully!');
    console.log('Username:', adminData.username);
    console.log('Password:', 'admin123'); // Show the unhashed password for login
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
