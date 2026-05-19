# InsightAI Session Tracker

## 🎯 Session Overview

**Project:** InsightAI API  
**Goal:** Build a secure authentication and AI-powered database schema analysis API  
**Current Phase:** Core Features Implementation + AI Query Execution  
**Tech Stack:** 
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (primary), Redis (caching/tokens)
- **Authentication:** JWT (Access & Refresh Tokens)
- **Security:** AES-256-GCM encryption, bcrypt password hashing
- **AI/ML:** Google Generative AI (Gemini 2.5 Flash)
- **Utilities:** Mongoose ODM, ioredis, bcrypt

---

## 📋 Current Tasks

### In Progress
- [ ] Complete AI query execution pipeline
- [ ] Implement inference/analysis feature using Gemini AI
- [ ] Add comprehensive input validation (Joi/Zod)
- [ ] Optimize schema caching mechanism
- [ ] Create unit and integration tests

### Completed ✅
- [x] User authentication (signup, login, logout, refresh)
- [x] JWT token management with Redis blacklisting
- [x] Database connection management with encryption
- [x] Schema extraction from connected MongoDB instances
- [x] Automatic type inference for database fields
- [x] AI-powered query generation using Gemini API
- [x] Fixed module export issues in mongoConnections
- [x] Updated comprehensive README documentation

### Pending
- [ ] Rate limiting on authentication endpoints
- [ ] Connection list/delete endpoints
- [ ] Schema comparison feature
- [ ] Error logging to external service
- [ ] Docker containerization

### 🚫 Blockers/Issues
- **None currently** - All critical features working as expected

---

## 📊 Progress Log

### 2026-05-19 (Latest Session)
#### Morning Work
- **Fixed Module Exports**: Corrected dual default exports in `mongoConnections.js` causing SyntaxError
- **Verified Console Logging**: Fixed console.log connectivity issues in AI controller
- **Updated README**: Cleaned up corrupted documentation, added AI features section

#### Implementation Work
- **AI Query Execution**: Implemented `runAiQuery` controller with:
  - Schema-based query generation using Gemini AI
  - JSON parsing with error handling
  - Query execution on MongoDB
  - Inference mode for detailed analysis
- **Schema Building**: Created `buildMongoSchema()` utility for dynamic schema extraction
- **JSON Handling**: Implemented `cleanJsonResponse()` to parse AI-generated JSON with markdown formatting

#### Key Decisions Made
1. **Two-Tier AI Processing**: Split query generation and inference into separate steps for clarity
2. **User Selection Parameter**: Added `userSelection` to support both "query" and "inference" modes
3. **Encrypted Connection Retrieval**: Implemented `getResolvedMongoConnection()` for secure connection handling
4. **Gemini API Integration**: Chose Gemini 2.5 Flash for fast, cost-effective AI responses

#### Learning Outcomes
- Gemini API returns JSON within markdown code blocks - need cleaning before parsing
- Connection object from mongoose.createConnection() has `.db` property for direct MongoDB access
- Type inference must handle complex BSON types (ObjectID, dates) separately from JS types

---

## 🏗️ File Structure Updates

### New Files Created
- `routes/ai.routes.js` - AI endpoint routing
- `utils/mongoConnections.js` - Connection pool + type inference + AI prompts (expanded)
- `utils/aiUtils.js` - AI query execution utilities

### Files Modified
- **controllers/ai.controllor.js** - Added:
  - `getResolvedMongoConnection()` - Decrypt and retrieve connections
  - `buildMongoSchema()` - Extract database schemas
  - `cleanJsonResponse()` - Parse AI-generated JSON
  - `runAiQuery()` - Main AI query execution handler
  
- **utils/mongoConnections.js** - Updated:
  - Added `systemPrompt` for query compilation instructions
  - Added `inferencePrompt` for analysis instructions
  - Added `getOrCreateMongoConnection()` for connection pooling
  - Added named exports alongside default export

- **README.md** - Comprehensive documentation overhaul:
  - Added AI features section
  - Corrected all endpoint paths
  - Added schema analysis API docs
  - Updated file structure documentation
  - Added "Recently Completed" progress tracking

### Files Not Modified (But Important)
```
configs/
  ├── database.js     # MongoDB connection
  ├── encryption.js   # AES-256-GCM encryption
  ├── jwt.js          # JWT token management
  └── redis.js        # Redis client

controllers/
  ├── auth.controller.js       # ✅ Complete
  └── connection.controllor.js # ✅ Complete

middlewares/
  └── auth.middlware.js        # ✅ Complete

models/
  ├── connection.models.js # ✅ Complete
  └── user.models.js       # ✅ Complete

utils/
  ├── ApiError.js       # ✅ Complete
  ├── ApiResponse.js    # ✅ Complete
  └── asyncHandler.js   # ✅ Complete
```

---

## 🔧 Environment & Setup

### Prerequisites
```bash
Node.js v14+
MongoDB (local or Atlas)
Redis (local or cloud)
Google Gemini API Key
```

### Installation
```bash
cd insightAI
npm install
```

