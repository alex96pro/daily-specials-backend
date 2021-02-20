import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import restaurantAuthRouter from './routes/restaurant-auth.js';
import restaurantMenuRouter from './routes/restaurant-menu.js';
import restaurantSpecialsRouter from './routes/restaurant-specials.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({origin: true, credentials: true}));
app.use(express.json( {limit:'5mb'} ));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

//ROUTES
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/restaurant-auth', restaurantAuthRouter);
app.use('/restaurant-menu', restaurantMenuRouter);
app.use('/restaurant-specials', restaurantSpecialsRouter);

app.get('/', (req,res) => {
    res.json('Direct server is online!');
});

app.listen(port, () => console.log("Server started on port "+port));
