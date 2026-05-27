const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const authRoutes = require('./routes/auth')
const collectionRoutes = require('./routes/collections')
const documentRoutes = require('./routes/documents')


const app = express()

app.use(helmet())
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000' // either connects to our client url (aws) or local host
}))
app.use(express.json())

app.get('/health', (req,res) => {
    res.json({ status: 'ok', message: 'Vault API is running' })
})

app.use('/api/auth', authRoutes) // all routes in authRoutes will be prefixed with /api/auth, so we can have /api/auth/register and /api/auth/login
app.use('/api/collections', collectionRoutes) // all routes in collectionRoutes will be prefixed with /api/collections
app.use('/api/documents', documentRoutes) // all routes in documentRoutes will be prefixed with /api/documents
module.exports = app // creates and exports app
