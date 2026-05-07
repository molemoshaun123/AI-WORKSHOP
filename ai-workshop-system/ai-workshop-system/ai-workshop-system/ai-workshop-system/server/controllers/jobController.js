const pool = require('../config/db')
const { diagnoseSymptoms } = require('../services/geminiService')
const ALLOWED_JOB_STATUSES = new Set(['pending', 'diagnosed', 'in_progress', 'completed', 'cancelled'])

const createJob = async (req, res) => {
  try {
    const { user_id, vehicle_id, title, symptoms, priority, appointment_date, estimated_hours, estimated_days } = req.body
    if (!user_id || !vehicle_id || !String(title || '').trim()) {
      return res.status(400).json({ message: 'user_id, vehicle_id, and title are required' })
    }

    const parsedAppointment = appointment_date ? new Date(appointment_date) : null
    if (appointment_date && Number.isNaN(parsedAppointment.getTime())) {
      return res.status(400).json({ message: 'Invalid appointment_date' })
    }

    const result = await pool.query(
      `INSERT INTO jobs (user_id, vehicle_id, title, symptoms, priority, appointment_date, estimated_hours, estimated_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        user_id,
        vehicle_id,
        String(title).trim(),
        symptoms,
        priority,
        parsedAppointment,
        estimated_hours ?? null,
        estimated_days ?? null,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job', error: error.message })
  }
}

const getJobs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*,
              u.full_name AS customer_name, u.email AS customer_email,
              v.make, v.model, v.registration_number,
              m.full_name AS mechanic_name, m.email AS mechanic_email
       FROM public.jobs j
       JOIN public.users u ON u.user_id = j.user_id
       JOIN public.vehicles v ON v.vehicle_id = j.vehicle_id
       LEFT JOIN public.users m ON m.user_id = j.mechanic_id
       ORDER BY j.created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: error.message })
  }
}

const getUserJobs = async (req, res) => {
  try {
    const { user_id } = req.params
    const result = await pool.query(
      `SELECT j.*,
              v.make, v.model, v.registration_number,
              m.full_name AS mechanic_name, m.email AS mechanic_email
       FROM public.jobs j
       JOIN public.vehicles v ON v.vehicle_id = j.vehicle_id
       LEFT JOIN public.users m ON m.user_id = j.mechanic_id
       WHERE j.user_id = $1
       ORDER BY j.created_at DESC`,
      [user_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user jobs', error: error.message })
  }
}

const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, changed_by, notes } = req.body
    const normalizedStatus = String(status || '').trim().toLowerCase()
    if (!ALLOWED_JOB_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }

    const result = await pool.query(
      'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE job_id = $2 RETURNING *',
      [normalizedStatus, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' })
    }

    await pool.query(
      `INSERT INTO public.job_status_history (job_id, status, changed_by, notes)
       VALUES ($1, $2, $3, $4)`,
      [id, normalizedStatus, changed_by || null, notes || null]
    )

    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job', error: error.message })
  }
}

const aiDiagnosis = async (req, res) => {
  try {
    const { job_id, symptoms, vehicleDetails } = req.body
    const response = await diagnoseSymptoms(symptoms, vehicleDetails)
    
    // Parse the AI response (it's expected to be a JSON string from Gemini)
    let aiData = {}
    try {
      aiData = typeof response === 'string' ? JSON.parse(response.replace(/```json|```/g, '').trim()) : response
    } catch (e) {
      console.error('Failed to parse AI response:', e.message)
      aiData = { predicted_problem: 'Unknown', confidence_score: 0, recommended_action: response }
    }

    // Save to public.ai_diagnosis if job_id is provided
    if (job_id) {
      await pool.query(
        `INSERT INTO public.ai_diagnosis (job_id, symptoms_input, predicted_problem, confidence_score, recommendation)
         VALUES ($1, $2, $3, $4, $5)`,
        [job_id, symptoms, aiData.predicted_problem, aiData.confidence_score || 0, aiData.recommended_action || aiData.possible_causes]
      )
    }

    res.json({ diagnosis: aiData })
  } catch (error) {
    console.error('AI diagnosis error:', error.message)
    res.status(500).json({ message: 'AI diagnosis failed', error: error.message })
  }
}

const assignMechanic = async (req, res) => {
  try {
    const { id } = req.params
    const { mechanic_id, assigned_by } = req.body
    if (mechanic_id) {
      const mechanicCheck = await pool.query(
        `SELECT user_id
         FROM public.users
         WHERE user_id = $1 AND role = 'admin'`,
        [mechanic_id]
      )
      if (mechanicCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid mechanic_id' })
      }
    }

    const result = await pool.query(
      `UPDATE public.jobs
       SET mechanic_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE job_id = $2
       RETURNING *`,
      [mechanic_id || null, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' })
    }

    await pool.query(
      `INSERT INTO public.job_status_history (job_id, status, changed_by, notes)
       VALUES ($1, $2, $3, $4)`,
      [id, 'assigned', assigned_by || null, mechanic_id ? `Assigned mechanic_id=${mechanic_id}` : 'Unassigned mechanic']
    )

    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign mechanic', error: error.message })
  }
}

const getJobHistory = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT h.history_id, h.job_id, h.status, h.changed_at, h.notes,
              u.full_name AS changed_by_name
       FROM public.job_status_history h
       LEFT JOIN public.users u ON u.user_id = h.changed_by
       WHERE h.job_id = $1
       ORDER BY h.changed_at ASC`,
      [id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job history', error: error.message })
  }
}

const applySchedule = async (req, res) => {
  const client = await pool.connect()
  try {
    const { schedule } = req.body || {}
    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ message: 'schedule array is required' })
    }

    await client.query('BEGIN')
    for (const item of schedule) {
      await client.query(
        `UPDATE public.jobs
         SET scheduled_rank = $1,
             predicted_completion = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE job_id = $3`,
        [item.scheduled_rank ?? null, item.predicted_completion ? new Date(item.predicted_completion) : null, item.job_id]
      )
    }
    await client.query('COMMIT')
    res.json({ message: 'Schedule applied' })
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Failed to apply schedule', error: error.message })
  } finally {
    client.release()
  }
}

module.exports = {
  createJob,
  getJobs,
  getUserJobs,
  updateJobStatus,
  aiDiagnosis,
  assignMechanic,
  getJobHistory,
  applySchedule,
}
