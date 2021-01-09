import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export default function decodeToken(headerToken){
    //AUTHORIZATION
    const usertoken = headerToken;
    const token = usertoken.split(' ');
    const decoded = jwt.verify(token[1], process.env.ACCESS_TOKEN_SECRET);
    if(decoded !== null){
        return decoded.email;  
    }else{
        return null;
    }
}