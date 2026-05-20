import 'dotenv/config';
import express from "express";
import cors from "cors";
import ApiResponse from "./utils/ApiResponse.js";
import authRoutes from "./routes/auth.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import connectDB from "./configs/database.js";


var app = express();

app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            "http://localhost:8080",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:4200",
            "https://insightai-frontend-lilac.vercel.app",
            "https://insight-ai-zeta.vercel.app"
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list or matches patterns
        if (allowedOrigins.includes(origin) || 
            /.*\.ngrok-free\.app$/.test(origin) ||
            /.*\.vercel\.app$/.test(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    preflightContinue: false
}));
}));
app.use(express.json());
connectDB();
app.use("/api/auth/" , authRoutes);
app.use("/api/connection/" , connectionRoutes);
app.use("/api/ai/" , aiRoutes);

app.get("/" , (req , res) => {
    return ApiResponse.success(res , "server")
})

app.get("/health" , (req , res) => {
    return ApiResponse.success(res , "API is working" , {
        status : "UP",
        timestamp : new Date().toISOString(),
        uptime : process.uptime()
    })
})

app.listen(3000 , () => {
    console.log("server");
})