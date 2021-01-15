import bcrypt from 'bcrypt';
import pool from '../config/dbConfig.js';
import jwt, { decode } from 'jsonwebtoken';
import decodeToken from '../config/authorization.js';
import { sendVerifyEmail, sendForgottenPassword } from '../config/sendGrid.js';

export async function login(req,res) {
    try{
        let result = await pool.query('SELECT "userId", "verified", "password" FROM users WHERE "email" = $1', [req.body.email]);
        if(result.rows && result.rows.length > 0){
            if(!(await bcrypt.compare(req.body.password, result.rows[0].password))){
                return res.status(401).json("WRONG PASSWORD");
            }
            else if(result.rows[0].verified === false){
                return res.status(403).json("NOT VERIFIED");
            }
            else{
                //SUCCESSFUL LOGIN , CREATING ACCESS TOKEN 
                const accessToken = jwt.sign({email:req.body.email, password:req.body.password}, process.env.ACCESS_TOKEN_SECRET);
                return res.json({accessToken: accessToken, userId: result.rows[0].userId});
            }
        }else{
            return res.status(401).json("WRONG EMAIL");
        }
    }catch(err){
        res.status(500).json(err);
    }
}

export async function signUp(req,res) {
    try{
        let result = await pool.query('SELECT "userId" from users WHERE "email"=$1',[req.body.email]);
        if(result.rows && result.rows.length > 0){
            return res.json([]);
        }else{
            //const salt = await bcrypt.genSalt(); // default = 10, salt is used for different hashes for same passwords
            const hashedPassword = await bcrypt.hash(req.body.password, 10); // , salt
            let result2 = await pool.query('INSERT INTO users VALUES (default,$1,$2,$3)',[req.body.email, hashedPassword, false]);
            let result3 = await pool.query('SELECT MAX("userId") AS max FROM users');
            let userIdString = result3.rows[0].max.toString();
            let hashedUserId = await bcrypt.hash(userIdString,10);
            hashedUserId = hashedUserId.replace(/\//g,Math.round(Math.random()*10).toString()); //remove / from hashed value so frontend can get id from url (/ makes problems)
            await pool.query("INSERT INTO verification VALUES ($1,$2,$3)",[result3.rows[0].max, hashedUserId, 'account-verification']);
            if(sendVerifyEmail(req.body.email, hashedUserId)){
                res.status(201).json([result2]);
            }else{
                res.status(500).json("SENDGRID ERROR");
            }
        }
    }catch(err){
        res.status(500).json(err);
    }
}

export async function verifyAccount(req,res) {
    try{
        let result = await pool.query('UPDATE users SET "verified" = true WHERE "userId" = (SELECT "userId" FROM verification WHERE "hashedId" = $1 AND "type" = $2)',
        [req.body.hashedUserId, 'account-verification']);
        if(result.rowCount === 1){
            res.status(200).json("VERIFIED");
        }
        await pool.query('DELETE FROM verification WHERE "hashedId" = $1 AND "type" = $2', [req.body.hashedUserId, 'account-verification']);
    }catch(err){
        res.status(500).json(err);
    }
}

export async function forgottenPassword(req,res) {
    try{
        let result = await pool.query('SELECT "email", "userId" from users WHERE "email" = $1',[req.body.email]);
        if(result.rows && result.rows.length > 0){
            let userIdString = result.rows[0].userId.toString();
            let hashedUserId = await bcrypt.hash(userIdString,10);
            hashedUserId = hashedUserId.replace(/\//g,Math.round(Math.random()*10).toString()); //remove / from hashed value so frontend can get id from url (/ makes problems)
            if(sendForgottenPassword(result.rows[0].email, hashedUserId)){
                let result2 = await pool.query("INSERT INTO verification VALUES ($1,$2,$3)",[result.rows[0].userId, hashedUserId, 'forgotten-password']);
                if(result2.rowCount === 1){
                    res.status(200).json("SUCCESSFULY SENT PASSWORD");
                }
            }else{
                res.status(500).json("SENDGRID ERROR");
            }
            
        }else{
            res.status(401).json("EMAIL DOESNT EXIST");
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
}

export async function newPassword(req,res) {
    try{
        let hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        let result = await pool.query('UPDATE users SET "password" = $1 WHERE "userId" = (SELECT "userId" FROM verification WHERE "hashedId" = $2 AND "type" = $3)',
        [hashedPassword, req.body.userId, 'forgotten-password']);
        if(result.rowCount === 1){
            await pool.query('DELETE FROM verification WHERE "hashedId" = $1 AND "type" = $2', [req.body.userId, 'forgotten-password']);
        }else{
            return res.status(401).json("UNAUTHORIZED");
        }
        res.status(200).json("SUCCESSFULY CREATED NEW PASSWORD");
    }catch(err){
        console.log(err);
        res.status(500).json("SERVER ERROR");
    }
}

export async function profile(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }else{
            let result = await pool.query('SELECT "email" from users WHERE "email" = $1',[decodedEmail]);
            if(result.rows && result.rows.length > 0){
                return res.json({email: result.rows[0].email});
            }
        }
    }catch(err){
        console.log(err);
        res.status(500);
    }
}

export async function changePassword(req,res) {
    try{
        if(!req.headers.authorization){
            return res.status(401).json("UNAUTHORIZED");
        }
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }
        let result = await pool.query('SELECT "password" from users WHERE "email" = $1',[decodedEmail]);
        if(!(await bcrypt.compare(req.body.oldPassword, result.rows[0].password))){
            return res.status(400).json("WRONG OLD PASSWORD");
        }else{
            const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
            pool.query('UPDATE users SET "password" = $1 WHERE "email" = $2',[hashedPassword, decodedEmail]);
            res.json("CHANGED PASSWORD SUCCESSFULLY");
        }
    }catch(err){
        console.log(err);
        res.status(500);
    }
}