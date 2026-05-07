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

module.exports = router;
