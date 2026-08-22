const express = require('express')
const router = express.Router()
const {
  getMetrics,
  getCustomers,
  getStaff,
  deleteCustomer,
  resetCustomerPassword,
} = require('../controllers/adminController')

router.get('/metrics', getMetrics)
router.get('/customers', getCustomers)
router.get('/staff', getStaff)
router.delete('/customers/:user_id', deleteCustomer)
router.put('/customers/:user_id/password', resetCustomerPassword)

module.exports = router
