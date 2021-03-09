import express from 'express';
import { modifiers, addNewModifier, editModifier, deleteModifier } from '../api/restaurant-modifiers.js';

const router = express.Router();

// /restaurant/modifiers
router.get('/:id', modifiers);
router.post('/add', addNewModifier);
router.post('/edit', editModifier);
router.delete('/delete/:id', deleteModifier);

export default router;

