import dotenv from 'dotenv';
import sendGridMail from '@sendgrid/mail';
import { FRONTEND_API } from '../common/consts.js';
dotenv.config();

export async function sendVerifyEmail(email, hashedUserId) {
    try{
        sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: process.env.SENDER_EMAIL,
            templateId: process.env.VERIFY_EMAIL_TEMPLATE,
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
            from: process.env.SENDER_EMAIL,
            templateId: process.env.FORGOTTEN_PASSWORD_TEMPLATE,
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
            from: process.env.SENDER_EMAIL,
            templateId: process.env.VERIFY_EMAIL_RESTAURANT_TEMPLATE,
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
            from: process.env.SENDER_EMAIL,
            templateId: process.env.FORGOTTEN_PASSWORD_RESTAURANT_TEMPLATE,
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