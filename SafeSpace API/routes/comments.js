const express = require('express');
const { pool } = require('../database');
const { authMiddleware } = require('../middleware');
const { body, validationResult } = require('express-validator');

const router = express.Router({ mergeParams: true });

// Get comments for a post
router.get('/', async (req, res) => {
    try {
        const { postId } = req.params;
        const connection = await pool.getConnection();

        const [comments] = await connection.execute(`
            SELECT 
                c.*,
                CASE WHEN c.is_anonymous THEN "Anonymous" ELSE u.username END as author
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ? AND c.is_deleted = FALSE
            ORDER BY c.created_at DESC
        `, [postId]);

        connection.release();

        res.json({
            success: true,
            data: comments
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching comments',
            error: error.message 
        });
    }
});

// Create comment
router.post('/', authMiddleware, [
    body('content').isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1-500 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { postId } = req.params;
        const { content, is_anonymous } = req.body;
        const userId = req.user.userId;

        const connection = await pool.getConnection();

        // Check if post exists
        const [posts] = await connection.execute(
            'SELECT id FROM posts WHERE id = ? AND is_deleted = FALSE',
            [postId]
        );

        if (posts.length === 0) {
            connection.release();
            return res.status(404).json({ 
                success: false,
                message: 'Post not found' 
            });
        }

        const [result] = await connection.execute(
            'INSERT INTO comments (post_id, user_id, content, is_anonymous) VALUES (?, ?, ?, ?)',
            [postId, userId, content, is_anonymous !== false]
        );

        const [comment] = await connection.execute(
            'SELECT * FROM comments WHERE id = ?',
            [result.insertId]
        );

        // Create notification for post owner
        const [post] = await connection.execute(
            'SELECT user_id FROM posts WHERE id = ?',
            [postId]
        );

        if (post[0].user_id !== userId) {
            await connection.execute(
                'INSERT INTO notifications (user_id, type, title, message, related_post_id) VALUES (?, ?, ?, ?, ?)',
                [post[0].user_id, 'reply', 'New Reply on Your Post', 'Someone replied to your post', postId]
            );
        }

        connection.release();

        res.status(201).json({
            success: true,
            message: 'Comment created successfully',
            data: comment[0]
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating comment',
            error: error.message 
        });
    }
});

// Update comment
router.put('/:commentId', authMiddleware, async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const connection = await pool.getConnection();

        // Check if user owns the comment
        const [comments] = await connection.execute(
            'SELECT user_id FROM comments WHERE id = ? AND post_id = ?',
            [commentId, postId]
        );

        if (comments.length === 0 || comments[0].user_id !== userId) {
            connection.release();
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to update this comment' 
            });
        }

        await connection.execute(
            'UPDATE comments SET content = ? WHERE id = ?',
            [content, commentId]
        );

        connection.release();

        res.json({
            success: true,
            message: 'Comment updated successfully'
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating comment',
            error: error.message 
        });
    }
});

// Delete comment
router.delete('/:commentId', authMiddleware, async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const userId = req.user.userId;

        const connection = await pool.getConnection();

        // Check if user owns the comment
        const [comments] = await connection.execute(
            'SELECT user_id FROM comments WHERE id = ? AND post_id = ?',
            [commentId, postId]
        );

        if (comments.length === 0 || comments[0].user_id !== userId) {
            connection.release();
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to delete this comment' 
            });
        }

        await connection.execute(
            'UPDATE comments SET is_deleted = TRUE WHERE id = ?',
            [commentId]
        );

        connection.release();

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting comment',
            error: error.message 
        });
    }
});

module.exports = router;
