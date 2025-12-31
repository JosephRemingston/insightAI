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
   # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   DB_ENCRYPTION_KEY=base64-encoded-32-byte-key
   ```

   > **Important Security Notes:**
   > - Use different secrets for development and production
   > - Never commit the `.env` file to version control
   > - The `DB_ENCRYPTION_KEY` must be base64-encoded and decode to exactly 32 bytes
   > 
   > **Generate secure random keys:**
   > ```bash
   > # For JWT secrets (hex format)
   > node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   > 
   > # For encryption key (base64 format)
   > node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
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
│   ├── encryption.js    # AES-256-GCM encryption/decryption utility
│   ├── jwt.js           # JWT generation and verification
│   └── redis.js         # Redis client configuration
├── controllers/
│   ├── ai.controllor.js         # AI-related logic (placeholder)
│   ├── auth.controller.js       # Auth logic (Login, Signup, Logout, Refresh)
│   └── connection.controllor.js # Connection CRUD and management
├── middlewares/
│   └── auth.middlware.js    # JWT authentication middleware
├── models/
│   ├── connection.models.js # Connection schema (encrypted URI storage)
│   └── user.models.js       # User schema
├── routes/
│   ├── auth.routes.js       # Auth API routes
│   └── connection.routes.js # Connection API routes
├── utils/
│   ├── ApiError.js          # Custom error class
│   ├── ApiResponse.js       # Standardized response class
│   ├── asyncHandler.js      # Async wrapper for controllers
│   ├── logentries.js        # Logging utility
│   └── mongoConnections.js  # Map to store active user connections
├── index.js             # App entry point
└── package.json
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

#### 1. Save Connection
**POST** `/api/connections`
*Headers:* `Authorization: Bearer <accessToken>`
```json
{
  "mongoUri": "mongodb://user:pass@host:port/db",
  "name": "Production DB"
}
```
*The `mongoUri` is encrypted using AES-256-GCM before being stored. The encrypted object includes `encryptedText`, `iv`, and `authTag` for secure decryption.*

#### 2. Connect to Database
**POST** `/api/connections/connect`
*Headers:* `Authorization: Bearer <accessToken>`
```json
{
  "connectionId": "connection_mongodb_id"
}
```
*Returns connection details including status, host, and database name. The connection is maintained in memory per user.*

#### 3. Disconnect from Database
**POST** `/api/connections/disconnect`
*Headers:* `Authorization: Bearer <accessToken>`

*Closes the active database connection for the current user and removes it from the connection pool.*

## 🔒 Security Implementation

### 1. Token Management
- **Access Tokens**: Short lifespan (e.g., 15 mins). Used for API access.
- **Refresh Tokens**: Longer lifespan (e.g., 7 days). Stored in Redis. Used to get new access tokens.
- **Blacklisting**: When a user logs out, the access token is added to a Redis blacklist until it expires.

### 2. Data Encryption
- **Algorithm**: AES-256-GCM (Authenticated Encryption).
- **Storage Format**: MongoDB connection URIs are stored as objects containing:
  - `encryptedText`: The encrypted URI string
  - `iv`: Initialization Vector (unique per encryption)
  - `authTag`: Authentication tag for data integrity verification
- **Implementation**: 
  - Uses a unique IV (Initialization Vector) for every encryption operation.
  - Generates an Auth Tag to verify data integrity during decryption.
  - The `DB_ENCRYPTION_KEY` must be exactly 32 bytes (base64 encoded) for AES-256.
  
**Generate a secure encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

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

**Connect to Database Example:**
```bash
curl -X POST http://localhost:3000/api/connections/connect \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"675a1b2c3d4e5f6789abcdef"}'
```

**Disconnect from Database Example:**
```bash
curl -X POST http://localhost:3000/api/connections/disconnect \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🎯 Roadmap & TODO

### Recently Completed ✅
- [x] Fixed encryption storage format (now stores complete encrypted object)
- [x] Implemented connection pooling per user with `mongoConnections` Map
- [x] Added connect and disconnect endpoints
- [x] Fixed circular JSON reference in connection response
- [x] Consistent userId handling in connection Map (using `.toString()`)

### Critical Fixes
- [ ] Fix middleware error handling (use `throw ApiError`).
- [ ] Standardize variable declarations (`const`/`let` instead of `var`).
- [ ] Remove unused fields from User model.
- [ ] Add input validation for all endpoints.

### Future Enhancements
- [ ] **Input Validation**: Add Joi/Zod for request validation.
- [ ] **Rate Limiting**: Prevent brute-force attacks.
- [ ] **Connection Management**: Add endpoints to list and delete saved connections.
- [ ] **Connection Security**: Add ownership validation for connections.
- [ ] **Error Handling**: Improve error messages and add error logging.
- [ ] **Docker Support**: Containerize the application.
- [ ] **Testing**: Add unit and integration tests.
- [ ] **Documentation**: Add API documentation using Swagger/OpenAPI.

## 👤 Author

**Joseph Remington**

## 📄 License

ISC
