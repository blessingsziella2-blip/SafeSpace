require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeDatabase } = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        
        // Allow all localhost variants and common dev servers
        const allowedOrigins = [
            'http://localhost',
            'http://localhost:80',
            'http://localhost:3000',
            'http://localhost:5000',
            'http://localhost:5500',
            'http://localhost:8000',
            'http://localhost:8080',
            'http://127.0.0.1',
            'http://127.0.0.1:80',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:8080',
            'http://localhost:443',
            'https://localhost',
            'https://127.0.0.1'
        ];
        
        if (allowedOrigins.includes(origin) || !origin || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        success: true,
        message: 'SafeSpace API is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts/:postId/comments', commentRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        console.log('🔄 Initializing database...');
        await initializeDatabase();
        console.log('✅ Database initialized successfully');

        app.listen(PORT, () => {
            console.log(`\n🚀 SafeSpace API Server is running on http://localhost:${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📚 Available endpoints:`);
            console.log(`   - GET  /health - Health check`);
            console.log(`   - POST /api/auth/register - User registration`);
            console.log(`   - POST /api/auth/login - User login`);
            console.log(`   - GET  /api/posts - Get all posts`);
            console.log(`   - POST /api/posts - Create post`);
            console.log(`   - GET  /api/posts/:id - Get post with comments`);
            console.log(`   - GET  /api/posts/:postId/comments - Get comments`);
            console.log(`   - POST /api/posts/:postId/comments - Add comment`);
            console.log(`\n✨ Press Ctrl+C to stop the server\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message || error);
        console.error('Full error:', error);
        process.exit(1);
    }
}

startServer();
