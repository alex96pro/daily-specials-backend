import pool from '../config/dbConfig.js';

export async function login(req,res){
    try{
        let result = await pool.query("SELECT * FROM users");
    }catch(err){
        res.json(err);
    }
}
export async function signUp(req,res){
    
}