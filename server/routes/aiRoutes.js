const express = require("express");
const router = express.Router();
const pool = require('../config/db')
const {
  diagnoseSymptoms,
  estimateRepairTime,
  bookingHelper,
  partsCompatibility,
  smartJobSchedule,
  customerUpdate,
  repairCostEstimate,
  summarizeJobCard,
  summarizeConversation,
  carChat,
  analyzeAudio,
  forecastStock,
  estimateCarValue,
} = require("../services/geminiService");

router.post("/diagnose", async (req, res) => {
  try {
    const { symptoms, vehicleDetails } = req.body;

    if (!symptoms || symptoms.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Symptoms are required",
      });
    }

    const result = await diagnoseSymptoms(symptoms, vehicleDetails || {});

    res.status(200).json({
      success: true,
      diagnosis: result,
    });
  } catch (error) {
    console.error("AI diagnosis error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get AI diagnosis",
    });
  }
});

router.post("/repair-time-estimate", async (req, res) => {
  try {
    const { symptoms, vehicleDetails } = req.body

    if (!symptoms || symptoms.trim() === "") {
      return res.status(400).json({ success: false, message: "Symptoms are required" })
    }

    const result = await estimateRepairTime(symptoms, vehicleDetails || {})

    res.status(200).json({
      success: true,
      estimate: result,
    })
  } catch (error) {
    console.error("AI time estimate error:", error.message)
    res.status(500).json({
      success: false,
      message: "Failed to get repair time estimation",
    })
  }
})

router.post("/booking-helper", async (req, res) => {
  try {
    const { message, vehicles, now } = req.body

    if (!message || String(message).trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required" })
    }

    const result = await bookingHelper(message, vehicles || [], now || new Date().toISOString())

    res.status(200).json({
      success: true,
      result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get booking suggestion",
    })
  }
})

router.post("/parts-compatibility", async (req, res) => {
  try {
    const { part_name, vehicle } = req.body
    if (!part_name || String(part_name).trim() === '') {
      return res.status(400).json({ success: false, message: 'part_name is required' })
    }
    const partsRes = await pool.query('SELECT name, sku, quantity, reorder_level, unit_price FROM public.parts ORDER BY quantity DESC, created_at DESC')
    const result = await partsCompatibility(part_name, vehicle || {}, partsRes.rows)

    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check compatibility' })
  }
})

router.post("/smart-schedule", async (req, res) => {
  try {
    const { now } = req.body || {}
    const jobsRes = await pool.query(
      `SELECT job_id, title, status, priority, appointment_date, estimated_hours, estimated_days, mechanic_id
       FROM public.jobs
       WHERE status <> 'completed'
       ORDER BY created_at DESC`
    )
    const result = await smartJobSchedule(jobsRes.rows, now || new Date().toISOString())
    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate schedule' })
  }
})

router.post("/customer-update", async (req, res) => {
  try {
    const { job_id, new_status } = req.body || {}
    if (!job_id) return res.status(400).json({ success: false, message: 'job_id is required' })

    const jobRes = await pool.query(
      `SELECT j.*, u.full_name AS customer_name, u.email AS customer_email,
              v.make, v.model, v.registration_number,
              m.full_name AS mechanic_name, m.email AS mechanic_email
       FROM public.jobs j
       JOIN public.users u ON u.user_id = j.user_id
       JOIN public.vehicles v ON v.vehicle_id = j.vehicle_id
       LEFT JOIN public.users m ON m.user_id = j.mechanic_id
       WHERE j.job_id = $1`,
      [job_id]
    )
    if (jobRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Job not found' })

    const result = await customerUpdate(jobRes.rows[0], new_status || jobRes.rows[0].status)
    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate customer update' })
  }
})

router.post("/repair-cost-estimate", async (req, res) => {
  try {
    const { symptoms, vehicleDetails } = req.body || {}
    if (!symptoms || String(symptoms).trim() === '') {
      return res.status(400).json({ success: false, message: 'Symptoms are required' })
    }

    const partsRes = await pool.query(
      'SELECT name, sku, quantity, reorder_level, unit_price FROM public.parts ORDER BY quantity DESC, created_at DESC LIMIT 20'
    )
    const result = await repairCostEstimate(symptoms, vehicleDetails || {}, partsRes.rows)

    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to estimate repair cost' })
  }
})

router.post("/job-card-summary", async (req, res) => {
  try {
    const { title, symptoms, customer_notes, vehicleDetails, priority } = req.body || {}
    if (!title && !symptoms && !customer_notes) {
      return res.status(400).json({ success: false, message: 'Job card details are required' })
    }

    const result = await summarizeJobCard({
      title: title || '',
      symptoms: symptoms || '',
      customer_notes: customer_notes || '',
      priority: priority || 'normal',
      vehicle: vehicleDetails || {},
    })

    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to summarize job card' })
  }
})

router.post("/conversation-summary", async (req, res) => {
  try {
    const { messages, context } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages array is required' })
    }

    const result = await summarizeConversation(messages, context || {})
    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to summarize conversation' })
  }
})

