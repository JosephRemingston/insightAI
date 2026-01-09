# InsightAI API

A secure, production-ready API that combines user authentication, encrypted database connection management, and AI-powered MongoDB query generation using Google Gemini AI. Built with Express.js, JWT, Redis, and MongoDB.

---

## 📖 Project Summary

**InsightAI** is an intelligent database assistant that allows users to:
1. **Authenticate securely** with JWT-based access and refresh tokens
2. **Connect to any MongoDB database** with encrypted connection strings
3. **Query databases using natural language** - AI converts questions into MongoDB aggregation pipelines
4. **Execute queries safely** with built-in validation and security controls

The system uses Google Gemini AI to understand natural language questions and generate optimized MongoDB queries based on the actual database schema.

---

## 🗂️ Complete Project Structure

```
insightAI/
│
├── index.js                          # Main application entry point
├── package.json                      # Dependencies and scripts
├── README.md                         # Project documentation
│
├── configs/                          # Configuration files
│   ├── database.js                   # MongoDB connection setup
│   ├── encryption.js                 # AES-256-GCM encryption/decryption
│   ├── jwt.js                        # JWT token generation and verification
│   └── redis.js                      # Redis client configuration
│
├── controllers/                      # Business logic handlers
│   ├── ai.controllor.js             # AI query and schema extraction
│   ├── auth.controller.js           # Authentication operations
│   └── connection.controllor.js     # Database connection management
│
├── middlewares/                      # Express middleware
│   └── auth.middlware.js            # JWT authentication middleware
│
├── models/                           # Mongoose schemas
│   ├── connection.models.js         # Database connection model
│   └── user.models.js               # User model with password hashing
│
├── routes/                           # API route definitions
│   ├── ai.routes.js                 # AI-related endpoints
│   ├── auth.routes.js               # Authentication endpoints
│   └── connection.routes.js         # Connection management endpoints
│
└── utils/                            # Utility functions
    ├── aiUtils.js                   # MongoDB query validation and execution
    ├── ApiError.js                  # Custom error class
    ├── ApiResponse.js               # Standardized response format
    ├── asyncHandler.js              # Async error wrapper
    ├── constants.js                 # Application constants
    ├── logentries.js                # Logging utilities
    └── mongoConnections.js          # In-memory connection pool and AI system prompt
```

---

## 📁 File-by-File Documentation

### **Root Files**

#### `index.js`
**Purpose:** Application entry point that initializes the Express server

**What it does:**
- Configures Express middleware (CORS, JSON parsing)
- Connects to MongoDB
- Registers all API routes
- Provides health check endpoint
- Starts server on port 3000

**Key Code:**
```javascript
app.use("/api/auth/", authRoutes);
app.use("/api/connection/", connectionRoutes);
app.use("/api/ai/", aiRoutes);
```

**Sample Input/Output:**
```bash
GET /health
```
```json
{
  "statusCode": 200,
  "message": "API is working",
  "data": {
    "status": "UP",
    "timestamp": "2026-01-09T12:00:00.000Z",
    "uptime": 3600
  }
}
```

---

#### `package.json`
**Purpose:** Project metadata and dependency management

**What it contains:**
- **Dependencies:**
  - `@google/generative-ai`: Google Gemini AI SDK
  - `bcrypt`: Password hashing
  - `express`: Web framework
  - `jsonwebtoken`: JWT authentication
  - `mongoose`: MongoDB ODM
  - `ioredis`: Redis client
  - `cors`: Cross-origin resource sharing
  - `dotenv`: Environment variables

**Scripts:**
- `npm run dev`: Start with nodemon (auto-reload)
- `npm start`: Production start

---

### **configs/** Directory

#### `database.js`
**Purpose:** MongoDB connection configuration

**What it does:**
- Connects to MongoDB using Mongoose
- Uses `MONGO_URI` from environment variables
- Handles connection errors and success events

**How it works:**
```javascript
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Connection error:", err));
```

---

#### `encryption.js`
**Purpose:** Encrypt and decrypt sensitive data (MongoDB URIs)

