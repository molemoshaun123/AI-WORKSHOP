const express = require('express')
const router = express.Router()
const { registerUser, registerAdmin, loginUser, loginAdmin, forgotPassword, resetPassword, updateProfile, changePassword } = require('../controllers/authController')

router.post('/register-user', registerUser)
router.post('/register-admin', registerAdmin)
router.post('/login-user', loginUser)
router.post('/login-admin', loginAdmin)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.put('/profile/:user_id', updateProfile)
router.put('/password/:user_id', changePassword)

module.exports = router