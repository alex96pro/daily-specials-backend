import dotenv from 'dotenv';
import sendGridMail from '@sendgrid/mail';
import { FRONTEND_USERS, FRONTEND_RESTAURANTS } from '../common/consts.js';
dotenv.config();

export async function sendVerifyEmailUsers(email, hashedUserId) {
    try{
        sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: 'directdailyspecials@gmail.com',
            templateId: 'd-e458506a14c549b0a373e62d7e1f1063',
            dynamic_template_data: {
                FRONTEND_USERS: FRONTEND_USERS,
                userId: hashedUserId
            }
        }
        await sendGridMail.send(msg);
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
};

export async function sendForgottenPasswordUsers(email, hashedUserId) {
    try{
        sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: 'directdailyspecials@gmail.com',
            templateId: 'd-e5979cea9cb0401091f34b2d2c0cea1e',
            dynamic_template_data: {
                FRONTEND_USERS: FRONTEND_USERS,
                userId: hashedUserId
            }
        }
        await sendGridMail.send(msg);
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
};

export async function sendVerifyEmailRestaurant(email, hashedRestaurantId) {
    try{
        sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: 'directdailyspecials@gmail.com',
            templateId: 'd-a2248d3a20a142aa96d68d284a834b25',
            dynamic_template_data: {
                FRONTEND_RESTAURANTS: FRONTEND_RESTAURANTS,
                restaurantId: hashedRestaurantId
            }
        }
        await sendGridMail.send(msg);
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
};

export async function sendForgottenPasswordRestaurant(email, hashedRestaurantId) {
    try{
        sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: 'directdailyspecials@gmail.com',
            templateId: 'd-028dd4aecf6949218ac151fdf9d07372',
            dynamic_template_data: {
                FRONTEND_RESTAURANTS: FRONTEND_RESTAURANTS,
                restaurantId: hashedRestaurantId
            }
        }
        await sendGridMail.send(msg);
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
};