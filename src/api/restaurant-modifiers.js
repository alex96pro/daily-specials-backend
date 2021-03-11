import pool from '../config/dbConfig.js';
import decodeToken from '../config/authorization.js';

export async function modifiers(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let modifiersResult = await pool.query(`SELECT "modifierId", "modifier" FROM modifiers WHERE "restaurantId" = $1 ORDER BY modifier->>'name'`,[req.params.id]);
        return res.json(modifiersResult.rows);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function addNewModifier(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let addNewModifierResult = await pool.query('INSERT INTO modifiers VALUES (default, $1, $2) RETURNING "modifierId", "modifier"',[req.body.restaurantId, req.body.modifier]);
        return res.json(addNewModifierResult.rows[0]);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

export async function editModifier(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let updateResult = await pool.query('UPDATE modifiers SET "modifier" = $1 WHERE "modifierId" = $2 RETURNING "modifierId", "modifier"', [req.body.modifier, req.body.modifierId]);
        res.json(updateResult.rows[0]);
        // UPDATE prices of afected meals and specials if modifier is type of requiredBase
        if(req.body.modifier.modifierType === "requiredBase"){
            let newPrice = req.body.modifier.options[req.body.modifier.defaultOption];
            await pool.query('UPDATE meals SET "price" = $1 WHERE "mealId" = ANY(SELECT "mealId" FROM meal_modifier JOIN modifiers USING("modifierId") '
            +'WHERE meal_modifier."modifierId" = $2 AND "special" = false)',[newPrice, req.body.modifierId]);
            await pool.query('UPDATE specials SET "price" = $1 WHERE "specialId" = ANY(SELECT "mealId" FROM meal_modifier JOIN modifiers USING("modifierId") '
            +'WHERE meal_modifier."modifierId" = $2 AND "special" = true)',[newPrice, req.body.modifierId]);
        }
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
}

export async function deleteModifier(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let deletedResult = await pool.query('DELETE FROM "modifiers" WHERE "modifierId" = $1 RETURNING "modifierId"', [req.params.id]);
        await pool.query('DELETE FROM "meal_modifier" WHERE "modifierId" = $1', [req.params.id]);
        return res.json(deletedResult.rows[0].modifierId);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};