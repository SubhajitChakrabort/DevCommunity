const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

// Configure storage for profile pictures
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Register new user
router.post('/register', userController.registerUser);

// Login user
router.post('/login', userController.loginUser);

// Get all users
router.get('/', userController.getAllUsers);

// Get all users with their posts
router.get('/with-posts', userController.getAllUsersWithPosts);

// Get single user
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Upload profile picture
router.post('/:id/profile-picture', upload.single('profilePicture'), userController.uploadProfilePicture);

module.exports = router;
