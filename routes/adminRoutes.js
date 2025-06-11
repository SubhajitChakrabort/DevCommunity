const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', adminController.login);

// Protected routes (require admin authentication)
router.get('/stats', adminController.getStats);

// User routes - note the order: specific routes before parameter routes
router.get('/users/analytics', adminController.getUserAnalytics);
router.get('/users/search', adminController.searchUsers);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.get('/users/:id/posts-count', adminController.getUserPostsCount);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);
router.get('/users/:userId/activity', adminController.getUserActivity);

// Post routes
router.get('/posts/stats', adminController.getPostsStats);
router.get('/posts/search', adminController.searchPosts);
router.get('/posts', adminController.getPosts);
router.get('/posts/:id', adminController.getPostById);
router.put('/posts/:id/block', adminController.blockPost);
router.put('/posts/:id/unblock', adminController.unblockPost);

module.exports = router;
