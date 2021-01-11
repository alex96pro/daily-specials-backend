import dotenv from 'dotenv';
dotenv.config();
import sendGridMail from '@sendgrid/mail';
import { FRONTEND_API } from '../consts.js';

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
}

export async function sendPassword(email, randomPassword) {
    try{
        sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: email,
            from: process.env.SENDER_EMAIL,
            templateId: process.env.FORGOTTEN_PASSWORD_TEMPLATE,
            dynamic_template_data: {
                randomPassword: randomPassword,
            }
        }
        await sendGridMail.send(msg);
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}