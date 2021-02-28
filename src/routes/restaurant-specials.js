import express from 'express';
import { specials, addNewSpecial, editSpecial, deleteSpecial, deleteSpecialFromToday } from '../api/restaurant-specials.js';

const router = express.Router();

router.get('/specials/:id', specials);
router.post('/add-new-special/:id', addNewSpecial);
router.post('/edit-special', editSpecial);
router.delete('/delete-special/:id', deleteSpecial);
router.delete('/delete-special-from-today/:id', deleteSpecialFromToday);

export default router;

