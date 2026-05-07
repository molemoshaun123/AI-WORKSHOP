const express = require('express')
const router = express.Router()
const { createVehicle, getUserVehicles } = require('../controllers/vehicleController')

router.post('/', createVehicle)
router.get('/user/:user_id', getUserVehicles)

module.exports = router
