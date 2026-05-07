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
} = require('../controllers/jobController')

router.post('/', createJob)
router.get('/', getJobs)
router.get('/user/:user_id', getUserJobs)
router.put('/schedule/apply', applySchedule)
router.get('/:id/history', getJobHistory)
router.put('/:id', updateJobStatus)
router.put('/:id/assign', assignMechanic)
router.post('/ai-diagnosis', aiDiagnosis)

module.exports = router
