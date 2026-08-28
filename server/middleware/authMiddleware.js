const jwt = require('jsonwebtoken')
const pool = require('../config/db')
require('dotenv').config()

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if user still exists in DB
    const userResult = await pool.query('SELECT user_id, role FROM users WHERE user_id = $1', [decoded.user_id])
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User no longer exists' })
    }

    req.user = userResult.rows[0]
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ message: 'Admin access required' })
  }
}

module.exports = { verifyToken, verifyAdmin }
