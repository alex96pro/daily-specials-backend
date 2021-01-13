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
            let result;
            if(req.query.tags !== 'null'){ // Query with tags
                let tags = req.query.tags.split(',');
                result = await pool.query(`SELECT DISTINCT ON(meals."mealId") meals."mealId", sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) AS "distance", "location", restaurants.name as "restaurantName", meals.name as "mealName", "photo", "price"`+
                `FROM meals JOIN restaurants USING("restaurantId") JOIN "meal-tag" USING("mealId") JOIN tags USING("tagId") WHERE sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) < $3 AND tags.name = ANY ($4) LIMIT $5 OFFSET $6`,
                [req.query.lat, req.query.lon, req.query.range, tags, DAILY_SPECIALS_PER_PAGE, (req.query.scrollCount - 1) * DAILY_SPECIALS_PER_PAGE]);
            }else{                         // Query without tags
                result = await pool.query('SELECT meals."mealId", sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) AS "distance", "location", restaurants.name as "restaurantName", meals.name as "mealName", "photo", "price"'+
                'FROM meals JOIN restaurants USING("restaurantId") WHERE sqrt((("lat" - $1) * 111)^2 + (("lon" - $2) * 111)^2) < $3 LIMIT $4 OFFSET $5',
                [req.query.lat, req.query.lon, req.query.range, DAILY_SPECIALS_PER_PAGE, (req.query.scrollCount - 1) * DAILY_SPECIALS_PER_PAGE]);
            }
            if(result.rows.length && result.rows.length > 0){
                for(let i = 0; i < result.rows.length; i++){
                    result.rows[i].tags = [];
                }
                for(let i = 0; i < result.rows.length; i++){
                    let mealTags = await pool.query('SELECT tags.name FROM meals JOIN "meal-tag" USING("mealId") JOIN tags USING("tagId") WHERE meals."mealId" = $1',[result.rows[i].mealId]);
                    for(let j = 0; j < mealTags.rows.length; j++){
                        result.rows[i].tags.push(mealTags.rows[j].name);
                    }
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
}