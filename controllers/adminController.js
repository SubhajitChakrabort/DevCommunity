const User = require('../models/User');
const Post = require('../models/Post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    return age;
}

const adminController = {
    // Admin login
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            
            // In a real app, you would check against admin users in the database
            // For this example, we'll use hardcoded credentials
            if (username === 'admin' && password === 'admin123') {
                // Create admin token
                const token = jwt.sign(
                    { id: 'admin', role: 'admin' },
                    process.env.JWT_SECRET || 'your_jwt_secret',
                    { expiresIn: '1d' }
                );
                
                res.status(200).json({
                    message: 'Login successful',
                    admin: {
                        username: 'admin',
                        token
                    }
                });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get dashboard stats
   // Get dashboard stats
getStats: async (req, res) => {
    try {
        // Count total users
        const totalUsers = await User.countDocuments();
        
        // Count active users (not blocked)
        const activeUsers = await User.countDocuments({ isBlocked: false });
        
        // Count blocked users
        const blockedUsers = await User.countDocuments({ isBlocked: true });
        
        // Count total posts
        const totalPosts = await Post.countDocuments();
        
        // Count users registered in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newUsers = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        // Count posts created in the last 30 days
        const newPosts = await Post.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        // Count total likes across all posts
        const posts = await Post.find();
        const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);
        
        // Count total comments across all posts
        const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
        
        res.status(200).json({
            totalUsers,
            activeUsers,
            blockedUsers,
            totalPosts,
            newUsers,
            newPosts,
            totalLikes,
            totalComments
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
},

    
    // Get user analytics data
    getUserAnalytics: async (req, res) => {
        try {
            // Get all users
            const users = await User.find();
            
            // Total users count
            const totalUsers = users.length;
            
            // Gender statistics
            const genderStats = {
                male: 0,
                female: 0,
                other: 0
            };
            
            // Country statistics
            const countryStats = {};
            
            // Age statistics
            const ageStats = {
                'Under 18': 0,
                '18-24': 0,
                '25-34': 0,
                '35-44': 0,
                '45-54': 0,
                '55-64': 0,
                '65+': 0
            };
            
            // Calculate age for each user and update statistics
            let totalAge = 0;
            
            users.forEach(user => {
                // Update gender stats
                genderStats[user.gender]++;
                
                // Update country stats
                if (countryStats[user.country]) {
                    countryStats[user.country]++;
                } else {
                    countryStats[user.country] = 1;
                }
                
                // Calculate age and update age stats
                const age = calculateAge(user.dateOfBirth);
                totalAge += age;
                
                // Update age range stats
                if (age < 18) {
                    ageStats['Under 18']++;
                } else if (age >= 18 && age <= 24) {
                    ageStats['18-24']++;
                } else if (age >= 25 && age <= 34) {
                    ageStats['25-34']++;
                } else if (age >= 35 && age <= 44) {
                    ageStats['35-44']++;
                } else if (age >= 45 && age <= 54) {
                    ageStats['45-54']++;
                } else if (age >= 55 && age <= 64) {
                    ageStats['55-64']++;
                } else {
                    ageStats['65+']++;
                }
            });
            
            // Calculate average age
            const avgAge = totalUsers > 0 ? totalAge / totalUsers : 0;
            
            res.status(200).json({
                totalUsers,
                genderStats,
                countryStats,
                ageStats,
                avgAge
            });
        } catch (error) {
            console.error('Get user analytics error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get users with pagination
    getUsers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            
            const users = await User.find()
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .select('-password');
                
            const totalUsers = await User.countDocuments();
            const totalPages = Math.ceil(totalUsers / limit);
            
            res.status(200).json({
                users,
                totalPages,
                currentPage: page,
                totalUsers
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Search users
    searchUsers: async (req, res) => {
        try {
            const { term } = req.query;
            
            if (!term) {
                return res.status(400).json({ error: 'Search term is required' });
            }
            
            const users = await User.find({
                $or: [
                    { name: { $regex: term, $options: 'i' } },
                    { email: { $regex: term, $options: 'i' } },
                    { country: { $regex: term, $options: 'i' } }
                ]
            })
            .select('-password')
            .sort('-createdAt');
            
            res.status(200).json({
                users,
                count: users.length
            });
        } catch (error) {
            console.error('Search users error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get user by ID
    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-password');
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.status(200).json(user);
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get user posts count
    getUserPostsCount: async (req, res) => {
        try {
            const postsCount = await Post.countDocuments({ author: req.params.id });
            res.status(200).json({ postsCount });
        } catch (error) {
            console.error('Get user posts count error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Block user
    blockUser: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { isBlocked: true },
                { new: true }
            ).select('-password');
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.status(200).json({ message: 'User blocked successfully', user });
        } catch (error) {
            console.error('Block user error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Unblock user
    unblockUser: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { isBlocked: false },
                { new: true }
            ).select('-password');
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.status(200).json({ message: 'User unblocked successfully', user });
        } catch (error) {
            console.error('Unblock user error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get user details
    getUserDetails: async (req, res) => {
        try {
            const { userId } = req.params;
            
            const user = await User.findById(userId).select('-password');
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.status(200).json(user);
        } catch (error) {
            console.error('Get user details error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get user activity
    getUserActivity: async (req, res) => {
        try {
            const { userId } = req.params;
            
            // Get user posts count
            const postsCount = await Post.countDocuments({ author: userId });
            
            // Get recent posts
            const recentPosts = await Post.find({ author: userId })
                .sort('-createdAt')
                .limit(5);
                
            // Count comments made by user
            const allPosts = await Post.find();
            let commentsCount = 0;
            
            allPosts.forEach(post => {
                commentsCount += post.comments.filter(comment => 
                    comment.user.toString() === userId
                ).length;
            });
            
            // Count posts liked by user
            let likesCount = 0;
            
            allPosts.forEach(post => {
                if (post.likes.includes(userId)) {
                    likesCount++;
                }
            });
            
            res.status(200).json({
                postsCount,
                commentsCount,
                likesCount,
                recentPosts
            });
        } catch (error) {
            console.error('Get user activity error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get posts stats
    getPostsStats: async (req, res) => {
        try {
            // Count total posts
            const totalPosts = await Post.countDocuments();
            
            // Count posts created in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentPosts = await Post.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });
            
            // Get posts with most likes
            const popularPosts = await Post.find()
                .sort({ 'likes.length': -1 })
                .limit(5)
                .populate('author', 'name profilePicture');
            
            // Get posts with most comments
            const mostCommentedPosts = await Post.find()
                .sort({ 'comments.length': -1 })
                .limit(5)
                .populate('author', 'name profilePicture');
            
            res.status(200).json({
                totalPosts,
                recentPosts,
                popularPosts,
                mostCommentedPosts
            });
        } catch (error) {
            console.error('Get posts stats error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get all posts with pagination
    getPosts: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            
            const posts = await Post.find()
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .populate('author', 'name profilePicture');
                
            const totalPosts = await Post.countDocuments();
            const totalPages = Math.ceil(totalPosts / limit);
            
            res.status(200).json({
                posts,
                totalPages,
                currentPage: page,
                totalPosts
            });
        } catch (error) {
            console.error('Get posts error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Search posts
    searchPosts: async (req, res) => {
        try {
            const { term } = req.query;
            
            if (!term) {
                return res.status(400).json({ error: 'Search term is required' });
            }
            
            const posts = await Post.find({
                $or: [
                    { content: { $regex: term, $options: 'i' } },
                    { hashtags: { $regex: term, $options: 'i' } }
                ]
            })
            .populate('author', 'name profilePicture')
            .sort('-createdAt');
            
            res.status(200).json({
                posts,
                count: posts.length
            });
        } catch (error) {
            console.error('Search posts error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Get post by ID
    getPostById: async (req, res) => {
        try {
            const post = await Post.findById(req.params.id)
                .populate('author', 'name profilePicture')
                .populate('comments.user', 'name profilePicture');
            
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            
            res.status(200).json(post);
        } catch (error) {
            console.error('Get post error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Block post
    blockPost: async (req, res) => {
        try {
            const post = await Post.findByIdAndUpdate(
                req.params.id,
                { isBlocked: true },
                { new: true }
            ).populate('author', 'name profilePicture');
            
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            
            res.status(200).json({ message: 'Post blocked successfully', post });
        } catch (error) {
            console.error('Block post error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    // Unblock post
    unblockPost: async (req, res) => {
        try {
            const post = await Post.findByIdAndUpdate(
                req.params.id,
                { isBlocked: false },
                { new: true }
            ).populate('author', 'name profilePicture');
            
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            
            res.status(200).json({ message: 'Post unblocked successfully', post });
        } catch (error) {
            console.error('Unblock post error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = adminController;
