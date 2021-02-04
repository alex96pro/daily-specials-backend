import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import authRestaurantRouter from './routes/auth-restaurant.js';
import restaurantRouter from './routes/restaurant.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({origin: true, credentials: true}));
app.use(express.json( {limit:'5mb'} ));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

//ROUTES
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/auth-restaurant', authRestaurantRouter);
app.use('/restaurant', restaurantRouter);

app.get('/', (req,res) => {
    res.json("Daily specials server is up!");
});

app.listen(port, () => console.log("Server started on port "+port));
