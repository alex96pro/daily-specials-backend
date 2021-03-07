import express from 'express';
import { modifiers, addNewModifier, editModifier, deleteModifier } from '../api/restaurant-modifiers.js';

const router = express.Router();

router.get('/modifiers/:id', modifiers);
router.post('/add-new-modifier', addNewModifier);
router.post('/edit-modifier', editModifier);
router.delete('/delete-modifier/:id', deleteModifier);

export default router;

