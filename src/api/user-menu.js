import pool from '../config/dbConfig.js';
import { convertStringToArray, convertTagsToArray } from '../common/functions.js';

export async function meals(req,res) {
    try{
        let clientTime = req.params.time;
        let result = await pool.query(`SELECT "mealId", "name" as "mealName", "photo", "price", "tags", "description", "category" FROM "meals" WHERE "restaurantId" = $1`,[req.params.id]);
        if(result.rows.length && result.rows.length > 0){ 
            convertTagsToArray(result.rows);
            let result2 = await pool.query(`SELECT "restaurantId", "name" as "restaurantName", "location", "delivery", "delivery-minimum" as "deliveryMinimum", "phone", "categories", "logo", "working-hours-from"[${req.params.day}], "working-hours-to"[${req.params.day}] FROM restaurants WHERE "restaurantId" = $1`,[req.params.id]);
            result2.rows[0].categories = convertStringToArray(result2.rows[0].categories);
            if(result2.rows[0]["working-hours-from"] !== null) //restaurant works this day
            {
                result2.rows[0]["working-hours-to"] = result2.rows[0]["working-hours-to"] === '00:00:00' ? '24:00:00' : result2.rows[0]["working-hours-to"];
                if((clientTime < result2.rows[0]["working-hours-from"] || clientTime > result2.rows[0]["working-hours-to"])){
                    result2.rows[0].closed = true;
                }
                result2.rows[0]["working-hours-from"] = result2.rows[0]["working-hours-from"].substring(0, result2.rows[0]["working-hours-from"].length - 3);
                result2.rows[0]["working-hours-to"] = result2.rows[0]["working-hours-to"].substring(0, result2.rows[0]["working-hours-to"].length - 3);
            }else{
                result2.rows[0].closed = true;
            }
            res.json({meals: result.rows, restaurant: result2.rows[0]});
        }else{
            res.json({meals: [], restaurant: {}});
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function mealModifiers(req,res) {
    try{
        let modifiersResponse = [];
        modifiersResponse = await pool.query('SELECT "modifierId", "modifier" FROM modifiers JOIN meal_modifier USING("modifierId") JOIN meals USING("mealId") '+
        'WHERE meals."mealId" = $1 AND "special" = false',[req.params.id]);
        return res.json(modifiersResponse.rows);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};