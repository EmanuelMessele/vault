// lets write the db connection

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'vault_db',
    user: process.env.DB_USER || 'vault_user',
    password: process.env.DB_PASSWORD || 'vault_password',
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
        ? { rejectUnauthorized: false}
        : false,
})

pool.on('connect', () => {
    console.log('Connected to the database');
})

pool.on('error', (err) => {
    console.error('Database error:', err);
    process.exit(1)
})

module.exports = pool 
