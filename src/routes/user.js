import express from 'express';
import { feed, menu } from '../api/user.js';

const router = express.Router();

router.get('/feed', feed);
router.get('/menu/:id/:day/:time', menu);

export default router;

