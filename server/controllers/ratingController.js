const pool = require('../config/db')

const createRating = async (req, res) => {
  try {
    const { job_id, user_id, stars, comment } = req.body

    if (!job_id || !user_id || !stars) {
      return res.status(400).json({ message: 'job_id, user_id, and stars are required' })
    }
    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'stars must be between 1 and 5' })
    }

    // Verify job belongs to user and is completed
    const jobCheck = await pool.query(
      `SELECT job_id, status FROM public.jobs WHERE job_id = $1 AND user_id = $2`,
      [job_id, user_id]
    )
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found for this user' })
    }
    if (jobCheck.rows[0].status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed jobs' })
    }

    // Upsert rating (one per job per user)
    const result = await pool.query(
      `INSERT INTO public.ratings (job_id, user_id, stars, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (job_id, user_id)
       DO UPDATE SET stars = EXCLUDED.stars, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [job_id, user_id, stars, comment || null]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to save rating', error: error.message })
  }
}

const getRatingForJob = async (req, res) => {
  try {
    const { job_id } = req.params
    const result = await pool.query(
      `SELECT * FROM public.ratings WHERE job_id = $1`,
      [job_id]
    )
    res.json(result.rows[0] || null)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rating', error: error.message })
  }
}

const getUserRatings = async (req, res) => {
  try {
    const { user_id } = req.params
    const result = await pool.query(
      `SELECT r.*, j.title AS job_title
       FROM public.ratings r
       JOIN public.jobs j ON j.job_id = r.job_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [user_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ratings', error: error.message })
  }
}

const getAllRatings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, j.title AS job_title, u.full_name AS customer_name
       FROM public.ratings r
       JOIN public.jobs j ON j.job_id = r.job_id
       JOIN public.users u ON u.user_id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT 50`
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ratings', error: error.message })
  }
}

module.exports = { createRating, getRatingForJob, getUserRatings, getAllRatings }
