import express from 'express';
import { feed } from '../api/user.js';

const router = express.Router();

router.get('/feed', feed);

export default router;

