import express from 'express';
import { meals, mealModifiers } from '../api/user-menu.js';

const router = express.Router();

router.get('/meals/:id/:day/:time', meals);
router.get('/modifiers/:id', mealModifiers);

export default router;

