const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../database');
const { generateToken } = require('../middleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Register Route
router.post('/register', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { username, email, password, anonymous_nickname } = req.body;

        const connection = await pool.getConnection();

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({ 
                success: false,
                message: 'User with this email or username already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password_hash, anonymous_nickname) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, anonymous_nickname || 'Anonymous']
        );

        const userId = result.insertId;
        const token = generateToken(userId, username);

        connection.release();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
                username,
                email,
                anonymous_nickname: anonymous_nickname || 'Anonymous'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error during registration',
            error: error.message 
        });
    }
});

// Login Route
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const connection = await pool.getConnection();

        // Get user
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            connection.release();
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Update last login
        await connection.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        const token = generateToken(user.id, user.username);

        connection.release();

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                anonymous_nickname: user.anonymous_nickname
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error during login',
            error: error.message 
        });
    }
});

// Forgot Password Route (Send Reset Email)
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        const { email } = req.body;
        const connection = await pool.getConnection();

        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        connection.release();

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // In production, send actual email with reset token
        res.json({
            success: true,
            message: 'Password reset email sent (simulated)' 
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing request',
            error: error.message 
        });
    }
});

module.exports = router;
