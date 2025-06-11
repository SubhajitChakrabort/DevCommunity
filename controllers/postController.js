const Post = require('../models/Post');

const postController = {
    createPost: async (req, res) => {
        try {
            const { content, hashtags } = req.body;
            // Get user ID from the request body if not available in req.user
            //const userId = req.user ? req.user.id : req.body.userId;
            // Modify this line in the createPost function
const userId = req.user ? req.user.id : (Array.isArray(req.body.userId) ? req.body.userId[0] : req.body.userId);

            
            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }
            
            const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
            
            const hashtagArray = hashtags 
                ? hashtags.split(' ')
                    .filter(tag => tag.startsWith('#'))
                    .map(tag => tag.slice(1))
                : [];

            const post = new Post({
                author: userId,
                content,
                images,
                hashtags: hashtagArray
            });

            await post.save();
            
            const populatedPost = await Post.findById(post._id)
                .populate('author', 'name profilePicture');

            res.status(201).json(populatedPost);
        } catch (error) {
            console.error("Post creation error:", error);
            res.status(400).json({ error: error.message });
        }
    },
    
    getUserPosts: async (req, res) => {
        try {
            const posts = await Post.find({ author: req.params.userId })
                .populate('author', 'name profilePicture')
                .populate('comments.user', 'name profilePicture')
                .populate('comments.replies.user', 'name profilePicture')
                .sort('-createdAt');
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    
    
    deletePost: async (req, res) => {
        try {
            await Post.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Post deleted successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    
    updatePost: async (req, res) => {
        try {
            const { content, hashtags } = req.body;
            
            // Process hashtags
            const hashtagArray = hashtags 
                ? hashtags.split(' ')
                    .filter(tag => tag.startsWith('#'))
                    .map(tag => tag.slice(1))
                : [];
            
            // Get existing post to preserve images if no new ones uploaded
            const existingPost = await Post.findById(req.params.id);
            if (!existingPost) {
                return res.status(404).json({ error: "Post not found" });
            }
            
            // Process new images if any
            const newImages = req.files && req.files.length > 0 
                ? req.files.map(file => `/uploads/${file.filename}`) 
                : existingPost.images;
            
            const updatedPost = await Post.findByIdAndUpdate(
                req.params.id,
                {
                    content,
                    hashtags: hashtagArray,
                    images: newImages
                },
                { new: true }
            ).populate('author', 'name profilePicture');
            
            res.status(200).json(updatedPost);
        } catch (error) {
            console.error("Post update error:", error);
            res.status(400).json({ error: error.message });
        }
    },
    
    getAllPosts: async (req, res) => {
        try {
            const posts = await Post.find()
                .populate('author', 'name profilePicture')
                .populate('comments.user', 'name profilePicture')
                .populate('comments.replies.user', 'name profilePicture')
                .sort('-createdAt');
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    
    
    // Like/unlike a post
   // Add these functions to your existing postController object

   likePost: async (req, res) => {
    try {
        const userId = req.user ? req.user.id : req.body.userId;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Check if post is blocked
        if (post.isBlocked) {
            return res.status(403).json({ error: "This post has been blocked by an administrator" });
        }
        
        // Rest of the method remains the same
        const likeIndex = post.likes.indexOf(userId);
        
        if (likeIndex > -1) {
            // User already liked the post, so unlike it
            post.likes.splice(likeIndex, 1);
        } else {
            // User hasn't liked the post, so add like
            post.likes.push(userId);
        }
        
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        console.error("Like post error:", error);
        res.status(400).json({ error: error.message });
    }
},

addComment: async (req, res) => {
    try {
        const { text, userId } = req.body;
        
        if (!userId || !text) {
            return res.status(400).json({ error: "User ID and comment text are required" });
        }
        
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Check if post is blocked
        if (post.isBlocked) {
            return res.status(403).json({ error: "This post has been blocked by an administrator" });
        }
        
        // Rest of the method remains the same
        post.comments.push({
            user: userId,
            text,
            createdAt: new Date()
        });
        
        await post.save();
        
        // Return the post with populated comments
        const updatedPost = await Post.findById(post._id)
            .populate('author', 'name profilePicture')
            .populate('comments.user', 'name profilePicture');
        
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Add comment error:", error);
        res.status(400).json({ error: error.message });
    }
},

editComment: async (req, res) => {
    try {
        const { text, userId } = req.body;
        const { id: postId, commentId } = req.params;
        
        if (!userId || !text) {
            return res.status(400).json({ error: "User ID and comment text are required" });
        }
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Find the comment
        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        
        // Check if the user is the author of the comment
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "You can only edit your own comments" });
        }
        
        // Update the comment
        comment.text = text;
        comment.edited = true;
        
        await post.save();
        
        // Return the post with populated comments
        const updatedPost = await Post.findById(post._id)
            .populate('author', 'name profilePicture')
            .populate('comments.user', 'name profilePicture');
        
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Edit comment error:", error);
        res.status(400).json({ error: error.message });
    }
},

deleteComment: async (req, res) => {
    try {
        const { userId } = req.body;
        const { id: postId, commentId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Find the comment
        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        
        // Check if the user is the author of the comment
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "You can only delete your own comments" });
        }
        
        // Remove the comment
        post.comments.pull(commentId);
        
        await post.save();
        
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Delete comment error:", error);
        res.status(400).json({ error: error.message });
    }
},
// Add these functions to your existing postController object

addReply: async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comment = post.comments.id(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        if (!comment.replies) {
            comment.replies = [];
        }
        
        comment.replies.push({
            user: req.body.userId,
            text: req.body.text,
            createdAt: new Date()
        });
        
        await post.save();
        
        // Populate the user information in the replies
        const updatedPost = await Post.findById(post._id)
            .populate('author', 'name profilePicture')
            .populate('comments.user', 'name profilePicture')
            .populate('comments.replies.user', 'name profilePicture');
        
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(400).json({ error: error.message });
    }
},

