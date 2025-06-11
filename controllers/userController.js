const User = require('../models/User');
const bcrypt = require('bcrypt');

const userController = {
    registerUser: async (req, res) => {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber,
                country: req.body.country,
                gender: req.body.gender,
                dateOfBirth: req.body.dateOfBirth,
                password: hashedPassword
            });
            await user.save();
            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    loginUser: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
    
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
    
            res.status(200).json({ 
                message: 'Login successful',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profilePicture: user.profilePicture
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // Add profile picture upload functionality
uploadProfilePicture: async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Assuming you're using multer and storing files in public/uploads
        const profilePicturePath = `/uploads/${req.file.filename}`;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { profilePicture: profilePicturePath },
            { new: true }
        ).select('-password');

        res.status(200).json({ 
            message: 'Profile picture updated successfully',
            profilePicture: updatedUser.profilePicture
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
},
// Add this to the existing userController object

getAllUsersWithPosts: async (req, res) => {
    try {
        // Get all users
        const users = await User.find({}).select('-password');
        
        // Get all posts with populated author and comments
        const posts = await Post.find({})
            .populate('author', 'name email profilePicture')
            .populate('comments.user', 'name profilePicture')
            .sort('-createdAt');
        
        // Count total posts
        const totalPosts = await Post.countDocuments();
        
        // Count total likes across all posts
        const totalLikes = posts.reduce((sum, post) => sum + (post.likes ? post.likes.length : 0), 0);
        
        // Count total comments across all posts
        const totalComments = posts.reduce((sum, post) => sum + (post.comments ? post.comments.length : 0), 0);
        
        res.status(200).json({
            users,
            posts,
            stats: {
                totalUsers: users.length,
                totalPosts,
                totalLikes,
                totalComments
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
},
// Add this to your userController object if it doesn't exist

uploadProfilePicture: async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const profilePicturePath = `/uploads/${req.file.filename}`;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { profilePicture: profilePicturePath },
            { new: true }
        ).select('-password');
        
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
},

    

    getAllUsers: async (req, res) => {
        try {
            const users = await User.find({}).select('-password');
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateUser: async (req, res) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true }
            ).select('-password');
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteUser: async (req, res) => {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = userController;
