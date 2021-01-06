import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max:20,
    connectionTimeoutMillis:0,
    idleTimeoutMillis:0
});

export default pool;