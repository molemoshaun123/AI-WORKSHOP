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

module.exports = { createVehicle, getUserVehicles, updateVehicle, deleteVehicle }

async function updateVehicle(req, res) {
  try {
    const { id } = req.params
    const { make, model, year, registration_number, vin, color, mileage } = req.body

    const result = await pool.query(
      `UPDATE public.vehicles
       SET make = COALESCE($1, make),
           model = COALESCE($2, model),
           year = COALESCE($3, year),
           registration_number = COALESCE($4, registration_number),
           vin = COALESCE($5, vin),
           color = COALESCE($6, color),
           mileage = COALESCE($7, mileage)
       WHERE vehicle_id = $8
       RETURNING *`,
      [
        make || null,
        model || null,
        year || null,
        registration_number || null,
        vin || null,
        color || null,
        mileage || null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    res.json({ message: 'Vehicle updated', vehicle: result.rows[0] })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update vehicle', error: error.message })
  }
}

async function deleteVehicle(req, res) {
  try {
    const { id } = req.params

    // Check for active jobs on this vehicle
    const activeJobs = await pool.query(
      `SELECT COUNT(*)::int AS count FROM public.jobs WHERE vehicle_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [id]
    )
    if (Number(activeJobs.rows[0]?.count) > 0) {
      return res.status(400).json({ message: 'Cannot delete vehicle with active jobs' })
    }

    const result = await pool.query(
      `DELETE FROM public.vehicles WHERE vehicle_id = $1 RETURNING *`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    res.json({ message: 'Vehicle deleted', vehicle: result.rows[0] })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete vehicle', error: error.message })
  }
}
