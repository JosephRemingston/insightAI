# InsightAI API

A secure authentication and database connection management API built with Express.js, JWT, Redis, and MongoDB.

## 🚀 Features

- ✅ User Authentication (Signup/Login/Logout)
- ✅ JWT-based token authentication with access & refresh tokens
- ✅ Redis integration for fast token management
- ✅ Token blacklisting on logout
- ✅ Password hashing with bcrypt
- ✅ MongoDB with Mongoose ODM
- ✅ Encrypted database connection storage (AES-256-GCM)
- ✅ Protected routes with JWT middleware
- ✅ Environment-based configuration
- ✅ Standardized error handling
- ✅ Health check endpoint

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Redis server

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd insightAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/insightai

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
-min-32-chars
   REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars

   # Database Encryption (for storing encrypted MongoDB URIs)
   DB_ENCRYPTION_KEY=your-encryption-secret-key-here-min-32-chars
   ```

   **Generate secure secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"duction!)
   ACCESS_TOKEN_SECRET=your-access-token-secret
   REFRESH_TOKEN_SECRET=your-refresh-token-secret
   ```

4. **Start Redis server** (if running locally)
   ```bash
   redis-server
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🔑 API Endpoints

### Health Check
```http
GET /health
```
Returns API health status and uptime.

### Authentication

#### 1. Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Refresh Token (Get new access token)
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```

#### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": {}
}
```

### Database Connections (Protected Routes)

#### Save Encrypted MongoDB Connection
```http
POST /api/connections
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "mongoUri": "mongodb://username:password@host:port/database",
  "name": "Production Database"
}
```database.js     # MongoDB connection configuration
│   ├── jwt.js          # JWT utilities and token management
│   ├── redis.js        # Redis client configuration
│   └── encryption.js   # AES-256-GCM encryption for database URIs
├── controllers/
│   ├── auth.controller.js       # Authentication logic (signup, login, logout, refresh)
│   └── connection.controllor.js # Database connection management
├── middlewares/
│   └── auth.middlware.js   # JWT verification and authentication middleware
├── models/
│   ├── user.models.js       # User schema with password hashing
│   └── connection.models.js # Database connection schema
├── routes/
│   └── auth.routes.js  # Authentication routes
├── utils/
│   ├── ApiError.js     # Custom error class for standardized errors
│   ├── ApiResponse.js  # Standardized API response formatter
│   ├── asyncHandler.js # Async error handler wrapper
│   └── logentries.js   # Logging utility
├── .env                # Environment variables (not committed)
├── .gitignore         
├── index.js            # Application entry point
├── package.json        # Dependencies and scripts
└── README.md           # This file
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
database.js     # MongoDB connection configuration
│   ├── jwt.js         validation currently (see TODO)

### Database Connection Encryption
- MongoDB URIs are encrypted using **AES-256-GCM** before storage
- Each encrypted value includes an IV (initialization vector) and authentication tag
- Encryption key derived from `DB_ENCRYPTION_KEY` using SHA-256
- Stored connections are tied to user accounts (protected by authenticationement
│   └── redis.js        # Redis client configuration
├── controllers/
│   └── auth.controller.js  # Authentication logic (signup, login, logout, refresh)
├── middlewares/
│   └── auth.middlware.js   # JWT verification middleware
├── models/
│   └── user.models.js  # User schema and methods
├── routes/
│   └── auth.routes.js  # Authentication routes
├── utils/
│   ├── ApiError.js     # Custom error class
│   ├── ApiResponse.js  # Standardized API responses
│   ├── asyncHandler.js # Async error handler wrapper
│   └── logentries.js   # Logging utility
├── .env                # Environment variables (not in repo)
├── .gitignore         
├── index.js            # Application entry point
├── package.json        # Dependencies and scripts
└── README.md           # This fileken from Redis
- User must login again to get new tokens

## 🏗️ Project Structure

```
insightAI/
├── configs/
│   ├── jwt.js          # JWT utilities and token management
│   └── redis.js        # Redis client configuration
├── controllers/
│   └── auth.controller.js  # Authentication logic
├── middlewares/
│   └── auth.middleware.js  # JWT verification middleware
├── models/
│   └── user.models.js  # User schema and methods
├── routes/
│   └── auth.routes.js  # Authentication routes
├── utils/
│   ├── ApiError.js     # Custom error class
│   ├── mongoUri":"mongodb://localhost:27017/mydb","name":"Local Dev"}'
- **Token Rotation**: New refresh tokens overwrite old ones on login (prevents race conditions)
- **Middleware Protection**: Protected routes verify token validity and check blacklist
Version | Purpose |
|---------|---------|---------|
| express | ^5.2.1 | Web framework |
| mongoose | ^9.0.2 | MongoDB ODM |
| ioredis | ^5.8.2 | Redis client for token storage |
| jsonwebtoken | ^9.0.3 | JWT authentication |
| bcrypt | ^6.0.0 | Password hashing |
| cors | ^2.8.5 | Cross-origin resource sharing |
| dotenv | ^17.2.3 | Environment variable management |

**Dev Dependencies:**
- nodemon (via `npm run dev`) - Auto-restart on file changes
```
Redis Data Structure:
├── refresh:<userId>      → Stores refresh token (7 days TTL)
└── blacklist:<token>     → Blacklisted access tokens (TTL = remaining token lifetime)
```379 | Redis server port |
| REDIS_PASSWORD | No | - | Redis password (if required) |
| ACCESS_TOKEN_SECRET | Yes | - | Secret for signing access tokens |
| REFRESH_TOKEN_SECRET | Yes | - | Secret for signing refresh tokens |
| DB_ENCRYPTION_KEY | Yes | - | Secret for encrypting database URIs |

