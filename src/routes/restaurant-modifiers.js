import express from 'express';
import { modifiers, addNewModifier, deleteModifier } from '../api/restaurant-modifiers.js';

const router = express.Router();

router.get('/modifiers/:id', modifiers);
router.post('/add-new-modifier', addNewModifier);
router.delete('/delete-modifier/:id', deleteModifier);

export default router;

