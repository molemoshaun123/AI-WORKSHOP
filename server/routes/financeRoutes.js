const express = require('express')
const router = express.Router()
const {
  generateQuote,
  updateQuoteStatus,
  generateInvoice,
  updateInvoiceStatus,
  getFinancesForJob,
  getUserActionItems
} = require('../controllers/financeController')

router.post('/quote', generateQuote)
router.put('/quote/:id', updateQuoteStatus)
router.post('/invoice', generateInvoice)
router.put('/invoice/:id', updateInvoiceStatus)
router.get('/job/:job_id', getFinancesForJob)
router.get('/actions/:user_id', getUserActionItems)

module.exports = router
