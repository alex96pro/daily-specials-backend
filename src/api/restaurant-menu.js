import pool from '../config/dbConfig.js';
import cloudinary from '../config/cloudinary.js';
import decodeToken from '../config/authorization.js';
import { convertArrayToString, convertStringToArray, convertTagsToArray } from '../common/functions.js';

export async function menu(req,res) {
    try{
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
            return res.status(401).json("UNAUTHORIZED");
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
            return res.status(401).json("UNAUTHORIZED");
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
            return res.status(401).json("UNAUTHORIZED");
        }
        let deletedMealResult = await pool.query('DELETE FROM meals WHERE "mealId" = $1 RETURNING "mealId", "photo"',[req.params.id]);
        
        res.json(deletedMealResult.rows[0].mealId); //return deleted mealId
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

export async function addCategory(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
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
            return res.status(401).json("UNAUTHORIZED");
        }
        let categoriesResult = await pool.query('SELECT "restaurantId", "categories" FROM restaurants WHERE "email" = $1',[decodedEmail]);
        let newCategories = convertStringToArray(categoriesResult.rows[0].categories);
        newCategories = newCategories.filter(category => category !== req.params.category);
        let newCategoriesString = convertArrayToString(newCategories);
        let newCategoriesResult = await pool.query('UPDATE restaurants SET "categories" = $1 WHERE "email" = $2 RETURNING "categories"',
        [newCategoriesString, decodedEmail]);
        let updatedCategories = convertStringToArray(newCategoriesResult.rows[0].categories)
        //UPDATE AFFECTED MEALS
        let affectedMealsResult = await pool.query('UPDATE meals SET "category" = $1 WHERE "category" = $2 AND "restaurantId" = $3 RETURNING "mealId"', 
        [null, req.params.category, categoriesResult.rows[0].restaurantId]);
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