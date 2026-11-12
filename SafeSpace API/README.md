# SafeSpace - Mental Health Support Platform

A comprehensive, anonymous mental health support platform built with Node.js/Express backend and responsive HTML/CSS/JavaScript frontend.

## 📋 Project Structure

```
SafeSpace/
├── SafeSpace/                 # Frontend files
│   ├── index.html            # Home page
│   ├── register.html         # User registration
│   ├── login.html            # User login
│   ├── dashboard.html        # User dashboard
│   ├── support.html          # Anonymous support feed
│   ├── create-post.html      # Create anonymous posts
│   ├── mood-tracker.html     # Daily mood tracking
│   ├── journal.html          # Private journal
│   ├── resources.html        # Mental health resources
│   ├── emergency.html        # Crisis resources
│   ├── chat.html             # Peer support chat
│   ├── notifications.html    # User notifications
│   ├── profile-settings.html # User settings
│   ├── about.html            # About page
│   ├── css/
│   │   └── style.css         # All styles (2000+ lines)
│   └── js/
│       └── script.js         # Frontend logic + API integration
│
└── SafeSpace API/            # Backend API
    ├── server.js             # Express server
    ├── database.js           # Database connection & initialization
    ├── middleware.js         # JWT authentication
    ├── package.json          # Dependencies
    ├── .env                  # Configuration
    └── routes/
        ├── auth.js           # Authentication endpoints
        ├── posts.js          # Posts CRUD operations
        └── comments.js       # Comments CRUD operations
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MySQL Server installed and running
- XAMPP or similar (Apache + MySQL stack)

### Installation Steps

#### 1. Set up the Backend API

```bash
# Navigate to the API directory
cd "SafeSpace API"

# Install dependencies
npm install

# Verify dependencies installed successfully
npm list
```

#### 2. Configure the Database

Edit the `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=safespace_db
PORT=5000
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
API_URL=http://localhost:5000
```

#### 3. Start the Backend Server

```bash
# From the "SafeSpace API" directory
npm start
```

Expected output:
```
🔄 Initializing database...
✅ Database initialized successfully

🚀 SafeSpace API Server is running on http://localhost:5000
📍 Environment: development
📚 Available endpoints:
   - GET  /health - Health check
   - POST /api/auth/register - User registration
   - POST /api/auth/login - User login
   - GET  /api/posts - Get all posts
   - POST /api/posts - Create post
   - GET  /api/posts/:id - Get post with comments
   - GET  /api/posts/:postId/comments - Get comments
   - POST /api/posts/:postId/comments - Add comment
