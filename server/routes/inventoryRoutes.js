const express = require('express')
const router = express.Router()
const {
  listParts,
  createPart,
  updatePartQuantity,
  listOrders,
  createOrder,
  updateOrderStatus,
  getReorderSuggestions,
  updatePart,
  deletePart,
  adjustStock,
} = require('../controllers/inventoryController')

router.get('/parts', listParts)
router.post('/parts', createPart)
router.put('/parts/:part_id', updatePart)
router.delete('/parts/:part_id', deletePart)
router.put('/parts/:part_id/quantity', updatePartQuantity)
router.put('/parts/:part_id/adjust', adjustStock)
router.get('/reorder-suggestions', getReorderSuggestions)

router.get('/orders', listOrders)
router.post('/orders', createOrder)
router.put('/orders/:order_id', updateOrderStatus)

module.exports = router