router.post("/car-chat", async (req, res) => {
  try {
    const { messages, vehicleDetails } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "messages array is required" })
    }

    const result = await carChat(messages, vehicleDetails || {})
    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get response" })
  }
})

router.post("/analyze-audio", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body || {}
    if (!audioBase64 || !mimeType) {
      return res.status(400).json({ success: false, message: "audioBase64 and mimeType are required" })
    }

    const validMimeTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac']
    if (!validMimeTypes.some(t => mimeType.startsWith(t.split('/')[0]) && mimeType.includes(t.split('/')[1])) && !mimeType.startsWith('audio/')) {
      return res.status(400).json({ success: false, message: "Invalid audio format. Supported: webm, mp3, wav, ogg, mp4, aac" })
    }

    const base64Data = audioBase64.includes('base64,') ? audioBase64.split('base64,')[1] : audioBase64
    const buffer = Buffer.from(base64Data, 'base64')

    // Limit to ~10MB of raw audio
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: "Audio file too large. Please record a shorter clip (under 15 seconds)." })
    }

    const result = await analyzeAudio(buffer, mimeType)

    let analysisData = {}
    try {
      analysisData = typeof result === 'string' ? JSON.parse(result.replace(/```json|```/g, '').trim()) : result
    } catch (e) {
      console.error('Failed to parse audio analysis response:', e.message)
      analysisData = { predicted_problem: 'Analysis parsing error', confidence_score: 0, raw: result }
    }

    if (analysisData.error === true) {
      return res.status(400).json({
        success: false,
        rejected: true,
        message: analysisData.message || 'The audio is not suitable for vehicle sound analysis.',
      })
    }

    res.status(200).json({ success: true, analysis: analysisData })
  } catch (error) {
    console.error('Audio analysis error:', error.message)
    res.status(500).json({ success: false, message: 'Audio analysis failed' })
  }
})

router.post("/stock-forecast", async (req, res) => {
  try {
    const { now } = req.body || {}

    const [partsRes, ordersRes, jobsRes] = await Promise.all([
      pool.query('SELECT part_id, name, sku, quantity, reorder_level, unit_price FROM public.parts ORDER BY created_at DESC'),
      pool.query(
        `SELECT o.order_id, o.quantity, o.status, o.created_at, p.name AS part_name
         FROM public.part_orders o
         JOIN public.parts p ON p.part_id = o.part_id
         ORDER BY o.created_at DESC`
      ),
      pool.query(
        `SELECT job_id, title, status, priority, created_at
         FROM public.jobs
         ORDER BY created_at DESC
         LIMIT 100`
      ),
    ])

    const result = await forecastStock(
      partsRes.rows,
      ordersRes.rows,
      jobsRes.rows,
      now || new Date().toISOString()
    )

    res.status(200).json({ success: true, result })
  } catch (error) {
    console.error('Stock forecast error:', error.message)
    res.status(500).json({ success: false, message: 'Failed to generate stock forecast' })
  }
})

router.post("/car-valuation", async (req, res) => {
  try {
    const { vehicleDetails, images } = req.body || {}
    if (!vehicleDetails || (!vehicleDetails.make && !vehicleDetails.model)) {
      return res.status(400).json({ success: false, message: 'Vehicle make and model are required' })
    }

    const result = await estimateCarValue(vehicleDetails, images || [])

    let valuation = {}
    try {
      valuation = typeof result === 'string' ? JSON.parse(result.replace(/```json|```/g, '').trim()) : result
    } catch (e) {
      console.error('Failed to parse car valuation response:', e.message)
      valuation = { fair_market_value: 0, confidence_score: 0, raw: result }
    }

    res.status(200).json({ success: true, valuation })
  } catch (error) {
    console.error('Car valuation error:', error.message)
    res.status(500).json({ success: false, message: 'Failed to estimate car value' })
  }
})

module.exports = router;
