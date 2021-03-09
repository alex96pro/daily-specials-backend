import pool from '../config/dbConfig.js';
import cloudinary from '../config/cloudinary.js';
import decodeToken from '../config/authorization.js';
import { convertArrayToString, convertStringToArray, convertTagsToArray, getDateFromTimestamp, getTimeFromTimestamp } from '../common/functions.js';

export async function menu(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let mealsResult = await pool.query('SELECT "mealId", "name", "photo", "price", "tags", "description", "category" FROM meals WHERE "restaurantId" = $1 ORDER BY "mealId"',[req.params.id]);
        let categoriesResult = await pool.query('SELECT "categories" FROM restaurants WHERE "restaurantId" = $1', [req.params.id]);
        if(mealsResult.rows && mealsResult.rows.length > 0){
            convertTagsToArray(mealsResult.rows);
        }else{
            mealsResult.rows = [];
        }
        categoriesResult.rows[0].categories = convertStringToArray(categoriesResult.rows[0].categories);
        res.json({meals: mealsResult.rows, categories: categoriesResult.rows[0].categories});
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function addNewMeal(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        req.body.tags = convertArrayToString(req.body.tags);
        const file = req.body.photo;
        const uploadResponse = await cloudinary.v2.uploader.upload(file, {
            folder:'meals'
        });
        let photoURL = uploadResponse.url;

        let newMealResult = await pool.query('INSERT INTO meals VALUES (default, $1, $2, $3, $4, $5, $6, $7) '+
        'RETURNING "mealId", "name", "photo", "price", "tags", "description", "category"',
        [req.body.restaurantId, req.body.name, photoURL, req.body.price, req.body.tags, req.body.description, req.body.category]);

        newMealResult.rows[0].tags = convertStringToArray(newMealResult.rows[0].tags);
        // insert modifiers
        if(req.body.modifiers.length > 0){
            let meal_modifier_values = "";
            for(let i = 0; i < req.body.modifiers.length; i++){
                meal_modifier_values += "(default," + newMealResult.rows[0].mealId + "," + req.body.modifiers[i] + ",false),";
            }
            meal_modifier_values = meal_modifier_values.substring(0, meal_modifier_values.length - 1);
            await pool.query(`INSERT INTO meal_modifier VALUES ${meal_modifier_values}`);
        }
        return res.json(newMealResult.rows[0]);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function editMenuMeal(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        req.body.tags = convertArrayToString(req.body.tags);
        let photo = req.body.photo;
        if(req.body.newPhoto){
            const file = req.body.newPhoto;
            const uploadResponse = await cloudinary.v2.uploader.upload(file, {
                folder:'meals'
            });
            photo = uploadResponse.url;
        }
        let updateMealResult = await pool.query('UPDATE meals SET "name" = $1, "photo" = $2, "price" = $3, "tags" = $4, "description" = $5, "category" = $6 '+
        'WHERE "mealId" = $7 RETURNING "mealId","name","photo","price","tags","description","category"',
        [req.body.name, photo, req.body.price, req.body.tags, req.body.description, req.body.category, req.body.mealId]);

        updateMealResult.rows[0].tags = convertStringToArray(updateMealResult.rows[0].tags);

        //update modifiers
        if(req.body.modifiersChanged){
            await pool.query('DELETE FROM meal_modifier WHERE "mealId" = $1 AND "special" = false',[req.body.mealId]);
            if(req.body.modifiers.length > 0){
                let meal_modifier_values = "";
                for(let i = 0; i < req.body.modifiers.length; i++){
                    meal_modifier_values += "(default," + req.body.mealId + "," + req.body.modifiers[i] + ",false),";
                }
                meal_modifier_values = meal_modifier_values.substring(0, meal_modifier_values.length - 1);
                await pool.query(`INSERT INTO meal_modifier VALUES ${meal_modifier_values}`);
            }
        }
        res.json(updateMealResult.rows[0]); //return edited meal

        if(req.body.newPhoto){ // delete old photo from cloudinary
            let url = req.body.photo;
            let publicId = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
            publicId = 'meals/'+publicId; // to delete photo from cloudinary, public id is needed = name before file extension + folders before that
            await cloudinary.uploader.destroy(publicId);
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function deleteMenuMeal(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let deletedMealResult = await pool.query('DELETE FROM meals WHERE "mealId" = $1 RETURNING "mealId", "photo"',[req.params.id]);
        res.json(deletedMealResult.rows[0].mealId); //return deleted mealId
        await pool.query('DELETE FROM meal_modifier WHERE "mealId" = $1 AND "special" = false',[req.params.id]);
        //delete photo from cloudinary
        let url = deletedMealResult.rows[0].photo;
        let publicId = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
        publicId = 'meals/'+publicId; // to delete photo from cloudinary, public id is needed = name before file extension + folders before that
        await cloudinary.uploader.destroy(publicId);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function convertMealToSpecial(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        req.body.tags = convertArrayToString(req.body.tags);
        req.body.timestamp = req.body.date + ' ' + req.body.time + ':00';
        if(req.body.newPhoto){
            const file = req.body.newPhoto;
            const uploadResponse = await cloudinary.v2.uploader.upload(file, {
                folder:'specials'
            });
            req.body.photo = uploadResponse.url;
        }
        let checkSpecialsLimitResult = await pool.query('SELECT COUNT(*) AS "specials" FROM specials WHERE "restaurantId" = $1 AND "timestamp"::date = $2',
        [req.body.restaurantId, req.body.date]);
        if(checkSpecialsLimitResult.rows[0]['specials'] >= 3){
            return res.status(403).json('DAILY SPECIALS LIMIT FULL');
        }
        let specialsInsertResult = await pool.query('INSERT INTO "specials" VALUES (default, $1, $2, $3, $4, $5, $6, $7, $8) '+
        'RETURNING "specialId", "name", "photo", "price", "tags", "description", "timestamp"',
        [req.body.restaurantId, req.body.name, req.body.photo, req.body.timestamp, req.body.price, req.body.tags, req.body.description, false]);
        specialsInsertResult.rows[0].tags = convertStringToArray(specialsInsertResult.rows[0].tags);
        specialsInsertResult.rows[0].date = getDateFromTimestamp(specialsInsertResult.rows[0].timestamp);
        specialsInsertResult.rows[0].time = getTimeFromTimestamp(specialsInsertResult.rows[0].timestamp);
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

export async function addCategory(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let categoriesResult = await pool.query('SELECT "categories" FROM restaurants WHERE "email" = $1',[decodedEmail]);
        let newCategories = convertStringToArray(categoriesResult.rows[0].categories);
        newCategories.push(req.body.category);
        let newCategoriesString = convertArrayToString(newCategories);
        let newCategoriesResult = await pool.query('UPDATE restaurants SET "categories" = $1 WHERE "email" = $2 RETURNING "categories"',
        [newCategoriesString, decodedEmail]);
        let updatedCategories = convertStringToArray(newCategoriesResult.rows[0].categories);
        return res.json(updatedCategories);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function deleteCategory(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let categoriesResult = await pool.query('SELECT "restaurantId", "categories" FROM restaurants WHERE "email" = $1',[decodedEmail]);
        let newCategories = convertStringToArray(categoriesResult.rows[0].categories);
        newCategories = newCategories.filter(category => category !== req.params.id);
        let newCategoriesString = convertArrayToString(newCategories);
        let newCategoriesResult = await pool.query('UPDATE restaurants SET "categories" = $1 WHERE "email" = $2 RETURNING "categories"',
        [newCategoriesString, decodedEmail]);
        let updatedCategories = convertStringToArray(newCategoriesResult.rows[0].categories)
        //UPDATE AFFECTED MEALS
        let affectedMealsResult = await pool.query('UPDATE meals SET "category" = $1 WHERE "category" = $2 AND "restaurantId" = $3 RETURNING "mealId"', 
        [null, req.params.id, categoriesResult.rows[0].restaurantId]);
        let mealIdsArray = [];
        for(let i = 0; i < affectedMealsResult.rows.length; i++){
            mealIdsArray.push(affectedMealsResult.rows[i].mealId);
        }
        return res.json({categories: updatedCategories, mealIds: mealIdsArray});
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function mealModifiers(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let modifiersResult = await pool.query(`SELECT "modifierId", "modifier" FROM modifiers JOIN meal_modifier USING("modifierId") WHERE "mealId" = $1 AND "special" = false`,[req.params.id]);
        return res.json(modifiersResult.rows);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};