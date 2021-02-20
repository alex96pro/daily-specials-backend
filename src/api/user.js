import pool from '../config/dbConfig.js';
import { DAILY_SPECIALS_PER_PAGE } from '../common/consts.js';
import { convertStringToArray, convertTagsToArray } from '../common/functions.js';

export async function feed(req,res) {
    try{
        let deliveryQuery = '';
        let tagsQuery = '';
        let searchQuery = '';
        if(req.query.tags !== 'null'){
            let tagsArray = req.query.tags.split(',');
            tagsQuery = 'AND (';
            for(let i = 0; i < tagsArray.length; i++){
                tagsQuery += `tags LIKE '%${tagsArray[i]}%' OR `;
            }
            tagsQuery = tagsQuery.substring(0, tagsQuery.length - 4);
            tagsQuery += ')';
        }
        if(req.query.delivery === 'true'){
            deliveryQuery = 'AND delivery = true';
        }
        if(req.query.search){
            searchQuery = `AND ("tags" ILIKE '%${req.query.search}%' OR specials.name ILIKE '%${req.query.search}%')`;
        }
        
        let result = await pool.query(`SELECT DISTINCT ON(specials."specialId") specials."specialId" AS "mealId", sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) AS "distance", "location", restaurants.name as "restaurantName", specials.name as "mealName", "photo", "price", "tags", "description", "delivery", "delivery-minimum", "phone", "restaurantId", "working-hours-from"[${req.query.day}], "working-hours-to"[${req.query.day}] `+
        `FROM specials JOIN restaurants USING("restaurantId") `+
        `WHERE sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) < $3 AND ("delivery" = false OR (sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) < "delivery-range" AND "delivery"=true)) ${tagsQuery} ${deliveryQuery} ${searchQuery} AND "date" <= $4 LIMIT $5 OFFSET $6`,
        [req.query.lat, req.query.lon, req.query.range, req.query.date, DAILY_SPECIALS_PER_PAGE, (req.query.scrollCount - 1) * DAILY_SPECIALS_PER_PAGE]);
        if(result.rows.length && result.rows.length > 0){
            convertTagsToArray(result.rows);
            for(let i = 0; i < result.rows.length; i++){
                if(result.rows[i]["working-hours-from"] !== null) //temporary untill posting feed on closed day is forbiden !
                {
                    result.rows[i]["working-hours-from"] = result.rows[i]["working-hours-from"].substring(0, result.rows[i]["working-hours-from"].length - 3);
                    result.rows[i]["working-hours-to"] = result.rows[i]["working-hours-to"].substring(0, result.rows[i]["working-hours-to"].length - 3);
                }
            }
            res.json(result.rows);
        }else{
            res.json([]);
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function menu(req,res) {
    try{
        let result = await pool.query(`SELECT DISTINCT ON(meals."mealId") meals."mealId", meals.name as "mealName", "photo", "price", "tags", "description", "category" `+
        `FROM meals JOIN restaurants USING("restaurantId") WHERE "restaurantId" = $1`,[req.params.id]);
        if(result.rows.length && result.rows.length > 0){
            convertTagsToArray(result.rows);
            let result2 = await pool.query('SELECT "restaurantId", "name" as "restaurantName", "location", "delivery", "delivery-minimum" as "deliveryMinimum", "phone", "categories", "logo" FROM restaurants WHERE "restaurantId" = $1',[req.params.id]);
            if(result2.rows.length && result2.rows.length > 0){
                result2.rows[0].categories = convertStringToArray(result2.rows[0].categories);
                res.json({meals: result.rows, restaurant: result2.rows[0]});
            }
        }else{
            res.json({meals: [], restaurant: {}});
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};