**What it does:**
- Uses **AES-256-GCM** encryption algorithm
- Generates random initialization vectors (IV)
- Produces authentication tags for integrity verification

**How it works:**
1. `encryptString(text)`: Takes plaintext, returns encrypted object
2. `decryptString(encryptedObj)`: Takes encrypted object, returns plaintext

**Sample Input/Output:**
```javascript
// Encrypt
const encrypted = encryptString("mongodb://localhost:27017/mydb");
// Returns: { encryptedText: "a3f2...", iv: "b4e1...", authTag: "c5d3..." }

// Decrypt
const original = decryptString(encrypted);
// Returns: "mongodb://localhost:27017/mydb"
```

---

#### `jwt.js`
**Purpose:** JWT token lifecycle management with Redis

**What it does:**
- Generates access tokens (15 min expiry)
- Generates refresh tokens (7 day expiry)
- Stores refresh tokens in Redis
- Blacklists tokens on logout
- Verifies token validity

**How it works:**
1. User logs in → generates access + refresh tokens
2. Access token expires → use refresh token to get new access token
3. User logs out → blacklist access token and delete refresh token

**Sample Functions:**
```javascript
generateAccessToken(userId)  // Returns JWT with 15min expiry
storeRefreshToken(userId, token)  // Stores in Redis for 7 days
isTokenBlacklisted(token)  // Checks if token is invalidated
```

---

#### `redis.js`
**Purpose:** Redis client configuration

**What it does:**
- Creates Redis connection using `ioredis`
- Connects to Redis server for token storage
- Provides caching layer for authentication

---

### **controllers/** Directory

#### `auth.controller.js`
**Purpose:** Handles all authentication-related operations

**What it contains:**
- `signup`: Register new users
- `login`: Authenticate users and issue tokens
- `refresh`: Generate new access tokens using refresh tokens
- `logout`: Invalidate tokens and end session

**How `login` works:**
1. Validate email and password from request body
2. Find user in database
3. Verify password using bcrypt comparison
4. Generate access token (15min) and refresh token (7 days)
5. Store refresh token in Redis
6. Return user data and tokens

**Sample Input/Output:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response:
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "user@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**How `refresh` works:**
1. Extract refresh token from request body
2. Verify token signature and expiration
3. Check if token exists in Redis
4. Generate new access token
5. Return new access token

**Sample Input/Output:**
```json
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### `connection.controllor.js`
**Purpose:** Manages MongoDB database connections

**What it contains:**
- `getMongoUri`: Save encrypted MongoDB connection string
- `connectToDatabase`: Establish connection to saved MongoDB URI
- `disconnectDatabase`: Close active database connection

**How `getMongoUri` works:**
1. Receive MongoDB URI and connection name
2. Encrypt URI using AES-256-GCM
3. Save encrypted URI to database with user reference
4. Return connection details

**Sample Input/Output:**
```json
POST /api/connection/get-connection-string
Headers: { "Authorization": "Bearer <access_token>" }
{
  "mongoUri": "mongodb://localhost:27017/ecommerce",
  "name": "My E-commerce DB"
}

Response:
{
  "statusCode": 200,
  "message": "Connection created successfully",
  "data": {
    "connection": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "My E-commerce DB",
      "connecteduri": {
        "encryptedText": "a3f2...",
        "iv": "b4e1...",
        "authTag": "c5d3..."
      }
    }
  }
}
```

**How `connectToDatabase` works:**
1. Retrieve connection document by ID
2. Decrypt MongoDB URI
3. Create mongoose connection
4. Store connection in memory Map (mongoConnections)
5. Return connection status and details

**Sample Input/Output:**
```json
POST /api/connection/connect-to-database
Headers: { "Authorization": "Bearer <access_token>" }
{
  "connectionId": "65a1b2c3d4e5f6g7h8i9j0k1"
}

