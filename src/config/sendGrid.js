import dotenv from 'dotenv';
import sendGridMail from '@sendgrid/mail';
import { FRONTEND_API } from '../common/consts.js';
dotenv.config();

export async function sendVerifyEmail(email, hashedUserId) {
    try{
        sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: 'directdailyspecials@gmail.com',
            from: process.env.SENDER_EMAIL,
            templateId: 'd-e458506a14c549b0a373e62d7e1f1063',
            dynamic_template_data: {
                userId: hashedUserId,
                FRONTEND_API: FRONTEND_API
            }
        }
        await sendGridMail.send(msg);
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
};

export async function sendForgottenPassword(email, hashedUserId) {
    try{
        sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: 'directdailyspecials@gmail.com',
            templateId: 'd-e5979cea9cb0401091f34b2d2c0cea1e',
            dynamic_template_data: {
                FRONTEND_API: FRONTEND_API,
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
                restaurantId: hashedRestaurantId,
                FRONTEND_API: FRONTEND_API
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
                FRONTEND_API: FRONTEND_API,
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