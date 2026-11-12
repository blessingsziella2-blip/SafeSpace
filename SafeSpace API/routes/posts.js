const express = require('express');
const { pool } = require('../database');
const { authMiddleware } = require('../middleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all posts (with pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const connection = await pool.getConnection();

        // Get posts
        const [posts] = await connection.execute(`
            SELECT 
                p.id, 
                p.user_id,
                CASE WHEN p.is_anonymous THEN "Anonymous" ELSE u.username END as author,
                p.content, 
                p.mood, 
                p.trigger_warnings,
                p.created_at,
                (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as likes,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = FALSE) as comment_count
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.is_deleted = FALSE
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Get total count
        const [countResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM posts WHERE is_deleted = FALSE'
        );

        connection.release();

        res.json({
            success: true,
            data: posts,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching posts',
            error: error.message 
        });
    }
});

// Get single post with comments
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();

        // Get post
        const [posts] = await connection.execute(`
            SELECT 
                p.*,
                CASE WHEN p.is_anonymous THEN "Anonymous" ELSE u.username END as author
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ? AND p.is_deleted = FALSE
        `, [id]);

        if (posts.length === 0) {
            connection.release();
            return res.status(404).json({ 
                success: false,
                message: 'Post not found' 
            });
        }

        // Get comments
        const [comments] = await connection.execute(`
            SELECT 
                c.*,
                CASE WHEN c.is_anonymous THEN "Anonymous" ELSE u.username END as author
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ? AND c.is_deleted = FALSE
            ORDER BY c.created_at DESC
        `, [id]);

        connection.release();

        res.json({
            success: true,
            data: {
                ...posts[0],
                comments
            }
        });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching post',
            error: error.message 
        });
    }
});

// Create post
router.post('/', authMiddleware, [
    body('content').isLength({ min: 1, max: 500 }).withMessage('Content must be between 1-500 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { content, mood, is_anonymous, trigger_warnings } = req.body;
        const userId = req.user.userId;

        const connection = await pool.getConnection();

        const [result] = await connection.execute(
            'INSERT INTO posts (user_id, content, mood, is_anonymous, trigger_warnings) VALUES (?, ?, ?, ?, ?)',
            [userId, content, mood || null, is_anonymous !== false, JSON.stringify(trigger_warnings || [])]
        );

        const postId = result.insertId;

        // Fetch the created post
        const [posts] = await connection.execute(
            'SELECT * FROM posts WHERE id = ?',
            [postId]
        );

        connection.release();

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: posts[0]
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating post',
            error: error.message 
        });
    }
});

// Update post
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const connection = await pool.getConnection();

        // Check if user owns the post
        const [posts] = await connection.execute(
            'SELECT user_id FROM posts WHERE id = ?',
            [id]
        );

        if (posts.length === 0 || posts[0].user_id !== userId) {
            connection.release();
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to update this post' 
            });
        }

        await connection.execute(
            'UPDATE posts SET content = ? WHERE id = ?',
            [content, id]
        );

        connection.release();

        res.json({
            success: true,
            message: 'Post updated successfully'
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating post',
            error: error.message 
        });
    }
});

// Delete post
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const connection = await pool.getConnection();

        // Check if user owns the post
        const [posts] = await connection.execute(
            'SELECT user_id FROM posts WHERE id = ?',
            [id]
        );

        if (posts.length === 0 || posts[0].user_id !== userId) {
            connection.release();
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to delete this post' 
            });
        }

        await connection.execute(
            'UPDATE posts SET is_deleted = TRUE WHERE id = ?',
            [id]
        );

        connection.release();

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting post',
            error: error.message 
        });
    }
});

module.exports = router;
