const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { product_id, content, parent_id } = req.body;

        if (!product_id || !content) {
            return res.status(400).json({ error: 'Product ID and content are required' });
        }

        if (content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // If replying to a comment, validate parent exists and check nesting level
        if (parent_id) {
            const parentComment = await Comment.findById(parent_id);
            if (!parentComment) {
                return res.status(404).json({ error: 'Parent comment not found' });
            }
            
            // Check if parent comment level allows replies (max 3 levels: 0, 1, 2)
            if (parentComment.level >= 2) {
                return res.status(400).json({ error: 'Maximum nesting level reached' });
            }
        }

        const newComment = await Comment.create({
            product_id,
            user_id: req.user.id,
            content: content.trim(),
            status: 'pending',
            parent_id: parent_id || null
        });

        res.status(201).json({
            message: 'Comment created successfully',
            comment: {
                ...newComment,
                username: req.user.username
            }
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/product/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const comments = await Comment.getByProductId(productId);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', requireAdmin, async (req, res) => {
    try {
        const comments = await Comment.getAll();
        res.json(comments);
    } catch (error) {
        console.error('Error fetching all comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const commentId = req.params.id;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own comments' });
        }

        const updatedComment = await Comment.update(commentId, content.trim());

        res.json({
            message: 'Comment updated successfully',
            comment: updatedComment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const commentId = req.params.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        const result = await Comment.delete(commentId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const commentId = req.params.id;
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        res.json(comment);
    } catch (error) {
        console.error('Error fetching comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id/moderate', requireAdmin, async (req, res) => {
    try {
        const commentId = req.params.id;
        const { action, reason } = req.body;

        if (!action || !['approve', 'reject', 'flag'].includes(action)) {
            return res.status(400).json({ error: 'Valid action (approve, reject, flag) is required' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const result = await Comment.moderate(commentId, action, reason);

        res.json({
            message: `Comment ${action}ed successfully`,
            comment: result
        });
    } catch (error) {
        console.error('Error moderating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const comments = await Comment.getByUserId(userId);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching user comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