editReply: async (req, res) => {
    try {
        const { text, userId } = req.body;
        const { id: postId, commentId, replyId } = req.params;
        
        if (!userId || !text) {
            return res.status(400).json({ error: "User ID and reply text are required" });
        }
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Find the comment
        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        
        // Find the reply
        const reply = comment.replies.id(replyId);
        if (!reply) {
            return res.status(404).json({ error: "Reply not found" });
        }
        
        // Check if the user is the author of the reply
        if (reply.user.toString() !== userId) {
            return res.status(403).json({ error: "You can only edit your own replies" });
        }
        
        // Update the reply
        reply.text = text;
        reply.edited = true;
        
        await post.save();
        
        // Return the post with populated comments and replies
        const updatedPost = await Post.findById(post._id)
            .populate('author', 'name profilePicture')
            .populate('comments.user', 'name profilePicture')
            .populate('comments.replies.user', 'name profilePicture');
        
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Edit reply error:", error);
        res.status(400).json({ error: error.message });
    }
},


deleteReply: async (req, res) => {
    try {
        const { userId } = req.body;
        const { id: postId, commentId, replyId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        // Find the comment
        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        
        // Find the reply
        const reply = comment.replies.id(replyId);
        if (!reply) {
            return res.status(404).json({ error: "Reply not found" });
        }
        
        // Check if the user is the author of the reply
        if (reply.user.toString() !== userId) {
            return res.status(403).json({ error: "You can only delete your own replies" });
        }
        
        // Remove the reply
        comment.replies.pull(replyId);
        
        await post.save();
        
        res.status(200).json({ message: "Reply deleted successfully" });
    } catch (error) {
        console.error("Delete reply error:", error);
        res.status(400).json({ error: error.message });
    }
}

};

module.exports = postController;