```

#### 4. Access the Frontend

Open your browser and navigate to:
```
http://localhost:5500/SafeSpace/SafeSpace/index.html
```
or
```
http://127.0.0.1:5500/SafeSpace/SafeSpace/index.html
```

(If using Live Server extension in VS Code, right-click index.html → "Open with Live Server")

## 🔐 Authentication Flow

### Registration
1. User fills out registration form with username, email, password
2. Frontend sends POST request to `/api/auth/register`
3. Backend validates input and checks for duplicates
4. Password is hashed with bcryptjs (10 salt rounds)
5. User record is created in database
6. JWT token is generated and returned
7. Token is stored in localStorage
8. User is redirected to dashboard

### Login
1. User enters email and password
2. Frontend sends POST request to `/api/auth/login`
3. Backend queries user by email
4. Password is verified using bcryptjs
5. JWT token is generated and returned
6. `last_login` timestamp is updated
7. Token is stored in localStorage
8. User is redirected to dashboard

### Subsequent Requests
- Token is automatically included in Authorization header
- Format: `Authorization: Bearer <token>`
- Server validates token before processing request

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `anonymous_nickname` - Optional anonymity setting
- `is_anonymous` - Boolean flag
- `profile_bio` - User bio
- `profile_private` - Privacy setting
- `is_active` - Account status
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp
- `last_login` - Last login timestamp

### Posts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `content` - Post text (max 500 chars)
- `mood` - User's mood at posting
- `is_anonymous` - Whether post is anonymous
- `trigger_warnings` - JSON array of warnings
- `is_deleted` - Soft delete flag
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Comments Table
- `id` - Primary key
- `post_id` - Foreign key to posts
- `user_id` - Foreign key to users
- `content` - Comment text
- `is_anonymous` - Whether comment is anonymous
- `is_deleted` - Soft delete flag
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Reactions Table
- `id` - Primary key
- `post_id` - Foreign key to posts
- `user_id` - Foreign key to users
- `reaction_type` - Type of reaction (like, support, etc.)
- `created_at` - Reaction timestamp
- Unique constraint on (post_id, user_id)

### Mood Entries Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `mood` - Mood selection
- `notes` - Optional notes
- `date` - Date of entry
- `created_at` - Timestamp

### Journal Entries Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Entry title
- `content` - Entry content
- `mood` - Optional mood
- `is_deleted` - Soft delete flag
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Reports Table
- `id` - Primary key
- `post_id` - Foreign key to posts (optional)
- `comment_id` - Foreign key to comments (optional)
- `reported_by` - Foreign key to users
- `reason` - Report reason
- `description` - Report details
- `status` - Report status (pending, resolved, dismissed)
- `created_at` - Report timestamp

### Notifications Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `type` - Notification type (reply, reminder, alert)
- `title` - Notification title
- `message` - Notification message
- `related_post_id` - Foreign key to posts (optional)
- `is_read` - Read status
- `created_at` - Notification timestamp

## 🛠️ API Endpoints

### Authentication Routes (`/api/auth`)

**Register**
```
POST /api/auth/register
Body: {
  "username": "string",
  "email": "string",
  "password": "string",
  "anonymous_nickname": "string (optional)"
}
Response: {
  "success": true,
  "token": "jwt_token",
  "user": { id, username, email }
}
```

**Login**
```
POST /api/auth/login
Body: {
  "email": "string",
  "password": "string"
}
Response: {
  "success": true,
  "token": "jwt_token",
  "user": { id, username, email }
}
```

### Posts Routes (`/api/posts`)

**Get All Posts**
```
GET /api/posts?page=1&limit=10
Response: {
  "success": true,
  "data": [{ post objects }],
  "pagination": { page, limit, total, pages }
}
```

**Create Post** (requires authentication)
```
POST /api/posts
Headers: Authorization: Bearer {token}
Body: {
  "content": "string",
  "mood": "string",
  "is_anonymous": boolean,
  "trigger_warnings": [array]
}
Response: { "success": true, "data": { post object } }
```

**Get Single Post with Comments**
```
GET /api/posts/:id
Response: {
  "success": true,
  "data": { post object with comments array }
}
```

**Update Post** (requires authentication, user must own post)
```
PUT /api/posts/:id
Headers: Authorization: Bearer {token}
Body: { "content": "string" }
Response: { "success": true, "message": "Post updated successfully" }
```

**Delete Post** (requires authentication, user must own post)
```
DELETE /api/posts/:id
Headers: Authorization: Bearer {token}
Response: { "success": true, "message": "Post deleted successfully" }
```

### Comments Routes (`/api/posts/:postId/comments`)

**Get Comments for Post**
```
GET /api/posts/:postId/comments
Response: { "success": true, "data": [comment objects] }
```

**Create Comment** (requires authentication)
```
POST /api/posts/:postId/comments
Headers: Authorization: Bearer {token}
Body: {
  "content": "string",
  "is_anonymous": boolean
}
Response: { "success": true, "data": { comment object } }
```

**Update Comment** (requires authentication, user must own comment)
```
PUT /api/posts/:postId/comments/:commentId
Headers: Authorization: Bearer {token}
Body: { "content": "string" }
Response: { "success": true, "message": "Comment updated successfully" }
```

**Delete Comment** (requires authentication, user must own comment)
```
DELETE /api/posts/:postId/comments/:commentId
Headers: Authorization: Bearer {token}
Response: { "success": true, "message": "Comment deleted successfully" }
```

## 🧪 Testing the API

### Option 1: Using cURL

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "anonymous_nickname": "Peaceful"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Create a post (use token from login response)
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "content": "Feeling great today!",
    "mood": "happy",
    "is_anonymous": true,
    "trigger_warnings": []
  }'

# Get all posts
curl -X GET "http://localhost:5000/api/posts?page=1&limit=10"
```

