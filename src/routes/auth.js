import express from 'express';
import { login } from '../api/auth.js';
import { signUp } from '../api/auth.js';
import { verifyAccount } from '../api/auth.js';
import { forgottenPassword } from '../api/auth.js';
import { changePassword } from '../api/auth.js';
import { newPassword } from '../api/auth.js';
import { removeAddress } from '../api/auth.js';
import { addNewAddress } from '../api/auth.js';

const router = express.Router();

router.get('/login', login);
router.post('/sign-up', signUp);
router.post('/verify-account', verifyAccount);
router.post('/forgotten-password', forgottenPassword);
router.post('/change-password', changePassword);
router.post('/new-password', newPassword);
router.post('/add-new-address', addNewAddress);
router.delete('/remove-address/:id', removeAddress);

export default router;

