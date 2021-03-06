import pool from '../config/dbConfig.js';
import { DAILY_SPECIALS_PER_PAGE } from '../common/consts.js';
import { convertStringToArray, convertTagsToArray } from '../common/functions.js';

export async function specials(req,res) {
    try{
        let clientDateAndTime = req.query.dateAndTime.substring(req.query.dateAndTime.indexOf(' ') + 1, req.query.dateAndTime.length); //remove date
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
        
        let result = await pool.query(`SELECT "specialId", sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) AS "distance", "location", restaurants.name as "restaurantName", specials.name as "mealName", "photo", "price", "tags", "description", "delivery", "delivery-minimum", "phone", "restaurantId", "working-hours-from"[${req.query.day}], "working-hours-to"[${req.query.day}] `+
        `FROM specials JOIN restaurants USING("restaurantId") `+
        `WHERE sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) < $3 AND ("delivery" = false OR (sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) < "delivery-range" AND "delivery"=true)) ${tagsQuery} ${deliveryQuery} ${searchQuery} AND "timestamp" <= $4 AND "deleted" = false ORDER BY "timestamp" DESC,"specialId" LIMIT $5 OFFSET $6`,
        [req.query.lat, req.query.lon, req.query.range, req.query.dateAndTime, DAILY_SPECIALS_PER_PAGE, (req.query.scrollCount - 1) * DAILY_SPECIALS_PER_PAGE]);
        if(result.rows.length && result.rows.length > 0){
            convertTagsToArray(result.rows);
            for(let i = 0; i < result.rows.length; i++){
                //check if restaurant works that day (temporary untill posting on not working day is forbiden)
                if(result.rows[i]["working-hours-from"] !== null) 
                {
                    // check timestamp of user and working hours of restaurant and mark restaurant as closed
                    result.rows[i]["working-hours-to"] = result.rows[i]["working-hours-to"] === '00:00:00' ? '24:00:00' : result.rows[i]["working-hours-to"]; 
                    if((clientDateAndTime < result.rows[i]["working-hours-from"] || clientDateAndTime > result.rows[i]["working-hours-to"])){
                        result.rows[i].closed = true;
                    }
                    result.rows[i]["working-hours-from"] = result.rows[i]["working-hours-from"].substring(0, result.rows[i]["working-hours-from"].length - 3);
                    result.rows[i]["working-hours-to"] = result.rows[i]["working-hours-to"].substring(0, result.rows[i]["working-hours-to"].length - 3);
                }else{
                    result.rows[i].closed = true;
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

export async function specialModifiers(req,res) {
    try{
        let modifiersResponse = [];
        modifiersResponse = await pool.query('SELECT "modifierId", "modifier" FROM modifiers JOIN meal_modifier USING("modifierId") JOIN specials ON meal_modifier."mealId" = specials."specialId" '+
        'WHERE specials."specialId" = $1 AND "special" = true',[req.params.id]);
        return res.json(modifiersResponse.rows);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};