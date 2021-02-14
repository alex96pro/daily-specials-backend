import bcrypt from 'bcrypt';
import pool from '../config/dbConfig.js';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';
import decodeToken from '../config/authorization.js';
import { removeSecondsFromTime, mergeWorkingHoursArrays, checkWorkingHours } from '../common/functions.js';
import { sendVerifyEmailRestaurant, sendForgottenPasswordRestaurant } from '../config/sendGrid.js';

export async function login(req,res) {
    try{
        let result = await pool.query('SELECT * FROM restaurants WHERE "email" = $1',[req.query.email]);
        if(result && result.rows.length > 0){
            if(!(await bcrypt.compare(req.query.password, result.rows[0].password))){
                return res.status(401).json("WRONG PASSWORD");
            }
            else if(result.rows[0].verified === false){
                return res.status(403).json("NOT VERIFIED");
            }else{
                //SUCCESSFUL LOGIN , CREATING ACCESS TOKEN, returning restaurantId and restaurant info for profile
                const accessToken = jwt.sign({email:req.query.email, password:req.query.password}, process.env.ACCESS_TOKEN_SECRET);
                removeSecondsFromTime(result.rows[0]);
                let workingHours = mergeWorkingHoursArrays(result.rows[0]);
                let restaurant = {name: result.rows[0].name, location: result.rows[0].location, lat: result.rows[0].lat, lon: result.rows[0].lon,
                    delivery: result.rows[0].delivery, deliveryRange: result.rows[0]["delivery-range"], deliveryMinimum: result.rows[0]["delivery-minimum"],
                    phone: result.rows[0].phone, workingHours: workingHours,logo: result.rows[0].logo
                }; 
                return res.json({accessToken: accessToken, restaurantId: result.rows[0].restaurantId, restaurant:restaurant});
            }
        }else{
            return res.status(401).json("WRONG EMAIL OR PASSWORD");
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
export async function signUpFirstStep(req,res) {
    try{
        let deliveryMinimum = req.body.deliveryMinimum ? req.body.deliveryMinimum : 0;
        let deliveryRange = req.body.deliveryRange ? req.body.deliveryRange : 0;
        let result = await pool.query('SELECT "email", "name", "location" FROM restaurants WHERE "email" = $1 OR "name" = $2', [req.body.email, req.body.restaurantName]);
        if(result && result.rows.length > 0){
            if(result.rows[0].email === req.body.email && result.rows[0].location === null){
                // RESTAURANT ALREADY DID FIRST STEP OF SIGN UP
                if(result.rows.length > 1){
                    //RESTAURANT NAME EXISTS (USER RETURNED TO FIRST STEP AND CHANGED RESTAURANT NAME) (TOP QUERY RETURNED 2 VALUES)
                     return res.status(401).json("Restaurant with that name already exists");
                }
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                await pool.query('UPDATE restaurants SET "name"=$1, "delivery"=$2, "delivery-range"=$3, "delivery-minimum"=$4, "phone"=$5, "password"=$6 '+
                'WHERE "email"=$7',[req.body.restaurantName, req.body.delivery, deliveryRange, deliveryMinimum, req.body.phone, hashedPassword, req.body.email]);
                return res.status(200).json("Updated first step of sign up");
            }
            if(result.rows[0].email === req.body.email){
                //EMAIL EXISTS
                return res.status(400).json("Email already exists");
            }else{
                //RESTAURANT NAME EXISTS
                return res.status(401).json("Restaurant with that name already exists");
            }
        }else{
            //RESTAURANT FIRST TIME DOING FIRST STEP OF SIGN UP
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            await pool.query(`INSERT INTO restaurants VALUES `+
            `(default,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [req.body.restaurantName, null, null, null, req.body.delivery, deliveryRange, deliveryMinimum,
            req.body.phone, null, null, null, req.body.email, hashedPassword, false]);
            res.status(200).json("First step of sign up completed");
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
export async function signUpComplete(req,res) {
    try{
        if(!req.body.workingHours){
            return res.status(400).json("THIRD STEP NOT COMPLETED");
        }
        if(!req.body.location || !req.body.lat || !req.body.lon){
            return res.status(400).json("SECOND STEP NOT COMPLETED");
        }
        let workingHoursChecked = checkWorkingHours(req.body.workingHours.workingHoursFrom, req.body.workingHours.workingHoursTo);
        
        let result = await pool.query(`UPDATE restaurants SET "location" = $1, "lat" = $2, "lon" = $3, "working-hours-from" = '{${workingHoursChecked.workingHoursFrom}}', "working-hours-to" = '{${workingHoursChecked.workingHoursTo}}' `+ 
        `WHERE "email" = $4 RETURNING "restaurantId"`,[req.body.location, req.body.lat, req.body.lon, req.body.email]);
        
        let restaurantIdString = result.rows[0].restaurantId.toString();
        let hashedRestaurantId = await bcrypt.hash(restaurantIdString,10);
        hashedRestaurantId = hashedRestaurantId.replace(/\//g,Math.round(Math.random()*10).toString()); //remove / from hashed value so frontend can get id from url (/ makes problems)
        
        await pool.query("INSERT INTO verification VALUES (default,$1,$2,$3,$4)",
        [result.rows[0].restaurantId, hashedRestaurantId, 'account-verification', 'restaurant']);
        if(sendVerifyEmailRestaurant(req.body.email, hashedRestaurantId)){
            res.status(200).json('SUCCESSFULY SIGNED UP FOR RESTAURANT');
        }else{
            res.status(500).json("SENDGRID ERROR");
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
export async function verifyAccount(req,res) {
    try{
        let result = await pool.query('UPDATE restaurants SET "verified" = true WHERE "restaurantId" = (SELECT "userId" FROM verification WHERE "hashedId" = $1 AND "type" = $2 AND "role" = $3)',
        [req.body.hashedRestaurantId, 'account-verification', 'restaurant']);
        if(result.rowCount === 1){
            res.status(200).json("VERIFIED");
        }
        await pool.query('DELETE FROM verification WHERE "hashedId" = $1 AND "type" = $2 AND "role" = $3', [req.body.hashedRestaurantId, 'account-verification', 'restaurant']);
    }catch(err){
        console.log(err);
        res.status(500).json("SERVER ERROR");
    }
};
export async function forgottenPassword(req,res) {
    try{
        let result = await pool.query('SELECT "email", "restaurantId", "type" from restaurants LEFT OUTER JOIN verification ON("restaurantId" = "userId") '+
        'WHERE "email" = $1',[req.body.email]);
        if(result.rows && result.rows.length > 0){
            if(result.rows[0].type !== null && result.rows[0].type === 'forgotten-password'){
                return res.status(400).json('ALREADY SENT PASSWORD ON EMAIL');
            }
            let restaurantIdString = result.rows[0].restaurantId.toString();
            let hashedRestaurantId = await bcrypt.hash(restaurantIdString, 10);
            hashedRestaurantId = hashedRestaurantId.replace(/\//g,Math.round(Math.random()*10).toString()); //remove / from hashed value so frontend can get id from url (/ makes problems)
            if(sendForgottenPasswordRestaurant(result.rows[0].email, hashedRestaurantId)){
                let result2 = await pool.query("INSERT INTO verification VALUES ($1,$2,$3,$4)",[result.rows[0].restaurantId, hashedRestaurantId, 'forgotten-password', 'restaurant']);
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
};
export async function newPassword(req,res) {
    try{
        let hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        let result = await pool.query('UPDATE restaurants SET "password" = $1 WHERE "restaurantId" = (SELECT "userId" FROM verification WHERE "hashedId" = $2 AND "type" = $3 AND "role" = $4)',
        [hashedPassword, req.body.hashedId, 'forgotten-password', 'restaurant']);
        if(result.rowCount === 1){
            await pool.query('DELETE FROM verification WHERE "hashedId" = $1 AND "type" = $2 AND "role" = $3', [req.body.hashedId, 'forgotten-password', 'restaurant']);
        }else{
            return res.status(401).json("UNAUTHORIZED");
        }
        res.status(200).json("SUCCESSFULY CREATED NEW PASSWORD");
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
export async function updateProfile(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }
        let checkNameResult = await pool.query('SELECT "restaurantId" FROM restaurants WHERE "name" = $1 AND "email" != $2',
        [req.body.name, decodedEmail]);
        if(checkNameResult.rows && checkNameResult.rows.length > 0){
            return res.status(400).json("NAME OF RESTAURANT EXISTS");
        }
        let queryForLocation = '';
        if(req.body.location && req.body.lat && req.body.lon){
            queryForLocation += `,"location" = '${req.body.location}',"lat" = ${req.body.lat},"lon" = ${req.body.lon}`; 
        }
        req.body.deliveryMinimum = req.body.deliveryMinimum ? req.body.deliveryMinimum : 0;
        req.body.deliveryRange = req.body.deliveryRange ? req.body.deliveryRange : 0;
        req.body.delivery = (req.body.delivery || req.body.deliveryMinimum) ? true : false; //restaurant switched to delivery || has delivery
        
        let logo = req.body.logo; //old logo

        if(req.body.newLogo){
            const file = req.body.newLogo;
            const uploadResponse = await cloudinary.v2.uploader.upload(file, {
                folder:'restaurant-logos'
            });
            logo = uploadResponse.url; //override old logo
        }

        let result = await pool.query(`UPDATE restaurants SET "name" = $1, "delivery" = $2, "delivery-range" = $3, "delivery-minimum" = $4, "phone" = $5, "logo" = $6 ${queryForLocation} `+
        `WHERE "email" = $7 RETURNING "name", "location", "lat", "lon", "delivery", "delivery-range" as "deliveryRange", "delivery-minimum" as "deliveryMinimum", "phone", "logo"`,
        [req.body.name, req.body.delivery, req.body.deliveryRange, req.body.deliveryMinimum, req.body.phone, logo, decodedEmail]);

        res.json({...result.rows[0]});

        // if user changed logo (not his first logo) we need to delete photo from cloudinary
        if(req.body.logo && logo !== req.body.logo){ //user had logo before && sent new logo
            let url = req.body.logo; //old logo
            let publicId = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
            publicId = 'restaurant-logos/'+publicId; // to delete photo from cloudinary, public id is needed = name before file extension + folders before that
            await cloudinary.uploader.destroy(publicId);
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
export async function changePassword(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }
        let result = await pool.query('SELECT "password" from restaurants WHERE "email" = $1',[decodedEmail]);
        if(!(await bcrypt.compare(req.body.oldPassword, result.rows[0].password))){
            return res.status(400).json("WRONG OLD PASSWORD");
        }else{
            const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
            pool.query('UPDATE restaurants SET "password" = $1 WHERE "email" = $2',[hashedPassword, decodedEmail]);
            res.json("CHANGED PASSWORD SUCCESSFULLY");
        }
    }catch(err){
        console.log(err);
        res.status(500);
    }
};
export async function disableDelivery(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }
        let result = await pool.query('SELECT "password" FROM restaurants WHERE "email" = $1',[decodedEmail]);
        if(result && result.rows.length > 0){
            if(!(await bcrypt.compare(req.body.password, result.rows[0].password))){
                return res.status(400).json("WRONG PASSWORD");
            }else{
                let result = await pool.query('UPDATE restaurants SET "delivery" = false, "delivery-range" = 0, "delivery-minimum" = 0 WHERE "email" = $1 '+
                'RETURNING "delivery", "delivery-range" as "deliveryRange", "delivery-minimum" as "deliveryMinimum"',[decodedEmail]);
                res.json({...result.rows[0]});
            }
        }else{
            res.status(401).json("UNAUTHORIZED");
        }
    }catch(err){
        console.log(err);
        res.status(500);
    }
};
export async function changeWorkingHours(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }
        let workingHoursChecked = checkWorkingHours(req.body.workingHoursFrom, req.body.workingHoursTo);
        let result = await pool.query(`UPDATE restaurants SET "working-hours-from" = '{${workingHoursChecked.workingHoursFrom}}', "working-hours-to" = '{${workingHoursChecked.workingHoursTo}}' WHERE `+
        `"restaurantId" = $1 RETURNING "working-hours-from", "working-hours-to"`,[req.params.id]);
        removeSecondsFromTime(result.rows[0]);
        let workingHours = mergeWorkingHoursArrays(result.rows[0]);
        res.json(workingHours);
    }catch(err){
        console.log(err);
        res.status(500);
    }
};