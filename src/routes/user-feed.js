import express from 'express';
import { specials, specialModifiers } from '../api/user-feed.js';

const router = express.Router();

router.get('/specials', specials);
router.get('/modifiers/:id', specialModifiers);

export default router;