**Security Note:** Generate strong random secrets for production:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚨 Error Handling

All errors return a standardized format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "data": {}
}
```

Common status codes:
- `200` - Success
- `400` - Bad Request (validation errors, invalid credentials)
- `401` - Unauthorized (invalid/missing/expired token)
- `409` - Conflict (user already exists)
- `500` - Internal Server Error
- `510` - Programmer Error (code-level errors, misconfiguration)

### Authentication Flow
1. **Login**: User provides credentials → Access & Refresh tokens generated → Refresh token stored in Redis
2. **API Access**: Client sends access token → Middleware verifies token & checks blacklist → Grants access
3. **Token Refresh**: Client sends refresh token → Verified against Redis → New access token issued
4. **Logout**: Access token blacklisted → Refresh token deleted from Redis → User must re-login refresh:<userId>      → Stores refresh token (7 days TTL)
└── blacklist:<token>     → Blacklisted access tokens (15 min TTL)
```

## 🧪 Testing the API

### Using cURL

**Sign Up:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -HCritical Fixes Needed
   ```bash
   redis-server
   # In another terminal: redis-cli ping
   ```
2. **MongoDB connection failed**: Check MONGODB_URI and network access
3. **JWT errors**: Verify ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are set
4. **Port already in use**: Change PORT in .env or stop the process using port 3000
5. **Encryption key error**: Ensure DB_ENCRYPTION_KEY is set in .env (min 32 chars)
6. **Invalid key length**: DB_ENCRYPTION_KEY must be at least 32 characters

## 🧪 Testing

### Manual Testing with cURL
See the cURL examples above for testing each endpoint.

### Recommended Testing Flow
1. **Signup** → Get user created
2. **Login** → Get access & refresh tokens
3. **Create Connection** → Use access token to save encrypted DB URI
4. **Logout** → Invalidate tokens
5. **Try accessing protected route** → Should fail with 401

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Contains sensitive secrets
2. **Use strong secrets** - Generate with `crypto.randomBytes(64)`
3. **HTTPS in production** - Always use SSL/TLS
4. **Rate limiting** - Implement to prevent brute force attacks (TODO)
5. **Input validation** - Validate and sanitize all user inputs (TODO)
6. **Regular updates** - Keep dependencies updated for security patches

## 🎯 TODO / Future Enhancements

### Critical Fixes Needed
- [ ] Fix middleware error handling (use `throw ApiError` instead of `return ApiResponse`)
- [ ] Change `var` to `const`/`let` throughout codebase
- [ ] Remove unused `refreshToken` field from User model

### High Priority
- [ ] Add password strength validation (minimum length, complexity)
- [ ] Add email format validation
- [ ] Rate limiting for login/signup endpoints (prevent brute force)
- [ ] Implement connection retrieval/deletion endpoints
- [ ] Connection decryption utility
- [ ] Input sanitization (trim email, etc.)
- [ ] Add proper logging utility (replace console.log)

### Medium Priority
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Password change endpoint
- [ ] User profile endpoints (get/update user)
- [ ] Refresh token rotation on use
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit and integration tests
- [ ] Better error messages for database/Redis failures

### Low Priority
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Session management dashboard
- [ ] Admin panel for user management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

---

**⚠️ Security Reminder:** Always keep your `.env` file secure and never commit it to version control!
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

⚠️ **Important**: Never use default secrets in production! Always generate unique secrets.

### MongoDB Connection
The app connects to MongoDB using the URI from `.env`. Options:
- **Local**: `mongodb://localhost:27017/insightai`
- **Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/insightai`

### Redis Connection
Ensure Redis is running before starting the app:
```bash
# Start Redis locally
redis-server

# Check Redis connection
redis-cli ping
# Should return: PONG
```

### Running in Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Common Issues
1. **Redis connection failed**: Ensure Redis server is running
2. **MongoDB connection failed**: Check MONGODB_URI and network access
3. **JWT errors**: Verify ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are set
4. **Port already in use**: Change PORT in .env or stop the process using port 3000 | Secret for access tokens |
| REFRESH_TOKEN_SECRET | Yes | - | Secret for refresh tokens |

## 🚨 Error Handling

All errors return a standardized format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "data": {}
}
```

Common status codes:
- `200` - Success
- `400` - Bad Request
### High Priority
- [ ] Add password strength validation (minimum length, complexity)
- [ ] Add email format validation
- [ ] Rate limiting for login/signup endpoints (prevent brute force)
- [ ] Add proper logging utility (replace console.log)
- [ ] Redis error handling and fallback mechanisms
- [ ] Input sanitization (trim email, etc.)

### Medium Priority
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Refresh token rotation on use
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit and integration tests
- [ ] Better error messages for database/Redis failures

### Low Priority
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] User profile management
- [ ] Session management dashboard(require('crypto').randomBytes(64).toString('hex'))"
```

### MongoDB Connection
The app currently connects to MongoDB Atlas. For local development, use:
```env
MONGODB_URI=mongodb://localhost:27017/insightai
```

## 🎯 TODO / Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Refresh token rotation
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 👤 Author

Joseph Remington

## 📄 License

ISC

---

**Note:** Remember to keep your `.env` file secure and never commit it to version control.
