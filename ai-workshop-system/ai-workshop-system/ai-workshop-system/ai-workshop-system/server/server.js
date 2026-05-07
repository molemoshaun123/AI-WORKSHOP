const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const vehicleRoutes = require('./routes/vehicleRoutes')
const jobRoutes = require('./routes/jobRoutes')
const imageRoutes = require('./routes/imageRoutes')
const messageRoutes = require('./routes/messageRoutes')
const aiRoutes = require('./routes/aiRoutes')
const adminRoutes = require('./routes/adminRoutes')
const inventoryRoutes = require('./routes/inventoryRoutes')

const app = express()

app.use(cors())
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
app.use('/api/ai', aiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/inventory', inventoryRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

