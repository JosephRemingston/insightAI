# InsightAI API

A secure authentication and database connection management API built with Express.js, JWT, Redis, and MongoDB.

## 🚀 Features

- **User Authentication**: Complete Signup, Login, and Logout flow.
- **JWT Authentication**: Secure access using short-lived Access Tokens and long-lived Refresh Tokens.
- **Token Management**: 
  - **Redis Integration**: Fast storage for refresh tokens and blacklists.
  - **Token Blacklisting**: Immediate token invalidation on logout.
  - **Token Rotation**: Prevents race conditions and enhances security.
- **Database Security**:
  - **Connection Encryption**: MongoDB URIs are encrypted using **AES-256-GCM** before storage.
  - **Password Hashing**: User passwords hashed with **bcrypt**.
- **Robust Architecture**:
  - **MVC Pattern**: Clean separation of concerns.
  - **Standardized Responses**: Consistent API success and error formats.
  - **Async Error Handling**: Centralized error management wrapper.
  - **Environment Configuration**: Secure configuration using `.env`.

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (Local or Atlas)
- **Redis** (Local or Cloud)

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
   Create a `.env` file in the root directory with the following content:

   ```env
   # Server Configuration
   PORT=3000

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/insightai

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # JWT Secrets (Generate strong secrets for production!)
   ACCESS_TOKEN_SECRET=your-super-secret-access-key-min-32-chars
   REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32-chars

   # Database Encryption (Required for Connection Management)
   # Must be at least 32 characters long
   DB_ENCRYPTION_KEY=your-super-secret-encryption-key-min-32-chars
   ```

   > **Tip:** Generate secure random keys using Node.js:
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   > ```

4. **Start Redis server** (if running locally)
   ```bash
   redis-server
   ```

5. **Run the application**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

## 🏗️ Project Structure

```
insightAI/
├── configs/
│   ├── database.js      # MongoDB connection setup
│   ├── encryption.js    # AES-256-GCM encryption utility
│   ├── jwt.js           # JWT generation and verification
│   └── redis.js         # Redis client configuration
├── controllers/
│   ├── auth.controller.js       # Auth logic (Login, Signup, etc.)
│   └── connection.controllor.js # Connection management logic
├── middlewares/
│   └── auth.middlware.js    # JWT authentication middleware
├── models/
│   ├── connection.models.js # Connection schema
│   └── user.models.js       # User schema
├── routes/
│   └── auth.routes.js       # Auth API routes
├── utils/
│   ├── ApiError.js          # Custom error class
│   ├── ApiResponse.js       # Standardized response class
│   ├── asyncHandler.js      # Async wrapper for controllers
│   └── logentries.js        # Logging utility
├── index.js             # App entry point
└── package.json
```

## 🔑 API Endpoints

### Health Check
- **GET** `/health` - Check API status.

### Authentication

#### 1. Sign Up
**POST** `/api/auth/signup`
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### 2. Login
**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
*Returns `accessToken` and `refreshToken`.*

#### 3. Refresh Token
**POST** `/api/auth/refresh`
```json
{
  "refreshToken": "your_refresh_token_here"
}
```
*Returns a new `accessToken`.*

#### 4. Logout
**POST** `/api/auth/logout`
*Headers:* `Authorization: Bearer <accessToken>`
*Invalidates both access and refresh tokens.*

### Database Connections (Protected)

#### Save Connection
**POST** `/api/connections`
*Headers:* `Authorization: Bearer <accessToken>`
```json
{
  "mongoUri": "mongodb://user:pass@host:port/db",
  "name": "Production DB"
}
```
*The `mongoUri` is encrypted before being stored in the database.*

## 🔒 Security Implementation

### 1. Token Management
- **Access Tokens**: Short lifespan (e.g., 15 mins). Used for API access.
- **Refresh Tokens**: Longer lifespan (e.g., 7 days). Stored in Redis. Used to get new access tokens.
- **Blacklisting**: When a user logs out, the access token is added to a Redis blacklist until it expires.

### 2. Data Encryption
- **Algorithm**: AES-256-GCM (Authenticated Encryption).
- **Implementation**: 
  - Uses a unique IV (Initialization Vector) for every encryption.
  - Generates an Auth Tag to verify data integrity.
  - The `DB_ENCRYPTION_KEY` is hashed to ensure a valid 32-byte key.

### 3. Password Security
- Passwords are **never** stored in plain text.
- Uses `bcrypt` with salt rounds for hashing before saving to MongoDB.

## 🧪 Testing with cURL

**Login Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Create Connection Example:**
```bash
curl -X POST http://localhost:3000/api/connections \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mongoUri":"mongodb://localhost:27017/mydb","name":"My Local DB"}'
```

## 🎯 Roadmap & TODO

### Critical Fixes
- [ ] Fix middleware error handling (use `throw ApiError`).
- [ ] Standardize variable declarations (`const`/`let` instead of `var`).
- [ ] Remove unused fields from User model.

### Future Enhancements
- [ ] **Input Validation**: Add Joi/Zod for request validation.
- [ ] **Rate Limiting**: Prevent brute-force attacks.
- [ ] **Connection Management**: Add endpoints to list, update, and delete connections.
- [ ] **Decryption**: Add utility to decrypt connection strings when needed.
- [ ] **Docker Support**: Containerize the application.

## 👤 Author

**Joseph Remington**

## 📄 License

ISC
