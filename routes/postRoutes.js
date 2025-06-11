const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Create post with image upload
router.post('/', upload.array('images', 4), postController.createPost);

// Get all posts
router.get('/', postController.getAllPosts);

// Get user's posts
router.get('/user/:userId', postController.getUserPosts);

// Update post
router.put('/:id', upload.array('images', 4), postController.updatePost);

// Delete post
router.delete('/:id', postController.deletePost);

// Like/unlike post
router.post('/:id/like', postController.likePost);

// Add comment
router.post('/:id/comments', postController.addComment);

// Edit comment
router.put('/:id/comments/:commentId', postController.editComment);

// Delete comment
router.delete('/:id/comments/:commentId', postController.deleteComment);

// Add reply to a comment
router.post('/:id/comments/:commentId/replies', postController.addReply);

// Edit reply
router.put('/:id/comments/:commentId/replies/:replyId', postController.editReply);

// Delete reply
router.delete('/:id/comments/:commentId/replies/:replyId', postController.deleteReply);

module.exports = router;
