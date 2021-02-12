import pool from '../config/dbConfig.js';
import cloudinary from '../config/cloudinary.js';
import decodeToken from '../config/authorization.js';
import { DAILY_SPECIALS_LIMIT } from '../common/consts.js';
import { convertArrayToString, convertStringToArray, convertTagsToArray } from '../common/functions.js';

export async function specials(req,res) {
    try{
        let resultSpecials = await pool.query('SELECT "specialId","name","photo","price","tags","description","deleted" FROM specials WHERE "restaurantId" = $1 AND "date" = $2',
        [req.params.id, req.query.date]);
        //specials have field deleted, so real number of "used" specials for some day is all specials including those with value deleted = true
        //restaurant gets only those specials for specific day that are not deleted
        let usedSpecials = resultSpecials.rows.length;
        let activeSpecials = [];
        for(let i = 0; i < resultSpecials.rows.length; i++) {
            if(!resultSpecials.rows[i].deleted){
                activeSpecials.push(resultSpecials.rows[i]);
            }
        }
        convertTagsToArray(resultSpecials.rows);
        return res.json({specials: activeSpecials, usedSpecials: usedSpecials});
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function addNewSpecial(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }
        let specialsCheckResult = await pool.query('SELECT COUNT(*) as "dailySpecialsSUM" FROM specials WHERE "restaurantId" = $1',[req.params.id]);
        if(specialsCheckResult.dailySpecialsSUM === DAILY_SPECIALS_LIMIT){
            return res.status(401).json("UNAUTHORIZED"); //api request like this can not be sent from client app (postman can send request like this)
        }
        req.body.tags = convertArrayToString(req.body.tags);

        const file = req.body.photo;
        const uploadResponse = await cloudinary.v2.uploader.upload(file, {
            folder:'specials'
        });
        let photoURL = uploadResponse.url;

        let specialsInsertResult = await pool.query('INSERT INTO "specials" VALUES (default, $1, $2, $3, $4, $5, $6, $7, $8) '+
        'RETURNING "specialId", "name", "photo", "price", "tags", "description"',
        [req.params.id, req.body.name, photoURL, req.body.date, req.body.price, req.body.tags, req.body.description, false]);
        specialsInsertResult.rows[0].tags = convertStringToArray(specialsInsertResult.rows[0].tags);

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
            return res.status(401).json("UNAUTHORIZED");
        }
        req.body.tags = convertArrayToString(req.body.tags);
        let editSpecialResult = await pool.query('UPDATE specials SET "name" = $1, "price" = $2, "tags" = $3, "description" = $4 '+
        'WHERE "specialId" = $5 RETURNING "specialId","name","photo","price","tags","description","deleted"',
        [req.body.name, req.body.price, req.body.tags, req.body.description, req.body.specialId]);
        
        editSpecialResult.rows[0].tags = convertStringToArray(editSpecialResult.rows[0].tags);
        return res.json(editSpecialResult.rows[0]);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
}
export async function deleteSpecial(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }
        let deletedSpecialResponse = await pool.query('UPDATE specials SET "deleted" = $1 WHERE "specialId" = $2 RETURNING "specialId", "photo"',
        [true, req.params.id]);

        res.json(deletedSpecialResponse.rows[0].specialId);
        //delete photo from cloudinary
        let url = deletedSpecialResponse.rows[0].photo;
        let publicId = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
        publicId = 'specials/'+publicId;
        await cloudinary.uploader.destroy(publicId);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
