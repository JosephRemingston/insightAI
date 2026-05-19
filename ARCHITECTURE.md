# InsightAI Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Authentication & Security](#authentication--security)
6. [Connection Management](#connection-management)
7. [AI Query Processing](#ai-query-processing)
8. [API Endpoints](#api-endpoints)
9. [Database Schema](#database-schema)
10. [Error Handling](#error-handling)

---

## 🎯 System Overview

**InsightAI** is a backend service that enables users to interact with MongoDB databases using natural language queries powered by Google Gemini AI. The system manages user authentication, secure connection storage, and intelligent query generation/analysis.

### Key Features
- **JWT-based Authentication** with access & refresh tokens
- **Encrypted Connection Storage** using AES-256-GCM
- **Natural Language Query Processing** via Google Gemini AI
- **Dynamic Schema Extraction** from MongoDB collections
- **Two AI Modes**: Query (raw results) and Inference (analysis + insights)
- **Connection Pooling** with TTL-based cleanup

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Client                          │
│                   (Web/Mobile Application)                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP Requests
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Server                            │
│                   (insightAI Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│                      Routes Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ auth.routes  │  │connection.   │  │ ai.routes    │          │
│  │              │  │ routes       │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
│         ▼                 ▼                  ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ auth.        │  │ connection.  │  │ ai.          │          │
│  │ controller   │  │ controller   │  │ controller   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
│         │    auth.middleware (JWT verify)    │                  │
│         └────────────────┬────────────────────┘                 │
│                          │                                      │
└──────────┬───────────────┼───────────────────┬──────────────────┘
           │               │                   │
           ▼               ▼                   ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  InsightAI   │  │  Encrypted   │  │   Google     │
    │  MongoDB DB  │  │  Connection  │  │   Gemini AI  │
    │              │  │  Storage     │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘
           │
           │  (User Credentials)
           ▼
    ┌──────────────┐
    │  User's      │
    │  MongoDB DB  │
    │  Connections │
    └──────────────┘
```

---

## 🔧 Core Components

### 1. **Authentication Layer** (`/controllers/auth.controller.js`)
Handles user registration and login operations.

| Function | Purpose |
|----------|---------|
| `registerUser` | Create new user account with bcrypt-hashed password |
| `loginUser` | Authenticate user, issue JWT tokens |
| `refreshAccessToken` | Generate new access token using refresh token |

**Token Storage**:
- `accessToken`: Short-lived (15m), used for API requests
- `refreshToken`: Long-lived, stored in DB, used to renew access token

---

### 2. **Connection Management** (`/controllers/connection.controller.js`)
Manages user's MongoDB database connections with encryption.

| Function | Purpose |
|----------|---------|
| `getMongoUri` | Add new MongoDB connection, encrypt & store URI |
| `getConnectionByUser` | Retrieve all connections for authenticated user |
| `connectToDatabase` | Test and establish connection to a user's DB |
| `disconnectDatabase` | Close connection and cleanup resources |

**Encryption Flow**:
```
User Input (plaintext URI)
         │
         ▼
    Encryption (AES-256-GCM)
         │
         ├─ encryptedText (hex)
         ├─ iv (initialization vector)
         └─ authTag (authentication tag)
         │
         ▼
    MongoDB Storage
```

---

### 3. **AI Query Processing** (`/controllers/ai.controller.js`)
Core logic for schema extraction and intelligent query generation.

| Function | Purpose |
|----------|---------|
| `getMongoSchema` | Extract schema from target MongoDB database |
| `runAiQuery` | Execute AI-powered query in two modes |

**Sub-functions**:
- `getResolvedMongoConnection()`: Fetch, decrypt, and connect to user's DB
- `buildMongoSchema()`: Sample collections (20 docs) and infer field types
- `cleanJsonResponse()`: Parse AI output, remove markdown code fences

---

### 4. **Configuration Layer**

#### `configs/jwt.js`
Generates and verifies JWT tokens with secret keys from environment.

#### `configs/encryption.js`
Implements AES-256-GCM symmetric encryption:
- **Algorithm**: AES-256-GCM
- **Key Size**: 32 bytes (256 bits)
- **IV Size**: 16 bytes (128 bits random)
- **Auth Tag**: Prevents tampering

#### `configs/database.js`
Establishes connection to InsightAI's own MongoDB instance (for user/connection storage).

#### `configs/redis.js`
Redis client for caching and session management (optional feature).

---

### 5. **Middleware Layer**

#### `auth.middleware.js`
JWT verification middleware:
```javascript
1. Extract token from Authorization header
2. Verify signature and expiration
3. Decode and attach user info to req.user
4. Pass to controller if valid, throw error if invalid
```

---

## 📊 Data Flow

### Sequential Flow Diagram: User Registration to Query Execution

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: AUTHENTICATION                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. User registers with email/password                          │
│    POST /api/auth/register                                     │
│         │                                                      │
│         ▼                                                      │
│    Hash password (bcrypt, 10 rounds)                           │
│         │                                                      │
│         ▼                                                      │
│    Create user in MongoDB                                      │
│         │                                                      │
│         ▼                                                      │
│    Generate JWT tokens (access + refresh)                      │
│         │                                                      │
│         ▼                                                      │
│    Return tokens to client                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: CONNECTION MANAGEMENT                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 2. User adds MongoDB connection                                │
│    POST /api/connection/get-connection-string                  │
│    Headers: { Authorization: "Bearer {accessToken}" }          │
│         │                                                      │
│         ▼                                                      │
│    Middleware: Verify JWT token                                │
│         │                                                      │
│         ▼                                                      │
│    Validate MongoDB URI format                                 │
│         │                                                      │
│         ▼                                                      │
│    Encrypt connection string (AES-256-GCM)                     │
│         │                                                      │
│         ▼                                                      │
│    Store encrypted URI + IV + AuthTag in DB                    │
│    (Link to userId for isolation)                              │
│         │                                                      │
│         ▼                                                      │
│    Return connection ID to client                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: AI QUERY EXECUTION                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 3. User asks AI question                                       │
│    POST /api/ai/run-ai-query                                   │
│    Body: {                                                     │
│      connectionId: "...",                                      │
│      question: "What are my top 10 users by revenue?",         │
│      userSelection: "inference" or "query"                     │
│    }                                                            │
│         │                                                      │
│         ▼                                                      │
│    Middleware: Verify JWT token                                │
│         │                                                      │
│         ▼                                                      │
│    Fetch encrypted connection from DB                          │
│         │                                                      │
│         ▼                                                      │
│    ┌─────────────────────────────────────────────┐            │
│    │ DECRYPTION STEP                             │            │
│    │ Decrypt URI using:                          │            │
│    │  - encryptedText + IV + AuthTag             │            │
│    │  - DB_ENCRYPTION_KEY from .env              │            │
│    └──────────────┬──────────────────────────────┘            │
│                  │                                             │
│                  ▼                                             │
│    ┌─────────────────────────────────────────────┐            │
│    │ CONNECTION POOLING                          │            │
│    │ getOrCreateMongoConnection()                │            │
│    │  - Check if connection exists in memory     │            │
│    │  - Reuse if alive (readyState === 1)        │            │
│    │  - Create new if expired (TTL: 5 minutes)   │            │
│    └──────────────┬──────────────────────────────┘            │
│                  │                                             │
│                  ▼                                             │
│    ┌─────────────────────────────────────────────┐            │
│    │ SCHEMA EXTRACTION                           │            │
│    │ buildMongoSchema()                          │            │
│    │  - List all collections                     │            │
│    │  - Sample 20 documents per collection       │            │
│    │  - Infer field types (string/date/objectId) │            │
│    │  - Build schema JSON                        │            │
│    └──────────────┬──────────────────────────────┘            │
│                  │                                             │
│                  ▼                                             │
│    ┌─────────────────────────────────────────────┐            │
│    │ AI PROMPT CONSTRUCTION                      │            │
│    │ Combine:                                    │            │
│    │  - systemPrompt (AI instructions)           │            │
│    │  - Schema JSON                              │            │
│    │  - User question                            │            │
│    │  = Full prompt for Gemini                   │            │
│    └──────────────┬──────────────────────────────┘            │
│                  │                                             │
│                  ▼                                             │
│    ┌─────────────────────────────────────────────┐            │
│    │ GEMINI AI CALL (Step 1)                     │            │
│    │ genAI.getGenerativeModel("gemini-2.5-flash")           │            │
│    │  - Send prompt to Google Gemini              │            │
│    │  - AI generates MongoDB aggregation pipeline │            │
│    │  - Returns JSON with:                       │            │
│    │    {                                        │            │
│    │      "collection": "users",                 │            │
│    │      "pipeline": [...]                      │            │
│    │    }                                        │            │
│    └──────────────┬──────────────────────────────┘            │
│                  │                                             │
│                  ▼                                             │
│    ┌─────────────────────────────────────────────┐            │
│    │ QUERY EXECUTION                             │            │
│    │ executeMongoQuery()                         │            │
│    │  - Run aggregation pipeline against DB      │            │
│    │  - Return results                           │            │
│    └──────────────┬──────────────────────────────┘            │
│                  │                                             │
│         ┌────────┴────────┐                                   │
│         │                 │                                   │
│  If userSelection === "query":                               │
│         │                 │                                   │
│         ▼                 │                                   │
│    Return raw results     │                                   │
│    to client              │                                   │
│                           │                                   │
│     If userSelection === "inference":                        │
│                           │                                   │
│                           ▼                                   │
│    ┌─────────────────────────────────────────────┐            │
│    │ GEMINI AI CALL (Step 2)                     │            │
│    │ Analyze query results with inferencePrompt  │            │
│    │  - AI examines the data                     │            │
│    │  - Generates insights, statistics           │            │
│    │  - Provides business recommendations        │            │
│    │  - Returns structured analysis              │            │
│    └──────────────┬──────────────────────────────┘            │
│                  │                                             │
│                  ▼                                             │
│    Return analysis to client                                  │
│    (with answer, insights, stats)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Security

### JWT Token Flow
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /register
       │    { email, password }
       ▼
   ┌──────────────────────────────┐
   │  Hash password with bcrypt   │
   │  Store user in MongoDB       │
   │  Generate JWT tokens         │
   └──────────────┬───────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
   Access Token         Refresh Token
   (15 min expiry)      (Long-lived)
        │                    │
        │                    ├─→ Stored in DB
        │                    │
        ▼                    │
   Sent to Client ◄──────────┘


┌────────────────────────────────────┐
│  Subsequent API Requests           │
├────────────────────────────────────┤
│                                    │
│  Header: Authorization:            │
│  Bearer {accessToken}              │
│         │                          │
│         ▼                          │
│  auth.middleware:                  │
│   - Extract token                  │
│   - Verify signature               │
│   - Check expiration               │
│   - Decode and attach to req.user  │
│         │                          │
│         ├─ Valid ─→ Continue       │
│         └─ Invalid ─→ 401 Error    │
│                                    │
└────────────────────────────────────┘


┌──────────────────────────────────────┐
│  Token Refresh Flow                  │
├──────────────────────────────────────┤
│                                      │
│  POST /refresh-token                 │
│  Body: { refreshToken }              │
│         │                            │
│         ▼                            │
│  Verify refresh token from DB        │
│         │                            │
│         ├─ Valid ─→ Generate new     │
│         │         access token      │
│         │                            │
│         └─ Invalid ─→ 401 Error      │
│                                      │
└──────────────────────────────────────┘
```

### Encryption for Connection Storage

**AES-256-GCM Encryption Process**:

```
Plain MongoDB URI
"mongodb+srv://user:pass@cluster.mongodb.net/dbname"
         │
         ▼
    ┌─────────────────────────────────┐
    │ 1. Generate random IV (16 bytes) │
    │    iv = crypto.randomBytes(16)   │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ 2. Create cipher with:           │
    │    - Algorithm: aes-256-gcm      │
    │    - Key: DB_ENCRYPTION_KEY (32) │
    │    - IV: generated above         │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ 3. Encrypt URI to hex string     │
    │    encrypted = cipher.update()   │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ 4. Generate auth tag             │
    │    authTag = cipher.getAuthTag() │
    │    (Ensures data isn't tampered) │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ 5. Store in MongoDB:             │
    │    {                             │
    │      encryptedText: "...",       │
    │      iv: "...",                  │
    │      authTag: "..."              │
    │    }                             │
    └─────────────────────────────────┘


Decryption (reverse process):
    
    MongoDB Storage
    {
      encryptedText: "hex",
      iv: "hex", 
      authTag: "hex"
    }
         │
         ▼
    Create decipher with key + IV
         │
         ▼
    Set auth tag (verify integrity)
         │
         ▼
    Decrypt encryptedText
         │
         ▼
    Plain MongoDB URI
```

---

## 🔗 Connection Management

### Connection Pooling with TTL

```
┌──────────────────────────────────────┐
│  mongoConnections Map (In Memory)    │
├──────────────────────────────────────┤
│                                      │
│  Key: connectionId                   │
│  Value: {                            │
│    connection: mongoose.Connection   │
│    lastUsedAt: timestamp             │
│  }                                   │
│                                      │
│  Features:                           │
│  - 5 minute TTL per connection       │
│  - Cleanup every 60 seconds          │
│  - Reuse alive connections           │
│  - Close expired connections         │
│                                      │
└──────────────────────────────────────┘


Connection Lifecycle:
    
    1. CREATE
       getOrCreateMongoConnection()
       └─ Check if exists in map
       └─ If exists + alive (readyState===1) → Reuse
       └─ If exists + dead → Delete + Create new
       └─ If not exists → Create new

    2. USE
       └─ Update lastUsedAt timestamp
       └─ Execute queries

    3. CLEANUP (auto every 60s)
       └─ Find connections older than 5 min
       └─ Close their DB connections
       └─ Remove from memory map
```

---

## 🤖 AI Query Processing

### Two Modes of Operation

#### Mode 1: QUERY (Direct Results)
```
User Question
    │
    ▼
Build Schema (sample 20 docs)
    │
    ▼
Gemini: "Generate MongoDB pipeline for this question"
    │
    ▼
AI returns: { collection, pipeline }
    │
    ▼
Execute pipeline on user's DB
    │
    ▼
Return raw query results to client
```

#### Mode 2: INFERENCE (Analysis + Insights)
```
User Question
    │
    ▼
Build Schema (sample 20 docs)
    │
    ▼
Gemini: "Generate MongoDB pipeline" ─────────┐
    │                                         │
    ▼                                         │
Execute pipeline, get results ────────┐      │
    │                                 │      │
    ├─ Gemini: "Analyze these results"│ │      │
    │  with inferencePrompt ◄─────────┘ │
    │                                  │
    ▼                                  │
AI analyzes: data patterns, statistics,└──────→ 
business insights, recommendations
    │
    ▼
Return structured analysis to client:
{
  answer: "...",
  insights: [...],
  statistics: {...},
  recommendations: [...]
}
```

### Schema Inference Examples

```
Document sample:
{
  _id: ObjectId("..."),
  name: "John",
  age: 30,
  createdAt: 2024-01-15T10:30:00Z,
  tags: ["important", "vip"]
}

Inferred schema:
{
  _id: "objectId",
  name: "string",
  age: "number",
  createdAt: "date",
  tags: "array"
}
```

---

## 📡 API Endpoints - Complete Guide

### Quick Reference Table

| Method | Endpoint | Body | Auth | Purpose |
|--------|----------|------|------|---------|
| POST | `/api/auth/signup` | `{ email, password }` | ✗ | Register new user |
| POST | `/api/auth/login` | `{ email, password }` | ✗ | Login and get tokens |
| POST | `/api/auth/refresh` | `{ refreshToken }` | ✗ | Refresh access token |
| POST | `/api/auth/logout` | — | ✓ | Logout and blacklist token |
| POST | `/api/connection/get-connection-string` | `{ mongoUri, name }` | ✓ | Add DB connection |
| GET | `/api/connection/get-connections` | — | ✓ | List user's connections |
| POST | `/api/connection/connect-to-database` | `{ connectionId }` | ✓ | Test connection |
| POST | `/api/connection/disconnect-database` | `{ connectionId }` | ✓ | Close connection |
| POST | `/api/ai/get-mongo-schema` | `{ connectionId }` | ✓ | Extract schema |
| POST | `/api/ai/run-ai-query` | `{ connectionId, question, userSelection }` | ✓ | Run AI query |

---

## 🔐 Authentication Endpoints (auth.routes.js)

### 1. POST `/api/auth/signup` - Register New User

**Function**: `signup()` in `auth.controller.js`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Step-by-Step Execution Flow**:
```
1. Extract email & password from request body
   └─ Check both are provided (throw error if missing)

2. Query MongoDB for existing user with same email
   └─ Case-insensitive comparison (email lowercased)

3. If user exists
   └─ Throw error: "User with this email already exists"

4. If user doesn't exist
   ├─ Create new User document in MongoDB
   │  └─ Mongoose pre-save hook automatically:
   │     └─ Bcrypt hash password (10 rounds)
   │     └─ Set timestamps (createdAt, updatedAt)
   │
   └─ Fetch created user (exclude password)
      └─ Return user data to client
```

**Error Cases**:
- `400 Bad Request`: Missing email or password
- `400 Bad Request`: User with email already exists
- `500 Internal Server Error`: Database connection failed

---

### 2. POST `/api/auth/login` - User Authentication

**Function**: `login()` in `auth.controller.js`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Step-by-Step Execution Flow**:
```
1. Extract email & password from request body
   └─ Validate both are provided

2. Query MongoDB for user by email
   └─ If not found → throw error: "Invalid email or password"

3. Compare provided password with stored hash
   └─ Use bcrypt.compare() (User model method)
   └─ If mismatch → throw error: "Invalid email or password"

4. Generate JWT tokens
   ├─ accessToken = JWT with userId, expires in 15 minutes
   │  └─ Content: { userId, iat, exp }
   │  └─ Secret: ACCESS_TOKEN_SECRET from .env
   │
   └─ refreshToken = JWT with userId, expires in 7 days
      └─ Content: { userId, iat, exp }
      └─ Secret: REFRESH_TOKEN_SECRET from .env

5. Store refreshToken in database
   └─ Update User.refreshToken field with new token
   └─ This validates the refresh token on later use

6. Return user (without password) + both tokens
   └─ Client stores both tokens
   └─ Access token used for subsequent requests
   └─ Refresh token kept for token renewal
```

**Token Generation Details** (configs/jwt.js):
```javascript
// accessToken (15 min)
generateAccessToken(userId) {
  return jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
}

// refreshToken (7 days)
generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
}
```

**Error Cases**:
- `400 Bad Request`: Missing email or password
- `400 Bad Request`: Invalid email or password (user not found)
- `400 Bad Request`: Invalid email or password (password mismatch)

---

### 3. POST `/api/auth/refresh` - Refresh Access Token

**Function**: `refresh()` in `auth.controller.js`

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Step-by-Step Execution Flow**:
```
1. Extract refreshToken from request body
   └─ Throw error if missing

2. Verify refreshToken signature & expiration
   └─ Use REFRESH_TOKEN_SECRET to decode
   └─ If invalid/expired → throw error: "Invalid refresh token"
   └─ On success → extract userId

3. Fetch refreshToken from database
   └─ Query User by userId
   └─ Get stored refreshToken value
   
4. Compare provided token with stored token
   └─ Must match exactly
   └─ If mismatch → throw error: "Invalid refresh token"
   └─ Guards against token reuse attacks

5. Generate new accessToken
   └─ Use same userId
   └─ New expiration (15 min from now)

6. Return new accessToken
   └─ Client replaces old token
   └─ Can now make authenticated requests again
```

**Error Cases**:
- `400 Bad Request`: Refresh token is required
- `400 Bad Request`: Invalid refresh token (malformed)
- `400 Bad Request`: Invalid refresh token (expired)
- `400 Bad Request`: Invalid refresh token (not in database)

---

### 4. POST `/api/auth/logout` - Logout User

**Function**: `logout()` in `auth.controller.js`

**Request**:
```
Headers: {
  Authorization: "Bearer {accessToken}"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "Logout successful"
}
```

**Step-by-Step Execution Flow**:
```
1. Middleware: Verify accessToken
   └─ Extract token from Authorization header
   └─ Decode and validate signature
   └─ Check expiration
   └─ If valid → attach userId to req.user

2. Extract token from Authorization header
   └─ Format: "Bearer {token}"
   └─ Split by space and get second part

3. Decode token to get expiration time
   └─ verifyAccessToken() to confirm validity
   └─ Extract exp claim (expiration timestamp)

4. Calculate remaining TTL (Time To Live)
   └─ TTL = (exp * 1000 - current time) / 1000
   └─ This is how long until token naturally expires

5. Blacklist the token in Redis
   └─ Store token with key = token hash
   └─ Value = empty/true
   └─ TTL = remaining expiration time
   └─ Purpose: Prevent token reuse after logout

6. Clear user's refresh token from database
   └─ Set User.refreshToken = null
   └─ Prevents refresh token from being used

7. Return success message
   └─ Token is now invalidated
   └─ Valid logout complete
```

**Token Blacklisting (Redis)**:
```
When logout called:
  ├─ Token added to Redis blacklist
  │  └─ Key: sha256(token)
  │  └─ Value: true
  │  └─ Expires: token's natural expiration
  │
  └─ On subsequent requests:
     └─ Middleware checks if token in blacklist
     └─ If blacklisted → reject request
     └─ Prevents token reuse after logout
```

**Error Cases**:
- `401 Unauthorized`: Missing authorization header
- `401 Unauthorized`: Invalid token signature
- `401 Unauthorized`: Token expired
- `400 Bad Request`: Authorization token is required

---

## 💾 Connection Management Endpoints (connection.routes.js)

### 5. POST `/api/connection/get-connection-string` - Add Database Connection

**Function**: `getMongoUri()` in `connection.controller.js`

**Request**:
```json
{
  "mongoUri": "mongodb+srv://user:pass@cluster0.mongodb.net/dbname?retryWrites=true",
  "name": "Production Database"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "Connection created successfully",
  "data": {
    "connection": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "name": "Production Database",
      "connecteduri": {
        "encryptedText": "a3f8b2c9d4e1f7a2b8c5d9e0f1a4b7c9...",
        "iv": "f2e8c4a9d5b1e7f3a0c6d2b8e4f1a7c9",
        "authTag": "e1f4c7b2a9d6e3f0c5b8a2d7e9f1c4b7"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Step-by-Step Execution Flow**:
```
1. Middleware: Verify accessToken
   └─ Extract userId from token → req.user._id

2. Validate input
   ├─ Check mongoUri is provided
   └─ Check name is provided
   └─ Throw error if either missing

3. Validate MongoDB URI format
   └─ Must start with "mongodb://" OR "mongodb+srv://"
   └─ Must have minimum length (20+ chars)
   └─ Throw error if format invalid

4. TEST CONNECTION (Critical Step)
   ├─ Use getOrCreateMongoConnection() to connect
   ├─ Call ping() on database
   ├─ If successful → proceed
   └─ If failed → Throw error with reason
      └─ Prevents storing invalid URIs

5. Encrypt MongoDB URI
   ├─ Generate random 16-byte IV
   ├─ Create AES-256-GCM cipher
   │  ├─ Algorithm: aes-256-gcm
   │  ├─ Key: DB_ENCRYPTION_KEY from .env (32 bytes)
   │  └─ IV: randomly generated
   ├─ Encrypt URI to hex string
   ├─ Generate authentication tag
   └─ Result: { encryptedText, iv, authTag }

6. Create Connection document in MongoDB
   ├─ Connection schema fields:
   │  ├─ userId: Set to authenticated user ID
   │  ├─ name: User-provided connection name
   │  └─ connecteduri: Encrypted object
   └─ Save to "Connection" collection

7. Return connection with encrypted URI
   └─ Original plaintext URI NOT returned
   └─ Only encrypted version stored/returned
```

**Encryption Deep-Dive**:
```
Original URI: "mongodb+srv://user:pass@cluster.mongodb.net/db"
                         │
                         ▼
Encryption Process:
    1. Generate IV (16 random bytes)
       iv = [0xf2, 0xe8, 0xc4, 0xa9, ...]

    2. Create cipher
       cipher = crypto.createCipheriv(
         "aes-256-gcm",
         Buffer.from(DB_ENCRYPTION_KEY, "base64"),  // 32 bytes
         iv  // 16 bytes
       )

    3. Encrypt URI
       encrypted = cipher.update(uri, "utf8", "hex")
       encrypted += cipher.final("hex")
       // Result: "a3f8b2c9d4e1f7a2b8c5d9e0f1a4b7c9..."

    4. Get authentication tag
       authTag = cipher.getAuthTag().toString("hex")
       // Result: "e1f4c7b2a9d6e3f0c5b8a2d7e9f1c4b7"

Stored in Database:
{
  connecteduri: {
    encryptedText: "a3f8...",
    iv: "f2e8...",
    authTag: "e1f4..."
  }
}
```

**Error Cases**:
- `401 Unauthorized`: Invalid access token
- `400 Bad Request`: MongoDB URI and name are required
- `400 Bad Request`: Invalid MongoDB URI format
- `400 Bad Request`: MongoDB URI appears incomplete
- `400 Bad Request`: Connection test failed (actual DB error)

---

### 6. GET `/api/connection/get-connections` - List User's Connections

**Function**: `getConnectionByUser()` in `connection.controller.js`

**Request**:
```
Headers: {
  Authorization: "Bearer {accessToken}"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "Connections fetched successfully",
  "data": {
    "connections": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": "507f1f77bcf86cd799439011",
        "name": "Production Database",
        "connecteduri": {
          "encryptedText": "a3f8...",
          "iv": "f2e8...",
          "authTag": "e1f4..."
        },
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "507f1f77bcf86cd799439011",
        "name": "Staging Database",
        "connecteduri": { ... }
      }
    ]
  }
}
```

**Step-by-Step Execution Flow**:
```
1. Middleware: Verify accessToken
   └─ Extract userId from token → req.user._id

2. Validate userId exists
   └─ Check req.user._id is set
   └─ Throw error if missing

3. Query MongoDB for all connections
   ├─ Query: Connection.find({ userId: userId })
   ├─ Returns array of connection documents
   └─ Includes: name, encrypted URI, timestamps

4. Validate results
   ├─ If no connections found
   │  └─ Return empty array (or error based on design)
   └─ If connections found → continue

5. Return connections array
   ├─ Each connection includes encrypted URI
   │  (Original plaintext never exposed)
   └─ Client receives connection IDs for later use
   └─ Client sees connection names for identification
```

**Data Isolation**:
- Query ensures only connections belonging to authenticated user are returned
- userId field prevents cross-user data visibility
- MongoDB automatically filters by userId

**Error Cases**:
- `401 Unauthorized`: Invalid access token
- `400 Bad Request`: User ID is required

---

### 7. POST `/api/connection/connect-to-database` - Test Connection

**Function**: `connectToDatabase()` in `connection.controller.js`

**Request**:
```json
{
  "connectionId": "507f1f77bcf86cd799439012"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "Connected to database successfully",
  "data": {
    "connectionName": "Production Database",
    "status": "connected",
    "host": "cluster0.6ok7t.mongodb.net",
    "database": "insightai"
  }
}
```

**Step-by-Step Execution Flow**:
```
1. Middleware: Verify accessToken
   └─ Extract userId from token → req.user._id

2. Extract connectionId from request
   └─ Throw error if missing

3. Query MongoDB for connection
   ├─ Query: Connection.findOne({
   │    _id: connectionId,
   │    userId: userId  // Security: ensure ownership
   │  })
   ├─ If not found → throw error: "Connection not found"
   └─ If found → continue with encrypted URI

4. Decrypt encrypted connection string
   ├─ Get: encryptedText, iv, authTag from DB
   ├─ Create decipher with:
   │  ├─ Algorithm: aes-256-gcm
   │  ├─ Key: DB_ENCRYPTION_KEY from .env
   │  └─ IV: iv from stored object
   ├─ Set authentication tag: decipher.setAuthTag()
   ├─ Decrypt to get plaintext URI
   └─ Result: "mongodb+srv://user:pass@cluster..."

5. Establish MongoDB connection (or reuse from pool)
   ├─ Call getOrCreateMongoConnection()
   ├─ Check if connection exists in memory
   ├─ If exists + alive (readyState === 1) → reuse
   ├─ If exists + dead → delete + create new
   └─ If not exists → create new connection
      └─ For new connections: Try to ping DB

6. Perform database ping test
   ├─ Call connection.db.admin().ping()
   ├─ Server responds → connection valid
   └─ Confirms database is reachable

7. Update connection lastUsedAt timestamp
   └─ In memory: connectionMap[id].lastUsedAt = Date.now()

8. Return connection metadata
   ├─ connectionName: from Connection document
   ├─ status: "connected" (based on readyState)
   ├─ host: connection hostname
   └─ database: database name from URI
```

**Connection Pooling Details**:
```
When connectToDatabase() called:

getOrCreateMongoConnection(connectionId, decryptedUri):
  ├─ Check mongoConnections Map
  ├─ If key exists:
  │  ├─ If readyState === 1 (connected)
  │  │  ├─ Update lastUsedAt = Date.now()
  │  │  └─ Return existing connection
  │  └─ If readyState !== 1 (disconnected)
  │     ├─ Close connection
  │     ├─ Remove from map
  │     └─ Create new (fall through)
  │
  └─ Create new connection:
     ├─ mongoose.createConnection(decryptedUri)
     ├─ Store in map: {
     │    connectionId: {
     │      connection: mongooseConnection,
     │      lastUsedAt: Date.now()
     │    }
     │  }
     └─ Start TTL cleanup timer (runs every 60s)
        └─ Removes connections idle > 5 minutes
```

**Error Cases**:
- `401 Unauthorized`: Invalid access token
- `400 Bad Request`: Connection ID is required
- `404 Not Found`: Connection not found (wrong ID or user)
- `500 Internal Server Error`: Failed to connect to database
- `500 Internal Server Error`: Cannot decrypt connection URI

---

### 8. POST `/api/connection/disconnect-database` - Close Connection

**Function**: `disconnectDatabase()` in `connection.controller.js`

**Request**:
```json
{
  "connectionId": "507f1f77bcf86cd799439012"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "Disconnected from database successfully"
}
```

**Step-by-Step Execution Flow**:
```
1. Middleware: Verify accessToken
   └─ Extract userId from token → req.user._id

2. Extract connectionId from request
   └─ Throw error if missing

3. Query MongoDB for connection
   ├─ Query: Connection.findOne({
   │    _id: connectionId,
   │    userId: userId  // Ownership check
   │  })
   ├─ If not found → throw error: "Connection not found"
   └─ If found → continue

4. Close connection in memory pool
   ├─ Call closeMongoConnection(connectionId.toString())
   ├─ Function logic:
   │  ├─ Get connection from mongoConnections map
   │  ├─ If exists:
   │  │  ├─ Call connection.close()
   │  │  ├─ Remove from map
   │  │  └─ Return true
   │  └─ If doesn't exist:
   │     └─ Return false
   └─ Result: Connection removed from memory

5. Return success message
   └─ Connection is now closed
   └─ Freed up memory resources
```

**Connection Cleanup Automatic Process**:
```
Independent cleanup loop (runs every 60 seconds):

cleanupIdleConnections():
  ├─ Get current time
  └─ For each connection in mongoConnections Map:
     ├─ Check if connection is active (readyState === 1)
     ├─ Check time since last use vs TTL (5 minutes)
     │
     ├─ If connection NOT active OR idle > 5 min:
     │  ├─ Call connection.close()
     │  ├─ Remove from map
     │  └─ Free resources
     │
     └─ If connection alive AND recently used:
        └─ Keep in map for reuse
```

**Error Cases**:
- `401 Unauthorized`: Invalid access token
- `400 Bad Request`: Connection ID is required
- `404 Not Found`: Connection not found

---

## 🤖 AI Query Endpoints (ai.routes.js)

### 9. POST `/api/ai/get-mongo-schema` - Extract Database Schema

**Function**: `getMongoSchema()` in `ai.controller.js`

**Request**:
```json
{
  "connectionId": "507f1f77bcf86cd799439012"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "message": "Schema extracted successfully",
  "data": {
    "schema": {
      "users": {
        "_id": "objectId",
        "email": "string",
        "name": "string",
        "age": "number",
        "createdAt": "date",
        "isActive": "boolean",
        "tags": "array"
      },
      "orders": {
        "_id": "objectId",
        "userId": "objectId",
        "amount": "number",
        "status": "string",
        "items": "array",
        "createdAt": "date"
      }
    }
  }
}
```

**Step-by-Step Execution Flow**:
```
1. Middleware: Verify accessToken
   └─ Extract userId from token → req.user._id

2. Extract connectionId from request
   └─ Throw error if missing

3. Call getResolvedMongoConnection()
   ├─ Query: Connection.findOne({
   │    _id: connectionId,
   │    userId: userId
   │  })
   ├─ If not found → throw "Connection not found"
   ├─ Get encrypted URI: connecteduri
   │
   ├─ Decrypt URI:
   │  ├─ Get encryptedText, iv, authTag
   │  ├─ Create decipher with AES-256-GCM
   │  ├─ Decrypt to plaintext URI
   │  └─ Catch errors → throw "Cannot decrypt"
   │
   ├─ Connect to database:
   │  └─ Call getOrCreateMongoConnection(connectionId, decryptedUri)
   │  └─ Returns mongoose Connection object
   │
   └─ Return { connection, savedConnection }

4. Call buildMongoSchema(connection.db)
   ├─ Step 4a: List all collections
   │  ├─ db.listCollections().toArray()
   │  ├─ Get array of collection metadata
   │  └─ Result: [{ name: "users" }, { name: "orders" }, ...]
   │
   ├─ Step 4b: For each collection:
   │  ├─ Sample documents: db.collection(name).find({}).limit(20)
   │  ├─ Result: array of up to 20 documents
   │  │
   │  ├─ Step 4c: Infer field types from sample
   │  │  └─ For each document:
   │  │     └─ For each field key:
   │  │        ├─ Check if already in fields object
   │  │        ├─ If not → add it with inferred type
   │  │        └─ Types: string, number, boolean, array, date, objectId, object, null
   │  │
   │  ├─ Example inference:
   │  │  ├─ _id: ObjectId → type: "objectId"
   │  │  ├─ email: "user@example.com" → type: "string"
   │  │  ├─ age: 30 → type: "number"
   │  │  ├─ createdAt: Date → type: "date"
   │  │  ├─ tags: ["tag1", "tag2"] → type: "array"
   │  │  └─ metadata: { ... } → type: "object"
   │  │
   │  └─ Store in schema: schema[collectionName] = fields
   │
   └─ Return complete schema object

5. Return schema to client
   └─ Schema is used in AI queries
   └─ AI uses schema to understand data structure
```

**Schema Inference Algorithm**:
```javascript
inferType(value) logic:
  └─ if (value === null) → "null"
  └─ if (Array.isArray(value)) → "array"
  └─ if (value instanceof Date) → "date"
  └─ if (value instanceof Object && value._bsontype === "ObjectID") → "objectId"
  └─ else → typeof value ("string", "number", "boolean", "object")
```

**Example Schema Building**:
```
Collection: "users"
Sample documents (limit 20):
  Doc 1: { _id: ObjectId, email: "a@b.com", age: 25, createdAt: Date }
  Doc 2: { _id: ObjectId, email: "c@d.com", age: 30, createdAt: Date }
  Doc 3: { _id: ObjectId, email: "e@f.com", age: null, createdAt: Date }

After sampling all 20 docs:
  Inferred schema:
  {
    _id: "objectId",
    email: "string",
    age: "number",  (ignores null in doc 3)
    createdAt: "date"
  }
```

**Error Cases**:
- `401 Unauthorized`: Invalid access token
- `400 Bad Request`: Connection ID is required
- `404 Not Found`: Connection not found
- `500 Internal Server Error`: Cannot decrypt URI
- `500 Internal Server Error`: Database connection failed

---

### 10. POST `/api/ai/run-ai-query` - Execute AI-Powered Query

**Function**: `runAiQuery()` in `ai.controller.js`

**Request**:
```json
{
  "connectionId": "507f1f77bcf86cd799439012",
  "question": "What are the top 5 users by order count?",
  "userSelection": "inference"
}
```

**Response** (Success - Inference Mode):
```json
{
  "statusCode": 200,
  "message": "Analysis completed successfully",
  "data": {
    "analysis": {
      "answer": "The top 5 users by order count are...",
      "insights": [
        "User 'john@example.com' leads with 45 orders",
        "Average orders per user: 12.3",
        "5 users account for 35% of total orders"
      ],
      "statistics": {
        "topUser": "john@example.com",
        "orderCount": 45,
        "totalValue": 4500.50
      }
    }
  }
}
```

**Response** (Success - Query Mode):
```json
{
  "statusCode": 200,
  "message": "Query executed successfully",
  "data": {
    "aiQuery": {
      "collection": "users",
      "pipeline": [
        {
          "$lookup": {
            "from": "orders",
            "localField": "_id",
            "foreignField": "userId",
            "as": "userOrders"
          }
        },
        {
          "$addFields": {
            "orderCount": { "$size": "$userOrders" }
          }
        },
        {
          "$sort": { "orderCount": -1 }
        },
        {
          "$limit": 5
        }
      ]
    },
    "response": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "email": "john@example.com",
        "orderCount": 45,
        "userOrders": [...]
      },
      ...
    ]
  }
}
```

**Complete Execution Flow**:
```
═══════════════════════════════════════════════════════════════════
PHASE 1: SETUP & VALIDATION
═══════════════════════════════════════════════════════════════════

1. Middleware: Verify accessToken
   └─ Extract userId from token → req.user._id

2. Validate request parameters
   ├─ connectionId: required
   ├─ question: required
   ├─ userSelection: must be "query" or "inference"
   └─ Throw errors for missing/invalid params

3. Get database connection
   ├─ Call getResolvedMongoConnection(userId, connectionId)
   ├─ Follows same decryption/connection logic as schema extraction
   └─ Returns mongoose connection object


═══════════════════════════════════════════════════════════════════
PHASE 2: SCHEMA EXTRACTION
═══════════════════════════════════════════════════════════════════

4. Build database schema
   ├─ Call buildMongoSchema(connection.db)
   ├─ Same process as endpoint #9
   └─ Result: schema object with all collections/fields


═══════════════════════════════════════════════════════════════════
PHASE 3: AI QUERY GENERATION (Gemini Step 1)
═══════════════════════════════════════════════════════════════════

5. Initialize Gemini AI client
   ├─ new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
   ├─ Get model: "gemini-2.5-flash"
   └─ Fast, cost-effective model for generation

6. Build AI prompt for query generation
   ├─ Combine three parts:
   │  ├─ Part A: systemPrompt
   │  │  └─ Instructions telling AI:
   │  │     ├─ You are MongoDB expert
   │  │     ├─ Generate aggregation pipelines
   │  │     ├─ Return valid JSON only
   │  │     └─ Follow MongoDB best practices
   │  │
   │  ├─ Part B: Database schema
   │  │  └─ JSON stringified schema (formatted pretty)
   │  │
   │  └─ Part C: User question
   │     └─ "User Question: {user's question}"
   │
   └─ Combine: fullPrompt = systemPrompt + "\n\n" + schema + "\n\n" + question

7. Call Gemini API for query generation
   ├─ model.generateContent(fullPrompt)
   ├─ Send to Google's servers
   ├─ AI processes and generates pipeline
   ├─ Returns response as text
   └─ Log raw response for debugging

8. Parse AI response to JSON
   ├─ Raw response often has markdown formatting:
   │  ```json
   │  { collection: "...", pipeline: [...] }
   │  ```
   │
   ├─ Clean response:
   │  └─ Remove ``` json at start
   │  └─ Remove ``` at end
   │  └─ Trim whitespace
   │
   ├─ Parse to JSON object
   ├─ Catch parse errors → throw with context
   └─ Result: { collection, pipeline }

9. Validate Gemini output
   ├─ Check 'collection' field exists
   ├─ Check 'pipeline' field exists
   ├─ Validate pipeline structure:
   │  ├─ Only allowed stages: $match, $group, $sort, $limit, $project, $lookup, $unwind, $count, $addFields, $set
   │  ├─ Block dangerous stages: $out, $merge, $graphLookup
   │  └─ Throw error for invalid stages
   └─ Validation prevents injection/malicious queries


═══════════════════════════════════════════════════════════════════
PHASE 4: QUERY EXECUTION
═══════════════════════════════════════════════════════════════════

10. Execute MongoDB aggregation pipeline
    ├─ executeMongoQuery({
    │    connection,
    │    collection,
    │    pipeline,
    │    schema
    │  })
    │
    ├─ Validate collection exists in schema
    ├─ Get collection: connection.collection(collectionName)
    ├─ Run aggregation: collection.aggregate(pipeline)
    ├─ Convert to array: .toArray()
    └─ Result: array of documents

11a. IF userSelection === "query":
     ├─ Return raw query results immediately
     └─ Response: {
          aiQuery: { collection, pipeline },
          response: [...query results...]
        }


═══════════════════════════════════════════════════════════════════
PHASE 5: AI ANALYSIS (Gemini Step 2) - INFERENCE MODE ONLY
═══════════════════════════════════════════════════════════════════

11b. IF userSelection === "inference":
     ├─ Build analysis prompt
     │  ├─ Part A: inferencePrompt
     │  │  └─ Instructions: "Analyze these results and provide insights"
     │  │
     │  ├─ Part B: Database schema
     │  │  └─ JSON stringified
     │  │
     │  ├─ Part C: User question
     │  │
     │  ├─ Part D: Query results
     │  │  └─ All documents from aggregation
     │  │
     │  └─ Part E: Collection name
     │     └─ For context
     │
     ├─ Combine into analysisPrompt
     │  └─ Format: inferencePrompt + "\n\n${analysisPrompt}"
     │
     └─ Call Gemini API again
        ├─ model.generateContent(analysisPrompt)
        ├─ AI analyzes the data
        ├─ Generates insights, statistics, recommendations
        └─ Returns JSON response

12. Parse analysis response
    ├─ Same cleaning as query response
    │  ├─ Remove markdown code fences
    │  └─ Parse to JSON
    │
    ├─ Required fields:
    │  ├─ answer: Main answer to question
    │  ├─ insights: Array of key insights
    │  └─ statistics: Object with computed stats
    │
    └─ Catch parse errors → throw

13. Return analysis to client
    └─ Response: {
         message: "Analysis completed successfully",
         data: { analysis: {...} }
       }
```

**Example: Complete Query & Analysis Flow**

```
User Question (from /run-ai-query):
"What are my top 5 customers by spending this year?"

─────────────────────────────────────────

Gemini Step 1 Output (Query Generation):
{
  "collection": "users",
  "pipeline": [
    {
      "$lookup": {
        "from": "orders",
        "localField": "_id",
        "foreignField": "customerId",
        "as": "orders"
      }
    },
    {
      "$addFields": {
        "totalSpending": {
          "$sum": "$orders.amount"
        },
        "orderYear": {
          "$year": {
            "$arrayElemAt": ["$orders.date", 0]
          }
        }
      }
    },
    {
      "$match": {
        "orderYear": 2024
      }
    },
    {
      "$sort": {
        "totalSpending": -1
      }
    },
    {
      "$limit": 5
    }
  ]
}

─────────────────────────────────────────

MongoDB Execution Result:
[
  {
    _id: ObjectId(...),
    name: "John Doe",
    email: "john@example.com",
    totalSpending: 15000,
    orders: [...]
  },
  {
    _id: ObjectId(...),
    name: "Jane Smith",
    email: "jane@example.com",
    totalSpending: 12500,
    orders: [...]
  },
  ...
]

─────────────────────────────────────────

If userSelection === "query":
  Return: { aiQuery, response }
  [DONE - Query mode]

─────────────────────────────────────────

If userSelection === "inference":
  Send to Gemini Step 2 (Analysis)

Gemini Step 2 Output (Analysis):
{
  "answer": "Your top 5 customers by spending in 2024 are John Doe ($15,000), Jane Smith ($12,500), Robert Johnson ($11,200), Maria Garcia ($10,800), and Ahmed Hassan ($9,750).",
  "insights": [
    "John Doe is your highest value customer with $15,000 spent",
    "Top 5 customers account for $59,250 (47% of total revenue)",
    "Average spending per user: $11,850",
    "There's a 22% spending drop between #1 and #5 customer"
  ],
  "statistics": {
    "totalRevenueFromTop5": 59250,
    "averageSpendingTop5": 11850,
    "highestCustomer": "John Doe",
    "highestAmount": 15000,
    "percentageOfTotal": "47%"
  }
}

─────────────────────────────────────────

Return to client:
{
  message: "Analysis completed successfully",
  data: { analysis: {...above...} }
}
```

**Validation & Security**:
```
Pipeline Validation:

ALLOWED_STAGES = {
  "$match",        // Filtering
  "$group",        // Aggregation
  "$sort",         // Sorting
  "$limit",        // Limiting results
  "$skip",         // Pagination
  "$project",      // Field projection
  "$unwind",       // Array unwinding
  "$lookup",       // Joins
  "$count",        // Counting
  "$addFields",    // Add computed fields
  "$set"           // Update fields
}

BLOCKED_STAGES = {
  "$out",          // Write results to new collection (dangerous)
  "$merge",        // Merge results (dangerous)
  "$graphLookup",  // Complex lookup (resource intensive)
  "$currentOp",    // System operations
  "$listSessions"  // System operations
}

Before execution: validateMongoPipeline(pipeline)
  └─ Check each stage is an object with exactly 1 key
  └─ Verify operator is in ALLOWED_STAGES
  └─ Reject if in BLOCKED_STAGES
  └─ Throw error with details
```

**Error Cases**:
- `401 Unauthorized`: Invalid access token
- `400 Bad Request`: Missing connectionId or question
- `400 Bad Request`: Invalid userSelection (not "query" or "inference")
- `404 Not Found`: Connection not found
- `400 Bad Request`: AI response missing collection or pipeline
- `500 Internal Server Error`: Cannot connect to database
- `500 Internal Server Error`: AI returned invalid JSON
- `500 Internal Server Error`: Invalid MongoDB stages detected

---

---

## 📊 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (bcrypt hashed),
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Connection Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  connecteduri: {
    encryptedText: String (hex),
    iv: String (hex),
    authTag: String (hex)
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⚠️ Error Handling

### Error Response Format
```javascript
{
  statusCode: Number,
  message: String,
  problem: String,
  error: [String],
  icon: "error"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ENOTFOUND _mongodb._tcp.cluster.mongodb.net` | Invalid MongoDB URI or network issue | Verify URI, check MongoDB Atlas whitelist |
| `401 Unauthorized` | Missing/invalid JWT token | Include valid Authorization header |
| `Connection not found` | ConnectionId doesn't belong to user | Verify user is authenticated & ID is correct |
| `AI returned invalid JSON` | Gemini output parsing error | Check AI prompt, try again |
| `Encryption key must be 32 bytes` | Invalid DB_ENCRYPTION_KEY | Ensure key is 32 bytes base64 encoded |

### Error Handling Flow
```javascript
Controller Function
    │
    ├─ Validation checks
    ├─ Try database operations
    ├─ Try external API calls (Gemini)
    │
    ├─ Error caught
    │   ├─ Log error with context
    │   ├─ Create ApiError with status code
    │   └─ Send error response to client
    │
    └─ Success
        └─ Send ApiResponse to client
```

---

## 🔄 Request-Response Cycle Example

### Query Execution Flow

**Request**:
```bash
POST /api/ai/run-ai-query HTTP/1.1
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "connectionId": "507f1f77bcf86cd799439011",
  "question": "What's my total revenue this month?",
  "userSelection": "inference"
}
```

**Processing**:
```
1. Express receives request
2. CORS middleware processes
3. Body parser extracts JSON
4. Router matches to ai.routes.js
5. auth.middleware verifies JWT
   └─ Extracts userId from token
6. ai.controller.runAiQuery executes:
   ├─ Fetch connection from DB
   ├─ Decrypt URI
   ├─ Connect to user's MongoDB
   ├─ Extract schema (sample 20 docs)
   ├─ Call Gemini API (Step 1)
   │  └─ Send system prompt + schema + question
   │  └─ Receive: { collection, pipeline }
   ├─ Execute pipeline query
   ├─ Call Gemini API (Step 2)
   │  └─ Send analysis prompt + results
   │  └─ Receive: { answer, insights, stats }
   └─ Build ApiResponse
7. Send response to client
```

**Response**:
```json
{
  "statusCode": 200,
  "message": "Analysis completed successfully",
  "data": {
    "analysis": {
      "answer": "Your total revenue this month is $45,230",
      "insights": [
        "Top performing region: North America ($18,560)",
        "Growth rate: +15% vs last month"
      ],
      "statistics": {
        "totalRevenue": 45230,
        "averageOrderValue": 235.50,
        "transactionCount": 192
      }
    }
  }
}
```

---

## 🚀 Deployment Considerations

1. **Environment Variables**: All sensitive data must be in `.env`
   - `MONGODB_URI` (InsightAI's own DB)
   - `GEMINI_API_KEY` (Google AI API)
   - `JWT_SECRET_ACCESS` & `JWT_SECRET_REFRESH`
   - `DB_ENCRYPTION_KEY` (32-byte base64)

2. **Security**:
   - Keep `.env` in `.gitignore`
   - Use HTTPS in production
   - Implement rate limiting
   - Validate all user inputs
   - Keep Gemini API key secure

3. **Scaling**:
   - Use Redis for session caching
   - Implement connection pool limits
   - Monitor Gemini API quota usage
   - Add request logging/monitoring

4. **Database**:
   - Ensure MongoDB Atlas whitelist includes server IP
   - Regular backups of user connections
   - Index commonly searched fields

---

## 📚 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.2.1 | Web framework |
| `mongoose` | ^9.0.2 | MongoDB ODM |
| `jsonwebtoken` | ^9.0.3 | JWT tokens |
| `bcrypt` | ^6.0.0 | Password hashing |
| `@google/generative-ai` | ^0.24.1 | Gemini AI API |
| `dotenv` | ^17.2.3 | Environment variables |
| `cors` | ^2.8.5 | Cross-origin requests |
| `ioredis` | ^5.8.2 | Redis client |

---

## 🎓 Summary

InsightAI is a sophisticated backend service that securely bridges users to their MongoDB databases through natural language interface powered by AI. The architecture emphasizes **security** (encryption, JWT auth), **scalability** (connection pooling), and **intelligence** (AI-powered query generation). Each layer—authentication, connection management, and AI processing—is independently testable and maintainable.
