# SafeSpace API Testing Guide

## 🧪 Testing Setup

This guide helps you verify that the SafeSpace platform is working correctly.

## ✅ Pre-Testing Checklist

- [ ] MySQL Server is running (check XAMPP Control Panel)
- [ ] Backend installed: `npm install` in "SafeSpace API"
- [ ] Backend is running: `npm start` from "SafeSpace API" folder
- [ ] Frontend accessible: http://localhost:5500 or using Live Server
- [ ] Browser console open: F12 → Console tab
- [ ] .env file configured with your MySQL credentials

## 🔍 Test 1: Server Health Check

**Objective**: Verify backend is running

**Method 1: Browser**
1. Open browser
2. Navigate to: `http://localhost:5000/health`
3. Should see JSON response:
```json
{
  "success": true,
  "message": "SafeSpace API is running"
}
```

**Method 2: Terminal/Command Line**
```bash
curl http://localhost:5000/health
```

**Expected Result**: ✅ Response with 200 status code and JSON object

**If it fails**:
- Is the backend server running? Look for "🚀 SafeSpace API Server is running"
- Try accessing http://localhost:5000 -> should show 404 (expected for root path)

---

## 📝 Test 2: User Registration

**Objective**: Test user registration endpoint

**Method 1: Frontend Form**
1. Open http://localhost:5500/SafeSpace/SafeSpace/register.html
2. Fill out form:
   - Username: `testuser123`
   - Email: `test@example.com`
   - Password: `TestPass123!@#` (must meet requirements)
   - Confirm Password: `TestPass123!@#`
   - Check "I agree to terms"
3. Click "Create Account"
4. Check browser console for success message

**Expected Result**: ✅ Redirected to dashboard.html after 1.5 seconds

**Method 2: cURL**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser456",
    "email": "test456@example.com",
    "password": "TestPass123!@#",
    "anonymous_nickname": "Peaceful"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser123",
    "email": "test@example.com"
  }
}
```

**Verify in MySQL**:
```sql
SELECT * FROM safespace_db.users;
```

**If it fails**:
- Check error message in browser console
- Verify all password requirements are met
- Ensure email is in valid format
- Check that username is unique (try registering twice)
- Look for database connection errors in server terminal

---

## 🔐 Test 3: User Login

**Objective**: Test login endpoint

**Method 1: Frontend Form**
1. Open http://localhost:5500/SafeSpace/SafeSpace/login.html
2. Fill out form:
   - Email: `test@example.com` (from previous registration)
   - Password: `TestPass123!@#`
   - Check "Remember Me" (optional)
3. Click "Login"

**Expected Result**: ✅ Redirected to dashboard.html

**Method 2: cURL**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!@#"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser123",
    "email": "test@example.com"
  }
}
```

**Verify in Browser**:
1. Open DevTools (F12)
2. Go to Application → localStorage
3. Should see `token` and `user` stored

**If it fails**:
- Verify email and password are correct
- Check that user was successfully registered
- Look for login error message in console
- Verify MySQL is returning the user

---

## 📝 Test 4: Create Post

**Objective**: Test post creation with authentication

**Prerequisite**: Must have JWT token from login (Test 3)

**Method 1: Frontend Form**
1. Login successfully (Test 3)
2. Click "Create Post" or navigate to create-post.html
3. Fill out form:
   - Content: "This is my first post! Feeling hopeful today."
   - Mood: Select happy emoji
   - Trigger Warnings: Select none (or select some)
   - Check/uncheck "Post as Anonymous"
4. Click "Post"

**Expected Result**: ✅ Success notification appears, form clears

**Method 2: cURL (with token)**
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Testing post creation API",
    "mood": "happy",
    "is_anonymous": true,
    "trigger_warnings": []
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "content": "Testing post creation API",
    "mood": "happy",
    "is_anonymous": 1,
    "trigger_warnings": "[]",
    "is_deleted": 0,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Verify in MySQL**:
```sql
SELECT * FROM safespace_db.posts;
```

**If it fails**:
- Verify token is valid and included in header
- Check that content is not empty
- Verify mood is a valid value
- Look for character count error (max 500)
- Check token expiration (7 days)

---

## 💬 Test 5: Get All Posts

**Objective**: Test retrieving posts

**Method 1: Frontend**
1. Login successfully
2. Navigate to support.html
3. Check that posts are displayed

**Method 2: cURL**
```bash
curl -X GET "http://localhost:5000/api/posts?page=1&limit=10"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "author": "Anonymous",
      "content": "Testing post creation API",
      "mood": "happy",
      "likes": 0,
      "comment_count": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

**If it fails**:
- Check that posts exist in database
- Verify database query is working
- Look for sorting/pagination errors

---

## 💭 Test 6: Create Comment

**Objective**: Test commenting on posts

**Prerequisite**: Must have JWT token and a post ID

**Method 1: Frontend**
1. Login successfully
2. Navigate to support.html
3. Click on a post
4. Scroll to comments section
5. Type comment: "Great post! Thanks for sharing."
6. Click "Reply" or "Add Comment"

**Expected Result**: ✅ Comment appears in list

**Method 2: cURL**
```bash
curl -X POST http://localhost:5000/api/posts/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Great post! Thanks for sharing.",
    "is_anonymous": false
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": 1,
    "post_id": 1,
    "user_id": 1,
    "content": "Great post! Thanks for sharing.",
    "is_anonymous": 0,
    "is_deleted": 0,
    "created_at": "2024-01-15T10:35:00.000Z"
  }
}
```

**Verify in MySQL**:
```sql
SELECT * FROM safespace_db.comments;
```

**If it fails**:
- Verify post exists (check post_id)
- Verify token is valid
- Check that content is not empty
- Look for character count error

