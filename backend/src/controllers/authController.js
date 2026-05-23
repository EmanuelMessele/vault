const bcrypt = require('bcrypt') // crypt hashes the password
const jwt = require('jsonwebtoken') // jwt like a wristband for when someone logs in
const pool = require('../db/index')

const SALT_ROUNDS = 10

// regustering users 
const register = async (req, res) => {
    try {
        const {email, password, full_name} = req.body
    

        if (!email || !password || !full_name) {
            return res.status(400).json({error: 'Email, password, and full name are required'})
        }

        if (password.length < 8){
            return res.status(400).json({error: 'Password must be at least 8 characters long'})
        }

        const existing = await pool.query(
            `SELECT id FROM users WHERE email = $1`, [email]
        )

        if (existing.rows.length > 0){
            return res.status(400).json({error: "Email already being used"})
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at`,
            [email, password_hash, full_name]
        )

        const user = result.rows[0]

        const token = jwt.sign(
            {userId: user.id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        )

        res.status(201).json({user,token})
       
    } catch (err) {
        console.error('Registration error:', err)
        res.status(500).json({error: 'Internal server error'})
    }
}

// loggin in a user
const login = async (req, res) => {
    try {
        const {email, password} = req.body

        if(!email || !password){
            return res.status(400).json({
                error: 'Email and password are required'
            })
        }

        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`, [email]
        )

        if (result.rows.length === 0){
            return res.status(400).json({error: 'Invalid email or password'})
        }

        const user = result.rows[0]

        const validPassword = await bcrypt.compare(password, user.password_hash)

        if (!validPassword){
            return res.status(401).json({error: 'Invalid email or password'})
        }

        const token = jwt.sign(
            {userId: user.id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        )

        // destructure the password hash out of the user, client doesnt need their hash and dont want it over the network for security
        const {password_hash, deleted_at, ...userWithoutPassword} = user

        res.json({user: userWithoutPassword, token})

    } catch (err) {
        console.error('Login error:', err)
        res.status(500).json({error: "Internal server error"})
    }
}

module.exports = {register, login}