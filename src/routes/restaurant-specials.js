import express from 'express';
import { specials, addNewSpecial, editSpecial, deleteSpecial, deleteSpecialFromToday, specialModifiers } from '../api/restaurant-specials.js';

const router = express.Router();

// /restaurant/specials
router.get('/:id', specials);
router.post('/add', addNewSpecial);
router.post('/edit', editSpecial);
router.delete('/delete/:id', deleteSpecial);
router.delete('/delete-special-from-today/:id', deleteSpecialFromToday);
router.get('/modifiers/:id', specialModifiers);

export default router;

