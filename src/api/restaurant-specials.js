import pool from '../config/dbConfig.js';
import cloudinary from '../config/cloudinary.js';
import decodeToken from '../config/authorization.js';
import { DAILY_SPECIALS_LIMIT } from '../common/consts.js';
import { convertArrayToString, convertStringToArray, convertTagsToArray, getDateFromTimestamp, getTimeFromTimestamp } from '../common/functions.js';

export async function specials(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let resultSpecials = await pool.query('SELECT "specialId","name","photo","price","tags","description","timestamp","deleted" FROM specials WHERE "restaurantId" = $1 AND "timestamp" >= $2 ORDER BY "timestamp"',
        [req.params.id, req.query.dateAndTime]);
        for(let i = 0; i < resultSpecials.rows.length; i++) {
            resultSpecials.rows[i].date = getDateFromTimestamp(resultSpecials.rows[i].timestamp);
            resultSpecials.rows[i].time = getTimeFromTimestamp(resultSpecials.rows[i].timestamp);
            delete resultSpecials.rows[i].timestamp;
        }
        convertTagsToArray(resultSpecials.rows);
        return res.json(resultSpecials.rows);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function addNewSpecial(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        // let specialsCheckResult = await pool.query('SELECT COUNT(*) as "dailySpecialsSUM" FROM specials WHERE "restaurantId" = $1',[req.params.id]);
        // if(specialsCheckResult.dailySpecialsSUM === DAILY_SPECIALS_LIMIT){
        //     return res.status(401).json("Unauthorized"); //api request like this can not be sent from client app (postman can send request like this)
        // }
        req.body.tags = convertArrayToString(req.body.tags);

        const file = req.body.photo;
        const uploadResponse = await cloudinary.v2.uploader.upload(file, {
            folder:'specials'
        });
        let photoURL = uploadResponse.url;

        let specialsInsertResult = await pool.query('INSERT INTO "specials" VALUES (default, $1, $2, $3, $4, $5, $6, $7, $8, $9) '+
        'RETURNING "specialId", "name", "photo", "price", "tags", "description", "timestamp"',
        [req.body.restaurantId, req.body.name, photoURL, req.body.dateAndTime, req.body.price, req.body.tags, req.body.description, false, false]);
        specialsInsertResult.rows[0].tags = convertStringToArray(specialsInsertResult.rows[0].tags);
        specialsInsertResult.rows[0].date = getDateFromTimestamp(specialsInsertResult.rows[0].timestamp);
        specialsInsertResult.rows[0].time = getTimeFromTimestamp(specialsInsertResult.rows[0].timestamp);
        // insert modifiers
        if(req.body.modifiers.length > 0){
            let meal_modifier_values = "";
            for(let i = 0; i < req.body.modifiers.length; i++){
                meal_modifier_values += "(default," + specialsInsertResult.rows[0].specialId + "," + req.body.modifiers[i] + ",true),";
            }
            meal_modifier_values = meal_modifier_values.substring(0, meal_modifier_values.length - 1);
            await pool.query(`INSERT INTO meal_modifier VALUES ${meal_modifier_values}`);
        }
        return res.json(specialsInsertResult.rows[0]);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function editSpecial(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let photo = req.body.photo;
        if(req.body.newPhoto){
            const file = req.body.newPhoto;
            const uploadResponse = await cloudinary.v2.uploader.upload(file, {
                folder:'specials'
            });
            photo = uploadResponse.url;
        }
        req.body.tags = convertArrayToString(req.body.tags);
        let editSpecialResult = await pool.query('UPDATE specials SET "name" = $1, "price" = $2, "tags" = $3, "description" = $4, "timestamp" = $5, "photo" = $6 '+
        'WHERE "specialId" = $7 RETURNING "specialId","name","photo","price","tags","description","timestamp","deleted"',
        [req.body.name, req.body.price, req.body.tags, req.body.description, req.body.timestamp, photo, req.body.specialId]);
        
        editSpecialResult.rows[0].tags = convertStringToArray(editSpecialResult.rows[0].tags);
        editSpecialResult.rows[0].date = getDateFromTimestamp(editSpecialResult.rows[0].timestamp);
        editSpecialResult.rows[0].time = getTimeFromTimestamp(editSpecialResult.rows[0].timestamp);
        delete editSpecialResult.rows[0].timestamp;
        //update modifiers
        if(req.body.modifiersChanged){
            await pool.query('DELETE FROM meal_modifier WHERE "mealId" = $1 AND "special" = true',[req.body.specialId]);
            if(req.body.modifiers.length > 0){
                let meal_modifier_values = "";
                for(let i = 0; i < req.body.modifiers.length; i++){
                    meal_modifier_values += "(default," + req.body.specialId + "," + req.body.modifiers[i] + ",true),";
                }
                meal_modifier_values = meal_modifier_values.substring(0, meal_modifier_values.length - 1);
                await pool.query(`INSERT INTO meal_modifier VALUES ${meal_modifier_values}`);
            }
        }
        res.json(editSpecialResult.rows[0]);
        if(req.body.newPhoto){ // delete old photo from cloudinary
            let url = req.body.photo;
            let publicId = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
            publicId = 'specials/'+publicId; // to delete photo from cloudinary, public id is needed = name before file extension + folders before that
            await cloudinary.uploader.destroy(publicId);
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
export async function deleteSpecial(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let deleteSpecialResult = await pool.query('DELETE FROM specials WHERE "specialId" = $1 RETURNING "specialId","photo","converted_from_meal"',[req.params.id]);
        res.json(deleteSpecialResult.rows[0].specialId); //return deleted specialId
        await pool.query('DELETE FROM meal_modifier WHERE "mealId" = $1 AND "special" = true',[req.params.id]);
        if(!deleteSpecialResult.rows[0].converted_from_meal){
            let url = deleteSpecialResult.rows[0].photo;
            let publicId = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
            publicId = 'specials/'+publicId; // to delete photo from cloudinary, public id is needed = name before file extension + folders before that
            await cloudinary.uploader.destroy(publicId);
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
export async function deleteSpecialFromToday(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let deletedSpecialResponse = await pool.query('UPDATE specials SET "deleted" = $1 WHERE "specialId" = $2 RETURNING "specialId", "photo", "name","converted_from_meal"',
        [true, req.params.id]);
        res.json(deletedSpecialResponse.rows[0].specialId);
        await pool.query('DELETE FROM meal_modifier WHERE "mealId" = $1 AND "special" = true',[req.params.id]);
        if(!deletedSpecialResponse.rows[0].converted_from_meal){
            //delete photo from cloudinary only if special is not made from meal
            let url = deletedSpecialResponse.rows[0].photo;
            let publicId = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
            publicId = 'specials/'+publicId;
            await cloudinary.uploader.destroy(publicId);
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function specialModifiers(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let modifiersResult = await pool.query(`SELECT "modifierId", "modifier" FROM modifiers JOIN meal_modifier USING("modifierId") WHERE "mealId" = $1 AND "special" = true`,[req.params.id]);
        return res.json(modifiersResult.rows);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