Response:
{
  "statusCode": 200,
  "message": "Connected to database successfully",
  "data": {
    "connectionName": "My E-commerce DB",
    "status": "connected",
    "host": "localhost",
    "database": "ecommerce"
  }
}
```

---

#### `ai.controllor.js`
**Purpose:** AI-powered schema extraction and query generation

**What it contains:**
- `getMongoSchema`: Extract database schema from connected MongoDB
- `runAiQuery`: Convert natural language to MongoDB query and execute

**How `getMongoSchema` works:**
1. Get active connection for authenticated user
2. List all collections in database
3. Sample 20 documents from each collection
4. Infer field types (string, number, date, array, object, etc.)
5. Build schema object with collections and fields
6. Return complete schema

**Sample Input/Output:**
```json
POST /api/ai/get-mongo-schema
Headers: { "Authorization": "Bearer <access_token>" }

Response:
{
  "statusCode": 200,
  "message": "Schema extracted successfully",
  "data": {
    "schema": {
      "users": {
        "_id": "objectId",
        "name": "string",
        "email": "string",
        "age": "number",
        "createdAt": "date"
      },
      "orders": {
        "_id": "objectId",
        "userId": "objectId",
        "items": "array",
        "total": "number",
        "status": "string"
      }
    }
  }
}
```

**How `runAiQuery` works:**
1. Extract user question and connectionId from request
2. Build database schema (same as getMongoSchema)
3. Send schema + question to Google Gemini AI
4. AI returns MongoDB aggregation pipeline as JSON
5. Validate pipeline (check for blocked stages)
6. Validate collection exists in schema
7. Execute aggregation query on MongoDB
8. Return AI-generated query and results

**Sample Input/Output:**
```json
POST /api/ai/run-ai-query
Headers: { "Authorization": "Bearer <access_token>" }
{
  "connectionId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "question": "What are the top 5 customers by total order value?"
}

Response:
{
  "statusCode": 200,
  "message": "Query executed successfully",
  "data": {
    "aiQuery": {
      "collection": "orders",
      "pipeline": [
        { "$group": { "_id": "$userId", "totalSpent": { "$sum": "$total" } } },
        { "$sort": { "totalSpent": -1 } },
        { "$limit": 5 },
        { "$lookup": { "from": "users", "localField": "_id", "foreignField": "_id", "as": "user" } }
      ]
    },
    "response": [
      { "_id": "user123", "totalSpent": 5000, "user": [{ "name": "John Doe" }] },
      { "_id": "user456", "totalSpent": 4500, "user": [{ "name": "Jane Smith" }] }
    ]
  }
}
```

---

### **middlewares/** Directory

#### `auth.middlware.js`
**Purpose:** Protect routes with JWT authentication

**What it does:**
1. Extract Bearer token from Authorization header
2. Check if token is blacklisted in Redis
3. Verify token signature and expiration
4. Fetch user from database using token's userId
5. Attach user object to `req.user`
6. Call `next()` to proceed to route handler

**How it works:**
```javascript
// Usage in routes
router.post('/protected-route', authenticate, controllerFunction);

// Middleware flow
Request → Extract token → Check blacklist → Verify JWT → Get user → Next()
```

---

### **models/** Directory

#### `user.models.js`
**Purpose:** User schema with password hashing

**What it contains:**
- Email field (unique, lowercase, trimmed)
- Password field (hashed before saving)
- RefreshToken field (optional)
- Timestamps (createdAt, updatedAt)

**How password hashing works:**
```javascript
// Before saving (pre-save hook)
User creates account → Password hashed with bcrypt (10 rounds) → Stored in DB

