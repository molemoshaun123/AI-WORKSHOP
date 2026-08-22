const express = require('express')
const router = express.Router()
const { createVehicle, getUserVehicles, updateVehicle, deleteVehicle } = require('../controllers/vehicleController')

router.post('/', createVehicle)
router.get('/user/:user_id', getUserVehicles)
router.put('/:id', updateVehicle)
router.delete('/:id', deleteVehicle)

module.exports = router
