import express from "express";
import { authenticate } from "../middlewares/auth.middlware.js";
import {getMongoSchema} from "../controllers/ai.controllor.js";

var router = express.Router();

router.post("/get-mongo-schema" , authenticate, getMongoSchema);

export default router;