import express from 'express';
import { getLoginHistory } from '../controller/loginHistory.js';
import auth from '../middleware/auth.js';

const router = express.Router();
 
router.get('/', auth, getLoginHistory);

export default router;