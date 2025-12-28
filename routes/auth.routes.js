import express from "express";
import { authenticate } from "../middlewares/auth.middlware.js";
import {login , signup} from "../controllers/auth.controller.js";

var router = express.Router();

router.post("/login" , authenticate , login);
router.post("/signup" , signup);

export default router;