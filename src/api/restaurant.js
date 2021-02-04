import pool from '../config/dbConfig.js';
import cloudinary from '../config/cloudinary.js';
import decodeToken from '../config/authorization.js';

export async function menu(req,res) {
    try{
        let mealsResult = await pool.query('SELECT "mealId", "name", "photo", "price", "tags", "description", "category" FROM meals WHERE "restaurantId" = $1',[req.params.id]);
        let categoriesResult = await pool.query('SELECT "categories" FROM restaurants WHERE "restaurantId" = $1', [req.params.id]);
        let categories = [];
        if(categoriesResult.rows && categoriesResult.rows.length > 0){
            categories = categoriesResult.rows[0].categories.split(',');
        }else{
            return res.json([]);
        }
        if(mealsResult.rows && mealsResult.rows.length > 0){
            for(let i = 0; i < mealsResult.rows.length; i++){
                if(mealsResult.rows[i].tags){
                    mealsResult.rows[i].tags = mealsResult.rows[i].tags.split(',');
                }else{
                    mealsResult.rows[i].tags = [];
                }
            }
        }else{
            return res.json([]);
        }
        res.json({meals: mealsResult.rows, categories: categories});
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
        
        if(req.body.tags.length > 0){
            req.body.tags = req.body.tags.join(',');
        }else{
            req.body.tags = null;
        }
        
        let updateMealResult = await pool.query('UPDATE meals SET "name" = $1, "photo" = $2, "price" = $3, "tags" = $4, "description" = $5, "category" = $6 '+
        'WHERE "mealId" = $7 RETURNING "mealId","name","photo","price","tags","description","category"',
        [req.body.name, req.body.photo, req.body.price, req.body.tags, req.body.description, req.body.category, req.body.mealId]);
        if(updateMealResult.rows[0].tags){
            updateMealResult.rows[0].tags = updateMealResult.rows[0].tags.split(',');
        }else{
            updateMealResult.rows[0].tags = [];
        }
        res.json(updateMealResult.rows[0]); //returning edited meal
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
        let mealPhotoResult = await pool.query('SELECT "photo" FROM meals WHERE "mealId" = $1',[req.params.id]);
        if(mealPhotoResult.rows && mealPhotoResult.rows.length > 0 && mealPhotoResult.rows[0].photo){
            let url = mealPhotoResult.rows[0].photo;
            let publicId = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
            publicId = 'meals/'+publicId; // to delete photo from cloudinary, public id is needed = name before file extension + folders before that
            await cloudinary.uploader.destroy(publicId);
        }
        let deletedMealIdResult = await pool.query('DELETE FROM meals WHERE "mealId" = $1 RETURNING "mealId"',[req.params.id]);
        res.json(deletedMealIdResult.rows[0].mealId);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};
