const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const app = express()

app.use(helmet())
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000' // either connects to our client url (aws) or local host
}))
app.use(express.json())

app.get('/health', (req,res) => {
    res.json({ status: 'ok', message: 'Vault API is running' })
})

module.exports = app // creates and exports app