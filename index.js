import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ApiResponse from "./utils/ApiResponse.js";
import authRoutes from "./routes/auth.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import connectDB from "./configs/database.js";

dotenv.config();


var app = express();

app.use(cors());
app.use(express.json());
connectDB();
app.use("/api/auth/" , authRoutes);
app.use("/api/connection/" , connectionRoutes);

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