### Environment Variables (.env)
```env
# Server
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/insightai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
ACCESS_TOKEN_SECRET=your-32-char-hex-secret
REFRESH_TOKEN_SECRET=your-32-char-hex-secret

# Encryption
DB_ENCRYPTION_KEY=your-32-byte-base64-encoded-key

# AI/Gemini
GEMINI_API_KEY=your-google-generative-ai-key
```

### Running the Project
```bash
# Development (with nodemon)
npm run dev

# Production
npm start

# Check health
curl http://localhost:3000/health
```

---

## 🐛 Bugs & Fixes

### Bug #1: Dual Default Exports
**Symptom:** `SyntaxError: A module cannot have multiple default exports`  
**Location:** `utils/mongoConnections.js` (lines 291-292)  
**Root Cause:** File had both `export default systemPrompt` and `export default mongoConnections`  
**Fix Applied:** 
```javascript
export default mongoConnections;
export { mongoConnections, inferType, systemPrompt };
```
**Resolution:** ✅ FIXED - Now supports both default and named imports

### Bug #2: Console Log Not Working in Postman
**Symptom:** Console logs not appearing when calling API endpoints  
**Location:** `controllers/ai.controllor.js` (original version)  
**Root Cause:** 
- Missing `authenticate` middleware on route (req.user undefined)
- Using `connectionId` from body instead of `userId` from authenticated user
- Unnecessary `await` on Map object
  
**Fix Applied:**
1. Added `authenticate` middleware to route
2. Changed to extract `userId` from `req.user._id`
3. Removed `await` from `mongoConnections.get()`
4. Added detailed console logs at each step

**Resolution:** ✅ FIXED - Logs now visible in terminal

### Bug #3: Corrupted README.md
**Symptom:** Mixed-up documentation with incomplete sections  
**Location:** `README.md` (lines 180-280)  
**Root Cause:** Previous edits created malformed markdown with broken code blocks  
**Fix Applied:** Completely rewrote the affected sections with proper formatting
**Resolution:** ✅ FIXED - Clean, readable documentation

---

## 🎓 Key Implementation Details

### AI Query Execution Flow
```
User Question
    ↓
Extract Schema from Connected DB
    ↓
Send to Gemini with System Prompt
    ↓
Parse AI Response (clean JSON from markdown)
    ↓
Execute MongoDB Query
    ↓
Return Results (or continue to inference)
    ↓
[Optional] Send Results + Question for Analysis
    ↓
Return Analysis to User
```

### Security Measures
1. **Token-Based Auth**: JWT with short-lived access tokens
2. **Token Blacklisting**: Redis stores blacklisted tokens on logout
3. **Connection Encryption**: MongoDB URIs encrypted with AES-256-GCM before storage
4. **Password Hashing**: bcrypt with auto-hashing on save
5. **User Isolation**: Connections are per-user, can only connect to own saved connections

### Type Inference System
Detects: `string`, `number`, `boolean`, `object`, `array`, `date`, `objectId`, `null`

---

## 🔌 API Endpoints Summary

### Auth (`/api/auth/`)
- `POST /signup` - Register new user
- `POST /login` - Login, get tokens
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout, blacklist token

### Connections (`/api/connection/`)
- `POST /get-connection-string` - Save encrypted MongoDB URI
- `POST /connect-to-database` - Establish active connection
- `POST /disconnect-database` - Close active connection

### AI/Schema (`/api/ai/`)
- `POST /get-mongo-schema` - Extract database schema
- `POST /run-query` - Execute AI-generated MongoDB query (AI mode)

---

## 📝 Next Session Context

### What Should Be Continued
1. **Input Validation**: Implement Joi/Zod for all endpoints
   - Validate email format, password strength
   - Sanitize MongoDB connection URIs
   - Validate Gemini API key

2. **Testing Framework**:
   - Set up Jest for unit tests
   - Create E2E tests for full authentication flow
   - Mock Gemini API for testing

3. **Performance Optimization**:
   - Cache schema extraction results
   - Implement query result pagination
   - Add request rate limiting

4. **Additional Features**:
   - List saved connections endpoint
   - Delete connection endpoint
   - Schema comparison between databases
   - Query history tracking

### Important Reminders
- ⚠️ Always include `authenticate` middleware on protected routes
- ⚠️ All connection operations must verify user ownership
- ⚠️ Gemini API responses need JSON cleaning before parsing
- ⚠️ Keep encryption key secure, never commit to repo
- ⚠️ Test AI response parsing with various question types

### Open Questions
- Should we cache entire schemas or just the collection names?
- How to handle very large databases with thousands of collections?
- Should we implement query approvals before execution?
- Do we need query result limits for safety?
- How to handle concurrent connections from same user?

### Dependencies Installed
```json
{
  "bcrypt": "^6.0.0",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "express": "^5.2.1",
  "ioredis": "^5.8.2",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.0.2",
  "@google/generative-ai": "^latest"
}
```

---

## 📚 Documentation References
- Main README: `README.md` - Comprehensive API documentation
- Architecture: MVC pattern with middleware-based auth
- Code comments: Inline comments explain key logic in controller functions

---

**Last Updated:** 2026-05-19  
**Next Review Date:** After implementing input validation and tests  
**Session Status:** ✅ ACTIVE - Ready for continuation