// Login validation
User logs in → Compare plaintext password with hash → Return boolean
```

**Methods:**
- `isPasswordCorrect(password)`: Compares password with stored hash

---

#### `connection.models.js`
**Purpose:** Database connection schema with encryption

**What it contains:**
- `userId`: Reference to User model
- `connecteduri`: Encrypted MongoDB URI object
  - `encryptedText`: Encrypted connection string
  - `iv`: Initialization vector
  - `authTag`: Authentication tag for verification
- `name`: Human-readable connection name

---

### **routes/** Directory

#### `auth.routes.js`
**Purpose:** Authentication API endpoints

**Routes:**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens (protected)

---

#### `connection.routes.js`
**Purpose:** Database connection management endpoints

**Routes:**
- `POST /api/connection/get-connection-string` - Save encrypted MongoDB URI (protected)
- `POST /api/connection/connect-to-database` - Connect to saved database (protected)
- `POST /api/connection/disconnect-database` - Disconnect from database (protected)

---

#### `ai.routes.js`
**Purpose:** AI-powered query endpoints

**Routes:**
- `POST /api/ai/get-mongo-schema` - Extract database schema (protected)
- `POST /api/ai/run-ai-query` - Natural language to MongoDB query (protected) *(Note: Route not yet added)*

---

### **utils/** Directory

#### `asyncHandler.js`
**Purpose:** Wraps async functions to catch errors automatically

**What it does:**
- Prevents try-catch blocks in every controller
- Catches errors and sends appropriate HTTP response
- Distinguishes between known errors (ApiError) and programmer errors

**How it works:**
```javascript
// Without asyncHandler
export const login = async (req, res) => {
  try {
    // logic
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// With asyncHandler
export const login = asyncHandler(async (req, res) => {
  // logic - errors caught automatically
});
```

---

#### `ApiError.js`
**Purpose:** Custom error class for consistent error handling

**What it does:**
- Creates error objects with statusCode and message
- Provides static methods for common errors

**Usage:**
```javascript
throw ApiError.badRequest("Email is required");
// Creates: { statusCode: 400, message: "Email is required" }
```

---

#### `ApiResponse.js`
**Purpose:** Standardized API response format

**What it does:**
- Ensures all responses have consistent structure
- Provides methods for success and error responses

**Methods:**
```javascript
ApiResponse.success(res, "Operation successful", { data: {...} });
ApiResponse.badRequest(res, "Invalid input");
ApiResponse.unauthorized(res, "Token expired");
```

---

#### `mongoConnections.js`
**Purpose:** In-memory connection pool and AI configuration

**What it contains:**
- `mongoConnections`: Map storing active connections (userId → connection)
- `inferType(value)`: Detects data types from MongoDB documents
- `systemPrompt`: Detailed instructions for Gemini AI to generate MongoDB queries

**How inferType works:**
```javascript
inferType(null) // "null"
inferType([1,2,3]) // "array"
inferType(new Date()) // "date"
inferType(ObjectId("...")) // "objectId"
inferType("text") // "string"
```

**System Prompt Structure:**
- Instructs AI to act as MongoDB query compiler
- Prohibits hallucination and guessing
- Enforces read-only operations
- Defines allowed/blocked MongoDB stages
- Requires valid JSON output only

---

#### `aiUtils.js`
**Purpose:** MongoDB query validation and safe execution

**What it contains:**
- `ALLOWED_STAGES`: Whitelist of safe MongoDB aggregation stages
- `BLOCKED_STAGES`: Blacklist of dangerous operations ($out, $merge, etc.)
- `validateMongoPipeline(pipeline)`: Ensures pipeline only uses safe stages
- `validateCollection(collection, schema)`: Verifies collection exists
- `executeMongoQuery()`: Executes validated query and returns results

**How validation works:**
```javascript
// Safe query - executes
pipeline: [{ $match: { status: "active" } }, { $count: "total" }]

// Blocked query - throws error
pipeline: [{ $out: "newCollection" }]  // $out is blocked

// Invalid query - throws error
pipeline: [{ $invalidStage: {} }]  // Not in ALLOWED_STAGES
```

**Security Features:**
- Prevents write operations ($out, $merge)
- Prevents system operations ($currentOp, $indexStats)
- Blocks external data access ($lookup to system collections)
- Disables disk usage (memory-only aggregations)

---

## 🔒 Security Features

1. **Password Security:**
   - Bcrypt hashing with 10 salt rounds
   - Passwords never stored in plaintext
   - Pre-save hooks ensure automatic hashing

2. **Token Security:**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Token blacklisting on logout
   - Redis-based token storage and invalidation

3. **Database Security:**
   - MongoDB URIs encrypted with AES-256-GCM
   - Unique initialization vectors per encryption
   - Authentication tags for integrity verification
   - Encrypted data stored in MongoDB

4. **Query Security:**
   - Whitelist-based MongoDB stage validation
   - Blocked dangerous operations (writes, system access)
   - Collection existence verification
   - Memory-only aggregations (no disk usage)

5. **Authentication Security:**
   - JWT-based stateless authentication
   - Middleware protection on sensitive routes
   - User context attached to requests
   - Automatic token expiration

---

## 🚀 API Endpoints Reference

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/signup` | POST | ❌ | Register new user |
| `/api/auth/login` | POST | ❌ | Login and get tokens |
| `/api/auth/refresh` | POST | ❌ | Refresh access token |
| `/api/auth/logout` | POST | ✅ | Logout and invalidate tokens |

### Database Connections

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/connection/get-connection-string` | POST | ✅ | Save encrypted MongoDB URI |
| `/api/connection/connect-to-database` | POST | ✅ | Connect to saved database |
| `/api/connection/disconnect-database` | POST | ✅ | Disconnect from database |

### AI Operations

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai/get-mongo-schema` | POST | ✅ | Extract database schema |
| `/api/ai/run-ai-query` | POST | ✅ | Natural language to query |

---

## 🎯 Complete Usage Flow

### 1. User Registration and Authentication

```bash
# Step 1: Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123"}'

# Step 2: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123"}'

# Response: Save accessToken and refreshToken
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. Database Connection Setup

```bash
# Step 3: Save MongoDB Connection
curl -X POST http://localhost:3000/api/connection/get-connection-string \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "mongoUri": "mongodb://localhost:27017/myapp",
    "name": "Production Database"
  }'

# Response: Save connectionId
{
  "data": {
    "connection": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Production Database"
    }
  }
}

