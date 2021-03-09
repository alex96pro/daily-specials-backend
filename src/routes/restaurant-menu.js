import express from 'express';
import { menu, addNewMeal, editMenuMeal, deleteMenuMeal, addCategory, deleteCategory, convertMealToSpecial, mealModifiers } from '../api/restaurant-menu.js';

const router = express.Router();

// /restaurant/menu
router.get('/:id', menu);
router.post('/meal/add', addNewMeal);
router.post('/meal/edit', editMenuMeal);
router.delete('/meal/delete/:id', deleteMenuMeal);
router.get('/meal/modifiers/:id', mealModifiers);
router.post('/convert-meal-to-special', convertMealToSpecial);
router.post('/categories/add', addCategory);
router.delete('/categories/delete/:id', deleteCategory);

export default router;