### Option 2: Using Postman

1. Import the API endpoints into Postman
2. Set up collection variables for token storage
3. Use the endpoints to test registration, login, post creation, and commenting

### Option 3: Using the Frontend

1. Navigate to register.html
2. Fill out the registration form
3. Submit the form (it will call the API)
4. Check the browser console for any errors
5. If successful, you'll be redirected to dashboard.html

## 🎨 Frontend Features

### Color Theme
- **Primary Blue**: #5B8DBE - Calming, trustworthy
- **Lavender**: #E6D5F0 - Soft, supportive
- **Light Teal**: #B3E5DB - Refreshing, hopeful
- **Soft Purple**: #D4B5E0 - Gentle, welcoming

### Pages Included
1. **Home** - Landing page with mission statement and quick access
2. **About** - Platform information and values
3. **Register** - New user sign-up with validation
4. **Login** - User authentication with remember me option
5. **Dashboard** - Main hub after login with quick options
6. **Support Feed** - Anonymous community posts with filtering
7. **Create Post** - Form to share anonymous thoughts
8. **Mood Tracker** - Daily mood logging with history
9. **Journal** - Private reflections and entries
10. **Resources** - Categorized mental health information
11. **Emergency** - Crisis resources and hotline numbers
12. **Chat** - Peer support messaging interface
13. **Notifications** - User notifications with filtering
14. **Profile Settings** - Account management and preferences
15. **Navigation** - Sticky navbar and responsive design

## 🔧 Troubleshooting

### Issue: "Database connection failed"
- Ensure MySQL server is running
- Check DB credentials in .env file
- Verify database name matches
- Try creating the database manually first

### Issue: "Cannot GET /api/posts"
- Backend server may not be running
- Check that server.js started successfully
- Verify port 5000 is not in use
- Check CORS configuration in server.js

### Issue: "CORS error" or "Failed to fetch"
- Frontend and backend may not be on correct URLs
- Update API_BASE_URL in script.js if needed
- Verify CORS origin in server.js matches frontend URL
- Check browser console for specific error

### Issue: "Input validation error"
- Check password requirements (8+ chars, uppercase, lowercase, number, special char)
- Verify email format
- Username must be 3+ characters
- Ensure no duplicate email/username

### Issue: "JWT token invalid or expired"
- Token expires after 7 days
- Clear localStorage and login again
- Check token format in Authorization header
- Verify JWT_SECRET in .env matches server

## 📝 Environment Variables

Create a `.env` file in the "SafeSpace API" directory with:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=safespace_db

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_very_secure_secret_key_at_least_32_characters_long
JWT_EXPIRE=7d

# CORS Configuration
API_URL=http://localhost:5000
```

## 🎯 Next Steps / Future Enhancements

- [ ] Create additional API routes (moods, journals, notifications)
- [ ] Implement file upload for profile pictures
- [ ] Add WebSocket support for real-time chat
- [ ] Implement email notification system
- [ ] Create admin dashboard endpoints
- [ ] Add pagination and filtering to all list endpoints
- [ ] Implement two-factor authentication
- [ ] Add API request logging
- [ ] Create unit tests for all endpoints
- [ ] Implement rate limiting
- [ ] Add request validation middleware

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console and server logs
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed

## 📄 License

SafeSpace is provided as-is for mental health support purposes.

## ⚠️ Disclaimer

SafeSpace is a support platform, not a substitute for professional mental health care. If you're experiencing a mental health crisis, please contact:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Local emergency services: 911
