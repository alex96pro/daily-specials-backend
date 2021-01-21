import pool from '../config/dbConfig.js';
import jwt, { decode } from 'jsonwebtoken';
import decodeToken from '../config/authorization.js';
import { DAILY_SPECIALS_PER_PAGE } from '../consts.js';

export async function feed(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("UNAUTHORIZED");
        }else{
            let deliveryQuery = '';
            let tagsQuery = '';
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
            
            let result = await pool.query(`SELECT DISTINCT ON(specials."specialId") specials."specialId" AS "mealId", sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) AS "distance", "location", restaurants.name as "restaurantName", specials.name as "mealName", "photo", "price", "tags", "delivery", "delivery-minimum", "phone", "restaurantId" `+
            `FROM specials JOIN restaurants USING("restaurantId") `+
            `WHERE sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) < $3 AND ("delivery" = false OR (sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) < "delivery-range" AND "delivery"=true)) ${tagsQuery} ${deliveryQuery} LIMIT $4 OFFSET $5`,
            [req.query.lat, req.query.lon, req.query.range, DAILY_SPECIALS_PER_PAGE, (req.query.scrollCount - 1) * DAILY_SPECIALS_PER_PAGE]);
            if(result.rows.length && result.rows.length > 0){
                for(let i = 0; i < result.rows.length; i++){
                    result.rows[i].tags = result.rows[i].tags.split(',');
                }
                res.json(result.rows);
            }else{
                res.json([]);
            }
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function menu(req,res) {
    try{
        let result = await pool.query(`SELECT DISTINCT ON(meals."mealId") meals."mealId", "location", restaurants.name as "restaurantName", meals.name as "mealName", "photo", "price", "tags", "delivery", "delivery-minimum", "phone", "restaurantId" `+
        `FROM meals JOIN restaurants USING("restaurantId") WHERE "restaurantId" = $1`,[req.params.id]);
        if(result.rows.length && result.rows.length > 0){
            for(let i = 0; i < result.rows.length; i++){
                result.rows[i].tags = result.rows[i].tags.split(',');
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