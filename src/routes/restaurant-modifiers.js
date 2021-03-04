import express from 'express';
import { modifiers, addNewModifier } from '../api/restaurant-modifiers.js';

const router = express.Router();

router.get('/modifiers/:id', modifiers);
router.post('/add-new-modifier', addNewModifier);

export default router;

