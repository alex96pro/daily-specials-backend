import express from 'express';
import { feed, menu, mealModifiers } from '../api/user.js';

const router = express.Router();

router.get('/feed', feed);
router.get('/menu/:id/:day/:time', menu);
router.get('/meal-modifiers/:id/:special', mealModifiers);

export default router;