# Step 4: Connect to Database
curl -X POST http://localhost:3000/api/connection/connect-to-database \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"connectionId": "65a1b2c3d4e5f6g7h8i9j0k1"}'
```

### 3. AI-Powered Querying

```bash
# Step 5: Extract Schema
curl -X POST http://localhost:3000/api/ai/get-mongo-schema \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>"

# Response: Database schema with all collections and fields

# Step 6: Run Natural Language Query
curl -X POST http://localhost:3000/api/ai/run-ai-query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "connectionId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "question": "How many active users registered last month?"
  }'

# Response: AI-generated query + results
{
  "statusCode": 200,
  "message": "Query executed successfully",
  "data": {
    "aiQuery": {
      "collection": "users",
      "pipeline": [
        { "$match": { "status": "active", "createdAt": { "$gte": "2025-12-01" } } },
        { "$count": "total" }
      ]
    },
    "response": [{ "total": 342 }]
  }
}
```

### 4. Token Refresh (when access token expires)

```bash
# Step 7: Refresh Access Token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'

# Response: New access token
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 5. Cleanup

```bash
# Step 8: Disconnect from Database
curl -X POST http://localhost:3000/api/connection/disconnect-database \
  -H "Authorization: Bearer <accessToken>"

# Step 9: Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/insightai

# JWT Secrets
ACCESS_TOKEN_SECRET=your-secret-access-key-min-32-chars
REFRESH_TOKEN_SECRET=your-secret-refresh-key-min-32-chars

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Encryption Key (32 bytes, base64 encoded)
# Generate with: node -e "console.log(crypto.randomBytes(32).toString('base64'))"
DB_ENCRYPTION_KEY=your-base64-encoded-32-byte-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=3000
```

---

## 📦 Installation and Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd insightAI

# 2. Install dependencies
npm install

# 3. Create .env file with required variables
cp .env.example .env
# Edit .env with your configuration

# 4. Start Redis server
redis-server

# 5. Start MongoDB
mongod

# 6. Run development server
npm run dev

# 7. Server runs on http://localhost:3000
```

---

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:3000/health

# Complete workflow test (use actual values)
# 1. Signup → 2. Login → 3. Save connection → 4. Connect → 5. Query with AI
```

---

## 🏗️ Architecture Highlights

