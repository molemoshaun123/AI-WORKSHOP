const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const vehicleRoutes = require('./routes/vehicleRoutes')
const jobRoutes = require('./routes/jobRoutes')
const imageRoutes = require('./routes/imageRoutes')
const messageRoutes = require('./routes/messageRoutes')
const aiRoutes = require('./routes/aiRoutes')
const adminRoutes = require('./routes/adminRoutes')
const inventoryRoutes = require('./routes/inventoryRoutes')
const supplierRoutes = require('./routes/supplierRoutes')
const financeRoutes = require('./routes/financeRoutes')

const app = express()

// Security: Restrict CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many AI requests from this IP, please try again after 15 minutes'
})
app.use(
  express.json({
    limit: '15mb',
  })
)
app.use(
  express.urlencoded({
    extended: true,
    limit: '15mb',
  })
)

app.get('/', (req, res) => {
  res.json({ message: 'AI Workshop Management System API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/images', imageRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/ai', aiLimiter, aiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/inventory', supplierRoutes)
app.use('/api/finance', financeRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
