import express from 'express';
import { getMongoUri , connectToDatabase , disconnectDatabase, getConnectionByUser} from '../controllers/connection.controllor.js';
import { authenticate } from '../middlewares/auth.middlware.js';

var router = express.Router();

router.post('/get-connection-string', authenticate , getMongoUri);
router.post("/connect-to-database" , authenticate , connectToDatabase)
router.post("/disconnect-database" , authenticate , disconnectDatabase)
router.get("/get-connections" , authenticate , getConnectionByUser)


export default router;