---

## 🔄 Test 7: Update Post

**Objective**: Test editing a post

**Method 1: cURL**
```bash
curl -X PUT http://localhost:5000/api/posts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Updated post content - feeling even better!"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Post updated successfully"
}
```

**If it fails**:
- Verify you own the post (user_id matches)
- Check that post_id exists
- Verify content is not empty

---

## 🗑️ Test 8: Delete Post

**Objective**: Test soft deleting a post

**Method 1: cURL**
```bash
curl -X DELETE http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

**Verify in MySQL**:
```sql
SELECT * FROM safespace_db.posts WHERE id = 1;
```
Should show `is_deleted = 1`

**If it fails**:
- Verify you own the post
- Check that post exists
- Verify token is valid

---

## 🛡️ Test 9: Authentication Protection

**Objective**: Verify protected endpoints require authentication

**Method 1: Try accessing without token**
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test post",
    "mood": "happy",
    "is_anonymous": true,
    "trigger_warnings": []
  }'
```

**Expected Response**: ❌ 401 Unauthorized
```json
{
  "success": false,
  "message": "Authorization required"
}
```

**If it fails**:
- Check that authMiddleware is properly restricting access
- Verify middleware is applied to protected routes

---

## 📊 Test 10: Database Verification

**Objective**: Verify database tables and structure

**Method 1: MySQL CLI**
```sql
USE safespace_db;
SHOW TABLES;
```

**Expected Tables**:
- users
- posts
- comments
- reactions
- mood_entries
- journal_entries
- reports
- notifications

**Method 2: Check Schema**
```sql
DESCRIBE users;
DESCRIBE posts;
DESCRIBE comments;
```

**Expected Columns**:
- users: id, username, email, password_hash, is_anonymous, created_at, updated_at
- posts: id, user_id, content, mood, is_anonymous, trigger_warnings, is_deleted, created_at
- comments: id, post_id, user_id, content, is_anonymous, is_deleted, created_at

---

## 🔗 Integration Test Checklist

- [ ] User registers → Data in users table
- [ ] User logs in → Token generated and returned
- [ ] Token stored → localStorage contains token
- [ ] Protected page prevents access → Redirected to login
- [ ] Create post → Data in posts table
- [ ] Get posts → Returns from database
- [ ] Create comment → Data in comments table
- [ ] Update post → Content changes in database
- [ ] Delete post → is_deleted flag set to 1
- [ ] Soft delete → Post hidden from GET requests

---

## 🐛 Debugging Tips

### 1. Check Server Logs
Look at the terminal where `npm start` is running for:
- Database connection messages
- SQL queries
- Error messages
- Route handling logs

### 2. Check Browser Console (F12)
- JavaScript errors
- Network requests (Network tab)
- API responses
- localStorage contents (Application tab)

### 3. Check MySQL Logs
```bash
# In XAMPP, check MySQL error logs
C:\xampp\mysql\data\mysql_error.log
```

### 4. Test Endpoints with Postman
1. Import API endpoints
2. Test each endpoint individually
3. Save responses as references
4. Use environment variables for token

### 5. Verify Environment Variables
```bash
# In terminal, where you run npm start
echo %DB_HOST%
echo %DB_USER%
echo %JWT_SECRET%
```

---

## 📈 Performance Testing

**Load Test - Get Posts**
```bash
# Send 100 requests
for ($i=1; $i -le 100; $i++) {
  Invoke-WebRequest http://localhost:5000/api/posts
}
```

**Stress Test - Create Posts**
```bash
# Create 50 posts rapidly
for ($i=1; $i -le 50; $i++) {
  curl -X POST http://localhost:5000/api/posts `
    -H "Content-Type: application/json" `
    -H "Authorization: Bearer TOKEN" `
    -d "{`"content`":`"Post $i`",`"mood`":`"happy`"}"
}
```

---

## ✅ Full Test Completion Checklist

After running all tests, verify:

- [ ] Health check passes
- [ ] Registration successful with data in database
- [ ] Login generates valid JWT token
- [ ] Posts created and stored in database
- [ ] Posts retrieved with pagination
- [ ] Comments created and linked to posts
- [ ] Posts can be updated
- [ ] Posts can be soft deleted
- [ ] Protected endpoints reject unauthorized requests
- [ ] All database tables have correct structure
- [ ] No JavaScript errors in console
- [ ] No SQL errors in terminal

---

## 🎯 Expected Test Results Summary

| Test | Expected Result | Status |
|------|-----------------|--------|
| Health Check | 200 OK | ✅ |
| Register | User created, token returned | ✅ |
| Login | JWT token generated | ✅ |
| Create Post | Post in database | ✅ |
| Get Posts | Posts returned with pagination | ✅ |
| Create Comment | Comment linked to post | ✅ |
| Update Post | Content changed in DB | ✅ |
| Delete Post | is_deleted flag set | ✅ |
| Auth Protection | 401 without token | ✅ |
| Database | All tables created | ✅ |

---

## 💡 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/posts" | Backend not running. Run `npm start` |
| "CORS error" | Check frontend URL matches CORS origin |
| "Database connection failed" | Start MySQL, check .env credentials |
| "Cannot read property 'get'" | Ensure express-validator is installed |
| "Unexpected token <" in JSON | Backend returned HTML, not JSON (404 page) |
| "Token invalid" | Token may be expired or malformed |
| "Duplicate entry for key" | Email or username already exists |

---

## 📞 Support

If tests fail:
1. Check the specific error message
2. Consult the solutions table above
3. Review server terminal logs
4. Check browser console (F12)
5. Verify .env configuration
6. Ensure MySQL is running
7. Try restarting both servers

---

**All tests passing? 🎉 SafeSpace is ready to go!**