### MVC Pattern
- **Models**: Mongoose schemas with validation and hooks
- **Views**: JSON API responses (no templates)
- **Controllers**: Business logic separated from routes

### Middleware Pipeline
```
Request → CORS → JSON Parser → Route → Auth Middleware → Controller → Response
```

### Error Handling Flow
```
Controller Error → asyncHandler → ApiError → JSON Error Response
```

### Token Lifecycle
```
Login → Generate Tokens → Store in Redis → Use Access Token → 
Expires (15min) → Refresh → New Access Token → 
Logout → Blacklist & Delete
```

### AI Query Flow
```
Natural Language → Schema Extraction → Gemini AI → 
MongoDB Pipeline → Validation → Execution → Results
```

---

## 🔧 Technology Stack

- **Backend Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Caching/Storage**: Redis (ioredis)
- **Authentication**: JSON Web Tokens (JWT)
- **Encryption**: Node.js Crypto (AES-256-GCM)
- **Password Hashing**: bcrypt
- **AI**: Google Generative AI (Gemini 1.5 Pro)
- **Language**: JavaScript (ES Modules)

---

## 📝 Notes

1. **Access tokens** expire after 15 minutes for security
2. **Refresh tokens** are valid for 7 days
3. **MongoDB URIs** are encrypted before storage
4. **Active connections** are stored in memory per user
5. **AI queries** are read-only and validated before execution
6. **Schema extraction** samples 20 documents per collection
7. All routes except `/health` and auth endpoints require authentication

---

## 🚨 Important Security Considerations

- Never commit `.env` file to version control
- Use strong, randomly generated secrets for JWT
- Rotate encryption keys periodically
- Monitor Redis for memory usage
- Implement rate limiting for production
- Use HTTPS in production
- Validate all user inputs
- Keep dependencies updated

---

## 📚 Future Enhancements

- [ ] Add route for `runAiQuery` in `ai.routes.js`
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Support multiple simultaneous database connections
- [ ] Add query result caching
- [ ] Implement query history
- [ ] Add database connection health checks
- [ ] Support for other database types (PostgreSQL, MySQL)
- [ ] Advanced AI query optimization
- [ ] Query performance metrics

---

## 👨‍💻 Development

```bash
# Run in development mode (auto-reload)
npm run dev

# Run in production mode
npm start

# Check for updates
npm outdated
```

---

## 📄 License

ISC

---

**Built with ❤️ using Express.js, MongoDB, Redis, and Google Gemini AI**
2. `decryptString(encryptedObj)`: Takes encrypted object, returns plaintext

**Sample Input/Output:**
```javascript
// Encrypt
const encrypted = encryptString("mongodb://localhost:27017/mydb");
// Returns: { encryptedText: "a3f2...", iv: "b4e1...", authTag: "c5d3..." }

// Decrypt
const original = decryptString(encrypted);
// Returns: "mongodb://localhost:27017/mydb"
```

---

#### `jwt.js`
**Purpose:** JWT token lifecycle management with Redis

**What it does:**
- Generates access tokens (15 min expiry)
- Generates refresh tokens (7 day expiry)
- Stores refresh tokens in Redis
- Blacklists tokens on logout
- Verifies token validity

**How it works:**
1. User logs in → generates access + refresh tokens
2. Access token expires → use refresh token to get new access token
3. User logs out → blacklist access token and delete refresh token

**Sample Functions:**
```javascript
generateAccessToken(userId)  // Returns JWT with 15min expiry
storeRefreshToken(userId, token)  // Stores in Redis
isTokenBlacklisted(token)  // Checks if token is invalidated
```

---

#### `redis.js`
**Purpose:** Redis client configuration

