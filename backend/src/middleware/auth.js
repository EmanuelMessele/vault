//front end needs to prove who it is , when making a req

const jwt = require('jsonwebtoken')

const authenticate = (req,res,next) => {
    console.log('Auth header:', req.headers.authorization) // for debugging, log the auth header to see if it's being sent correctly
    try {
        const authHeader = req.headers.authorization // reads header

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({error: 'No token provided'})
        }
        // commong to have Bearer token in the header, so we check if it starts with Bearer and then split to get the actual token value

        const token = authHeader.split(' ')[1] // split Bearer from actual toekn
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log('Decoded token:', decoded)
        req.user = decoded
        next() // im done, pass control to next middleware
    } catch (error) {
        return res.status(401).json({error: 'Invalid or expired token'})
    }
}

module.exports = authenticate