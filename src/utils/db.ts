// utils/db.ts (or db.js)
import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'revive@123',
  database: 'IIE_TEST',
});
