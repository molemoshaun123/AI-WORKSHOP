const express = require('express')
const router = express.Router()
const {
  listSuppliers,
  comparePrices,
  orderFromSupplier,
  listOrdersWithSuppliers,
} = require('../controllers/supplierController')

router.get('/suppliers', listSuppliers)
router.get('/suppliers/:part_id/compare', comparePrices)
router.post('/suppliers/order', orderFromSupplier)
router.get('/supplier-orders', listOrdersWithSuppliers)

module.exports = router
