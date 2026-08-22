const express = require('express')
const router = express.Router()
const {
  createJob,
  getJobs,
  getUserJobs,
  updateJobStatus,
  aiDiagnosis,
  assignMechanic,
  getJobHistory,
  applySchedule,
  getApprovedJobsForAI,
  cancelJob,
} = require('../controllers/jobController')
const { createRating, getRatingForJob, getUserRatings, getAllRatings } = require('../controllers/ratingController')

router.get('/approved-for-ai', getApprovedJobsForAI)
router.post('/', createJob)
router.get('/', getJobs)
router.get('/user/:user_id', getUserJobs)
router.put('/schedule/apply', applySchedule)
router.get('/:id/history', getJobHistory)
router.put('/:id', updateJobStatus)
router.put('/:id/assign', assignMechanic)
router.put('/:id/cancel', cancelJob)
router.post('/ai-diagnosis', aiDiagnosis)

// Ratings
router.post('/ratings', createRating)
router.get('/ratings', getAllRatings)
router.get('/ratings/user/:user_id', getUserRatings)
router.get('/ratings/job/:job_id', getRatingForJob)

module.exports = router

