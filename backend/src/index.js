require('dotenv').config()
const app = require('./app')
const runMigrations = require('./db/migrate')


const PORT = process.env.PORT || 5000

const start = async () => {
    try {
        await runMigrations() // run the migrations before starting the server to ensure our database is up to date with the latest schema changes.
        app.listen(PORT,() => {
        console.log(`Vault API running on port ${PORT}`)
        })
    } catch (err) {
        console.error('Failed to start server:', err)
        process.exit(1)
    }
}

start()