**What it does:**
- Creates Redis connection using `ioredis`
- Connects to Redis server for token storage
- Provides caching layer for authentication

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
│   ├── ai.controllor.js         # AI schema extraction and analysis
│   ├── auth.controller.js       # Auth logic (Login, Signup, Logout, Refresh)
│   └── connection.controllor.js # Connection CRUD and management
├── middlewares/
│   └── auth.middlware.js    # JWT authentication middleware
├── models/
│   ├── connection.models.js # Connection schema (encrypted URI storage)
│   └── user.models.js       # User schema
├── routes/
│   ├── ai.routes.js         # AI/Schema analysis API routes
│   ├── auth.routes.js       # Auth API routes
│   └── connection.routes.js # Connection API routes
├── utils/
│   ├── ApiError.js          # Custom error class
│   ├── ApiResponse.js       # Standardized response class
│   ├── asyncHandler.js      # Async wrapper for controllers
│   ├── logentries.js        # Logging utility
│   └── mongoConnections.js  # Map to store active connections + type inference
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

#### 1. Save Connection String
**POST** `/api/connection/get-connection-string`
*Headers:* `Authorization: Bearer <accessToken>`
```json
{
  "mongoUri": "mongodb://user:pass@host:port/db",
  "name": "Production DB"
}
```
*The `mongoUri` is encrypted using AES-256-GCM before being stored. The encrypted object includes `encryptedText`, `iv`, and `authTag` for secure decryption.*

#### 2. Connect to Database
**POST** `/api/connection/connect-to-database`
*Headers:* `Authorization: Bearer <accessToken>`
```json
{
  "connectionId": "connection_mongodb_id"
}
```
*Returns connection details including status, host, and database name. The connection is maintained in memory per user. Only one active connection per user is allowed.*

#### 3. Disconnect from Database
**POST** `/api/connection/disconnect-database`
*Headers:* `Authorization: Bearer <accessToken>`

*Closes the active database connection for the current user and removes it from the connection pool.*

### AI & Schema Analysis (Protected)

#### 1. Extract Database Schema
**POST** `/api/ai/get-mongo-schema`
*Headers:* `Authorization: Bearer <accessToken>`

*Automatically analyzes the currently connected database and extracts the schema for all collections. Returns collection names, field names, and inferred data types based on sample documents (up to 20 per collection).*

**Response Example:**
```json
{
  "success": true,
  "message": "Schema extracted successfully",
  "data": {
    "schema": {
      "users": {
        "_id": "objectId",
        "email": "string",
        "password": "string",
        "createdAt": "date",
        "updatedAt": "date"
      },
      "connections": {
        "_id": "objectId",
        "userId": "objectId",
        "connecteduri": "object",
        "name": "string"
      }
    }
  }
}
```

**Supported Field Types:**
- `string`, `number`, `boolean`
- `object`, `array`
- `date`, `objectId`
- `null`

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
curl -X POST http://localhost:3000/api/connection/get-connection-string \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mongoUri":"mongodb://localhost:27017/mydb","name":"My Local DB"}'
```

**Connect to Database Example:**
```bash
curl -X POST http://localhost:3000/api/connection/connect-to-database \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"675a1b2c3d4e5f6789abcdef"}'
```

**Disconnect from Database Example:**
```bash
curl -X POST http://localhost:3000/api/connection/disconnect-database \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Extract Database Schema Example:**
```bash
curl -X POST http://localhost:3000/api/ai/get-mongo-schema \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## 🎯 Roadmap & TODO

### Recently Completed ✅
- [x] Fixed encryption storage format (now stores complete encrypted object)
- [x] Implemented connection pooling per user with `mongoConnections` Map
- [x] Added connect and disconnect endpoints
- [x] Fixed circular JSON reference in connection response
- [x] Consistent userId handling in connection Map (using `.toString()`)
- [x] Implemented AI-powered schema extraction from connected databases
- [x] Added automatic type inference for database fields
- [x] Created AI routes and controller for schema analysis
- [x] Fixed export issues in mongoConnections utility module

### Critical Fixes
- [ ] Fix middleware error handling (use `throw ApiError`).
- [ ] Standardize variable declarations (`const`/`let` instead of `var`).
- [ ] Remove unused fields from User model.
- [ ] Add input validation for all endpoints.

### Future Enhancements
- [ ] **AI Query Generation**: Use extracted schemas to generate MongoDB queries from natural language
- [ ] **Schema Caching**: Cache extracted schemas to improve performance
- [ ] **Schema Comparison**: Compare schemas across different database environments
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
