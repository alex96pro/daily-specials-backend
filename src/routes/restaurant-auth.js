import express from 'express';
import { login, newPassword, forgottenPassword, signUpFirstStep, signUpComplete, verifyAccount, updateProfile, changePassword, disableDelivery, changeWorkingHours } from '../api/restaurant-auth.js';
const router = express.Router();

router.post('/login', login);
router.post('/forgotten-password', forgottenPassword);
router.post('/new-password', newPassword);
router.post('/sign-up-first-step', signUpFirstStep);
router.post('/sign-up-complete', signUpComplete);
router.post('/verify-account',verifyAccount);
router.post('/update-profile', updateProfile);
router.post('/change-password',changePassword);
router.post('/disable-delivery',disableDelivery);
router.post('/change-working-hours/:id',changeWorkingHours);

export default router;

