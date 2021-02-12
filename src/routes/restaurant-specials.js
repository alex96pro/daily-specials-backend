import express from 'express';
import { specials, addNewSpecial, editSpecial, deleteSpecial } from '../api/restaurant-specials.js';

const router = express.Router();

router.get('/specials/:id', specials);
router.post('/add-new-special/:id', addNewSpecial);
router.post('/edit-special', editSpecial);
router.delete('/delete-special/:id', deleteSpecial);

export default router;

