import express from "express";
import { authenticate } from "../middlewares/auth.middlware.js";
import {getMongoSchema , runAiQuery} from "../controllers/ai.controllor.js";

var router = express.Router();

router.post("/get-mongo-schema" , authenticate, getMongoSchema);
router.post("/run-ai-query" , authenticate , runAiQuery);

export default router;