import express from 'express';
import { login, newPassword, forgottenPassword, signUpFirstStep, signUpComplete, verifyAccount, updateProfile, changePassword, disableDelivery } from '../api/auth-restaurant.js';
const router = express.Router();

router.get('/login', login);
router.post('/forgotten-password', forgottenPassword);
router.post('/new-password', newPassword);
router.post('/sign-up-first-step', signUpFirstStep);
router.post('/sign-up-complete', signUpComplete);
router.post('/verify-account',verifyAccount);
router.post('/update-profile', updateProfile);
router.post('/change-password',changePassword);
router.post('/disable-delivery',disableDelivery);

export default router;

