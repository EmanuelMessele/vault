const fs = require('fs')
const path = require('path')
const pool = require('./index')

const runMigrations = async () => {
    const client = await pool.connect()

    try {

        // migrations table to track which migrations have been run
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                run_at TIMESTAMP DEFAULT NOW()
            )`
        )

    // go to migrations folder, read all .sql files, and run them if they haven't been run before
    const migrationsDir = path.join(__dirname, 'migrations') // path.join does what? it joins the current directory with the migrations folder, so we get the full path to the migrations folder
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
        // fs.readditSync reads the contents of the migrations directory and returns an array of filenames. We then filter this array to only include files that end with .sql, and sort them alphabetically to ensure they run in the correct order.
    for(const file of files) { // go thru each file and check if it has been run before by looking it up in the migrations table. If it hasn't been run, we read the SQL from the file and execute it, then insert a record into the migrations table to mark it as run.
        const already = await client.query(
            `SELECT id FROM migrations WHERE filename = $1`, [file]
        )

    if(already.rows.length === 0){
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
        await client.query(sql)
        await client.query(
            `INSERT INTO migrations (filename) VALUES ($1)`, [file]
        )
        console.log(`Ran migration: ${file}`)
    } else {
        console.log(`Skipped migration: ${file}`)
    }
}
    console.log('All migrations completed successfully')

    } catch (err) {
        console.error('Migration error:', err)
    } finally {
        client.release() // need to release since our pool has a limited number of connections allowed
    }
}

module.exports = runMigrations // module.exports allows us to export this function so we can use it in other files, like our server.js file where we want to run the migrations before starting the server.