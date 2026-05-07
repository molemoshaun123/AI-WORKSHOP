const express = require('express')
const router = express.Router()
const { sendMessage, getMessages, getConversations } = require('../controllers/messageController')

router.post('/', sendMessage)
router.get('/conversations/:user_id', getConversations)
router.get('/:user_id/:other_id', getMessages)

module.exports = router
