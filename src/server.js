import express from "express";
import * as io from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import userAuthRouter from './routes/user-auth.js';
import userFeedRouter from './routes/user-feed.js';
import userMenuRouter from './routes/user-menu.js';
import restaurantAuthRouter from './routes/restaurant-auth.js';
import restaurantMenuRouter from './routes/restaurant-menu.js';
import restaurantSpecialsRouter from './routes/restaurant-specials.js';
import restaurantModifiersRouter from './routes/restaurant-modifiers.js';
import initSockets from './sockets/sockets.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const socketIO = new io.Server(server, {
    cors:{
        origin: true
    }
});

initSockets(socketIO);

const port = process.env.PORT || 3001;

app.use(cors({origin: true, credentials: true}));
app.use(express.json( {limit:'5mb'} ));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

//ROUTES
app.use('/user/auth', userAuthRouter);
app.use('/user/feed', userFeedRouter);
app.use('/user/menu', userMenuRouter);
app.use('/restaurant/auth', restaurantAuthRouter);
app.use('/restaurant/menu', restaurantMenuRouter);
app.use('/restaurant/specials', restaurantSpecialsRouter);
app.use('/restaurant/modifiers', restaurantModifiersRouter);

app.get('/', (req,res) => {
    res.json('Direct server is online!');
});

server.listen(port, () => console.log("Server started on port " + port));
