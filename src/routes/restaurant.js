import express from 'express';
import { menu, editMenuMeal, deleteMenuMeal } from '../api/restaurant.js';

const router = express.Router();

router.get('/menu/:id', menu);
router.post('/edit-menu-meal', editMenuMeal);
router.delete('/delete-menu-meal/:id', deleteMenuMeal);

export default router;

