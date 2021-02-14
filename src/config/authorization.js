import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export default function decodeToken(headerToken){
    //AUTHORIZATION WITH TOKEN
    if(!headerToken){
        return null;
    }
    const usertoken = headerToken;
    const token = usertoken.split(' ');
    let decoded = null;
    try{
        decoded = jwt.verify(token[1], process.env.ACCESS_TOKEN_SECRET);
    }catch(err){
        return decoded;
    }
    if(decoded !== null){
        return decoded.email;  
    }else{
        return decoded;
    }
}