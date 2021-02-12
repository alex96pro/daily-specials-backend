import express from 'express';
import { menu, addNewMeal, editMenuMeal, deleteMenuMeal, addCategory, deleteCategory } from '../api/restaurant-menu.js';

const router = express.Router();

router.get('/menu/:id', menu);
router.post('/add-new-meal', addNewMeal);
router.post('/edit-menu-meal', editMenuMeal);
router.delete('/delete-menu-meal/:id', deleteMenuMeal);
router.post('/add-category', addCategory);
router.delete('/delete-category/:category', deleteCategory);

export default router;

