import express from 'express';
import { login } from '../api/auth.js';
import { signUp } from '../api/auth.js';
const router = express.Router();

router.get('/login', login);
router.post('/sign-up', signUp);

export default router;

