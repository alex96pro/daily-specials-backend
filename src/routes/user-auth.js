import express from 'express';
import { login } from '../api/user-auth.js';
import { signUp } from '../api/user-auth.js';
import { verifyAccount } from '../api/user-auth.js';
import { forgottenPassword } from '../api/user-auth.js';
import { changePassword } from '../api/user-auth.js';
import { newPassword } from '../api/user-auth.js';
import { removeAddress } from '../api/user-auth.js';
import { addNewAddress } from '../api/user-auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/sign-up', signUp);
router.post('/verify-account', verifyAccount);
router.post('/forgotten-password', forgottenPassword);
router.post('/change-password', changePassword);
router.post('/new-password', newPassword);
router.post('/add-new-address', addNewAddress);
router.delete('/remove-address/:id', removeAddress);

export default router;

