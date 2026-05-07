const pool = require('../config/db')
const bcrypt = require('bcrypt')

const getMetrics = async (req, res) => {
  try {
    const [jobsCount, statusCount, usersCount, recentJobs, unreadMessages, lowStockParts, todaysAppointments] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM public.jobs'),
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM public.jobs
         GROUP BY status`
      ),
      pool.query(
        `SELECT role, COUNT(*)::int AS count
         FROM public.users
         GROUP BY role`
      ),
      pool.query(
        `SELECT j.*, u.full_name AS customer_name, v.make, v.model, v.registration_number
         FROM public.jobs j
         JOIN public.users u ON u.user_id = j.user_id
         JOIN public.vehicles v ON v.vehicle_id = j.vehicle_id
         ORDER BY j.created_at DESC
         LIMIT 10`
      ),
      pool.query('SELECT COUNT(*)::int AS total FROM public.messages WHERE is_read = FALSE'),
      pool.query('SELECT COUNT(*)::int AS total FROM public.parts WHERE quantity <= COALESCE(reorder_level, 0)'),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM public.jobs
         WHERE appointment_date IS NOT NULL
           AND appointment_date::date = CURRENT_DATE`
      ),
    ])

    res.json({
      jobs_total: jobsCount.rows[0]?.total || 0,
      jobs_by_status: statusCount.rows,
      users_by_role: usersCount.rows,
      recent_jobs: recentJobs.rows,
      unread_messages_total: unreadMessages.rows[0]?.total || 0,
      low_stock_parts_total: lowStockParts.rows[0]?.total || 0,
      todays_appointments_total: todaysAppointments.rows[0]?.total || 0,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to load metrics', error: error.message })
  }
}

const getCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.created_at,
              COUNT(v.vehicle_id)::int AS vehicles_count,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'vehicle_id', v.vehicle_id,
                    'make', v.make,
                    'model', v.model,
                    'registration_number', v.registration_number,
                    'year', v.year,
                    'color', v.color
                  )
                  ORDER BY v.created_at DESC
                ) FILTER (WHERE v.vehicle_id IS NOT NULL),
                '[]'::json
              ) AS vehicles
       FROM public.users u
       LEFT JOIN public.vehicles v ON v.user_id = u.user_id
       WHERE u.role = 'user'
       GROUP BY u.user_id
       ORDER BY u.created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load customers', error: error.message })
  }
}

const getStaff = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role
       FROM public.users
       WHERE role = 'admin'
       ORDER BY created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load staff', error: error.message })
  }
}

const deleteCustomer = async (req, res) => {
  try {
    const { user_id } = req.params
    const result = await pool.query(
      `DELETE FROM public.users
       WHERE user_id = $1
         AND role = 'user'
       RETURNING user_id, full_name, email`,
      [user_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    res.json({
      message: 'Customer account deleted successfully',
      customer: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete customer', error: error.message })
  }
}

const resetCustomerPassword = async (req, res) => {
  try {
    const { user_id } = req.params
    const { password } = req.body || {}

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    const result = await pool.query(
      `UPDATE public.users
       SET password_hash = $1
       WHERE user_id = $2
         AND role = 'user'
       RETURNING user_id, full_name, email`,
      [passwordHash, user_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    res.json({
      message: 'Customer password updated successfully',
      customer: result.rows[0],
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update customer password', error: error.message })
  }
}

module.exports = { getMetrics, getCustomers, getStaff, deleteCustomer, resetCustomerPassword }
