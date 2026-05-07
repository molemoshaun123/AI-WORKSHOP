const pool = require('../config/db')

const createVehicle = async (req, res) => {
  try {
    const { user_id, make, model, year, registration_number, vin, color, mileage } = req.body
    const cleanUserId = Number(user_id)
    const cleanMake = String(make || '').trim()
    const cleanModel = String(model || '').trim()
    const cleanReg = String(registration_number || '').trim()

    if (!cleanUserId || !cleanMake || !cleanModel || !cleanReg) {
      return res.status(400).json({ message: 'User, make, model, and registration number are required' })
    }

    const userResult = await pool.query(
      `SELECT user_id FROM public.users
       WHERE user_id = $1 AND role = 'user'`,
      [cleanUserId]
    )
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid user account for vehicle registration' })
    }

    const result = await pool.query(
      `INSERT INTO vehicles (user_id, make, model, year, registration_number, vin, color, mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [cleanUserId, cleanMake, cleanModel, year || null, cleanReg, vin || null, color || null, mileage || null]
    )

    res.status(201).json({ message: 'Vehicle added successfully', vehicle: result.rows[0] })
  } catch (error) {
    res.status(500).json({ message: 'Failed to create vehicle', error: error.message })
  }
}

const getUserVehicles = async (req, res) => {
  try {
    const { user_id } = req.params
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vehicles', error: error.message })
  }
}

module.exports = { createVehicle, getUserVehicles }
