import express from "express";
import cors from "cors";
import ApiResponse from "./utils/ApiResponse.js";
import authRoutes from "./routes/auth.routes.js";

var app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth/" , authRoutes);

app.get("/" , (req , res) => {
    return ApiResponse.success(res , 200 , "server")
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