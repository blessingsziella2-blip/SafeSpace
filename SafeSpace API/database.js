const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize database tables
async function initializeDatabase() {
    let connection;
    let dbConnection;
    
    try {
        // First connection without database to create the database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        // Create database if not exists
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log('✓ Database created/verified');

        // Close first connection
        await connection.end();

        // Create a new connection WITH the database selected
        dbConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Create Users table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                anonymous_nickname VARCHAR(255),
                is_anonymous BOOLEAN DEFAULT TRUE,
                profile_bio TEXT,
                profile_private BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('✓ Users table created/verified');

        // Create Posts table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                mood VARCHAR(50),
                is_anonymous BOOLEAN DEFAULT TRUE,
                trigger_warnings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_deleted BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Posts table created/verified');

        // Create Comments table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                is_anonymous BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_deleted BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Comments table created/verified');

        // Create Reactions table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS reactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                reaction_type VARCHAR(50) DEFAULT 'like',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_reaction (post_id, user_id),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Reactions table created/verified');

        // Create Mood Tracking table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS mood_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                mood VARCHAR(50) NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date DATE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Mood Entries table created/verified');

        // Create Journal Entries table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS journal_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255),
                content TEXT NOT NULL,
                mood VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_deleted BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Journal Entries table created/verified');

        // Create Reports table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT,
                comment_id INT,
                reported_by INT NOT NULL,
                reason VARCHAR(255),
                description TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL
            )
        `);
        console.log('✓ Reports table created/verified');

        // Create Notifications table
        await dbConnection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255),
                message TEXT,
                related_post_id INT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (related_post_id) REFERENCES posts(id) ON DELETE SET NULL
            )
        `);
        console.log('✓ Notifications table created/verified');

        console.log('\n✅ All database tables initialized successfully!\n');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        if (dbConnection) {
            await dbConnection.end();
        }
    }
}

module.exports = { pool, initializeDatabase };
