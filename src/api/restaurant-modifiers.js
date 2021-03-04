import pool from '../config/dbConfig.js';
import decodeToken from '../config/authorization.js';

export async function modifiers(req,res) {
    try{
        let decodedEmail = decodeToken(req.headers.authorization);
        if(decodedEmail === null){
            return res.status(401).json("Unauthorized");
        }
        let modifiersResult = await pool.query('SELECT "modifierId", "modifier" FROM modifiers WHERE "restaurantId" = $1',[req.params.id]);
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