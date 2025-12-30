import express from 'express';
import { getMongoUri } from '../controllers/connection.controllor.js';
import { authenticate } from '../middlewares/auth.middlware.js';

var router = express.Router();

router.post('/get-connection-string', authenticate , getMongoUri);


export default router;