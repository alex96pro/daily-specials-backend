import express from 'express';
import { login } from '../api/auth.js';
import { signUp } from '../api/auth.js';
import { verifyAccount } from '../api/auth.js';
import { forgottenPassword } from '../api/auth.js';
import { profile } from '../api/auth.js';
import { changePassword } from '../api/auth.js';
import { newPassword } from '../api/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/sign-up', signUp);
router.post('/verify-account', verifyAccount);
router.post('/forgotten-password', forgottenPassword);
router.get('/profile', profile);
router.post('/change-password', changePassword);
router.post('/new-password', newPassword);

export default router;

