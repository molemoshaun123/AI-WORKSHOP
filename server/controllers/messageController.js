const pool = require('../config/db')

const sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, job_id, content } = req.body
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, job_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, receiver_id, job_id || null, content]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message })
  }
}

const getMessages = async (req, res) => {
  try {
    const { user_id, other_id } = req.params
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [user_id, other_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message })
  }
}

const getConversations = async (req, res) => {
  try {
    const { user_id } = req.params
    const result = await pool.query(
      `SELECT DISTINCT ON (other_id)
         CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_id,
         u.full_name, u.role, m.content, m.created_at
       FROM messages m
       JOIN users u ON u.user_id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
       WHERE sender_id = $1 OR receiver_id = $1
       ORDER BY other_id, m.created_at DESC`,
      [user_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message })
  }
}

module.exports = { sendMessage, getMessages, getConversations }
