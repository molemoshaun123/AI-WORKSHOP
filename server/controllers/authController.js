const pool = require('../config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
require('dotenv').config()

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()
const normalizePhone = (phone) => String(phone || '').trim()
const NAME_REGEX = /^(?=.*[A-Za-z])[A-Za-z][A-Za-z\s'-]*$/
const SA_PHONE_REGEX = /^0\d{9}$/
const EMAIL_LETTER_REGEX = /[A-Za-z]/
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/
const normalizeName = (name) => String(name || '').toLowerCase().replace(/[^a-z]/g, '')

const validateRegistrationFields = ({ full_name, email, phone, password }) => {
  const cleanName = String(full_name || '').trim()
  const normalizedEmail = normalizeEmail(email)
  const cleanPhone = normalizePhone(phone)
  const cleanPassword = String(password || '')

  if (!cleanName || !normalizedEmail || !cleanPassword) {
    return { error: 'Full name, email, and password are required' }
  }
  if (!NAME_REGEX.test(cleanName)) {
    return { error: 'Full name must contain letters only (no numbers)' }
  }
  if (!EMAIL_LETTER_REGEX.test(normalizedEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Enter a valid email address' }
  }
  if (cleanPhone && !SA_PHONE_REGEX.test(cleanPhone)) {
    return { error: 'Phone number must be a valid South African 10-digit number (e.g. 0821234567)' }
  }
  if (!STRONG_PASSWORD_REGEX.test(cleanPassword)) {
    return { error: 'Password must be at least 6 characters and include a letter, number, and special character' }
  }
  if (normalizeName(cleanPassword) && normalizeName(cleanPassword) === normalizeName(cleanName)) {
    return { error: 'Password must not be the same as your name' }
  }

  return { cleanName, normalizedEmail, cleanPhone, cleanPassword }
}

const getMailTransport = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD,
    },
  })

const registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, pin } = req.body
    const validated = validateRegistrationFields({ full_name, email, phone, password })
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }
    const { cleanName, normalizedEmail, cleanPhone } = validated

    const existing = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, pin, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, full_name, email, phone, role`,
      [cleanName, normalizedEmail, cleanPhone || null, hashedPassword, pin || null, 'user']
    )

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0],
    })
  } catch (error) {
    console.error('Register user error:', error.message)
    res.status(500).json({ message: 'Registration failed', error: error.message })
  }
}

const registerAdmin = async (req, res) => {
  try {
    const { full_name, email, phone, password, pin } = req.body
    const validated = validateRegistrationFields({ full_name, email, phone, password })
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }
    const { cleanName, normalizedEmail, cleanPhone } = validated

    const existing = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, pin, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, full_name, email, phone, role`,
      [cleanName, normalizedEmail, cleanPhone || null, hashedPassword, pin || null, 'admin']
    )

    res.status(201).json({
      message: 'Admin registered successfully',
      user: result.rows[0],
    })
  } catch (error) {
    console.error('Register admin error:', error.message)
    res.status(500).json({ message: 'Registration failed', error: error.message })
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = normalizeEmail(email)
    const cleanPassword = String(password || '')

    if (!normalizedEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = result.rows[0]
    
    // Check if user is trying to log in as user but is actually an admin
    if (user.role !== 'user') {
      return res.status(403).json({ message: 'This account is registered as an Admin. Please use the Admin login page.' })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login user error:', error.message)
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
}

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = normalizeEmail(email)
    const cleanPassword = String(password || '')

    if (!normalizedEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const admin = result.rows[0]

    // Check if admin is trying to log in as admin but is actually a user
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'This account is registered as a regular User. Please use the User login page.' })
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash)

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { user_id: admin.user_id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        user_id: admin.user_id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Login admin error:', error.message)
    res.status(500).json({ message: 'Admin login failed', error: error.message })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email)
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address' })
    }

    const result = await pool.query('SELECT user_id, email, full_name FROM users WHERE LOWER(email) = LOWER($1)', [
      normalizedEmail,
    ])

    if (result.rows.length === 0) {
      return res.json({
        message: 'If this email exists, a password reset link has been sent.',
      })
    }

    const user = result.rows[0]
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await pool.query(
      `UPDATE users
       SET password_reset_token = $1, password_reset_expires = $2
       WHERE user_id = $3`,
      [resetTokenHash, expiresAt, user.user_id]
    )

    const appUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const resetLink = `${appUrl}/reset-password/${resetToken}`

    if (process.env.MAIL_USER && process.env.MAIL_APP_PASSWORD) {
      const transporter = getMailTransport()
      await transporter.sendMail({
        from: `"AI Workshop System" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: 'Reset your AI Workshop password',
        html: `<p>Hello ${user.full_name || 'there'},</p>
               <p>Click the link below to reset your password. This link expires in 1 hour.</p>
               <p><a href="${resetLink}">${resetLink}</a></p>`,
      })
    } else {
      console.warn('MAIL_USER or MAIL_APP_PASSWORD not set. Reset link:', resetLink)
    }

    return res.json({
      message: 'If this email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error.message)
    return res.status(500).json({ message: 'Failed to process forgot password request' })
  }
}

const resetPassword = async (req, res) => {
  try {
    const token = String(req.params?.token || '').trim()
    const newPassword = String(req.body?.password || '')

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const result = await pool.query(
      `SELECT user_id, full_name FROM users
       WHERE password_reset_token = $1
       AND password_reset_expires > NOW()`,
      [tokenHash]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Reset token is invalid or expired' })
    }

    const userId = result.rows[0].user_id
    const fullName = result.rows[0].full_name
    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters and include a letter, number, and special character',
      })
    }
    if (normalizeName(newPassword) && normalizeName(newPassword) === normalizeName(fullName)) {
      return res.status(400).json({ message: 'Password must not be the same as your name' })
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL
       WHERE user_id = $2`,
      [hashedPassword, userId]
    )

    return res.json({ message: 'Password reset successful. You can now log in.' })
  } catch (error) {
    console.error('Reset password error:', error.message)
    return res.status(500).json({ message: 'Failed to reset password' })
  }
}

module.exports = { registerUser, registerAdmin, loginUser, loginAdmin, forgotPassword, resetPassword, updateProfile, changePassword }

async function updateProfile(req, res) {
  try {
    const { user_id } = req.params
    const { full_name, phone, email } = req.body

    const updates = []
    const values = []
    let idx = 1

    if (full_name) {
      const cleanName = String(full_name).trim()
      if (!NAME_REGEX.test(cleanName)) {
        return res.status(400).json({ message: 'Full name must contain letters only' })
      }
      updates.push(`full_name = $${idx++}`)
      values.push(cleanName)
    }

    if (phone) {
      const cleanPhone = normalizePhone(phone)
      if (cleanPhone && !SA_PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({ message: 'Phone must be a valid SA 10-digit number' })
      }
      updates.push(`phone = $${idx++}`)
      values.push(cleanPhone || null)
    }

    if (email) {
      const normalizedEmail = normalizeEmail(email)
      if (!EMAIL_LETTER_REGEX.test(normalizedEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Enter a valid email address' })
      }
      // Check unique
      const existing = await pool.query(
        'SELECT user_id FROM users WHERE LOWER(email) = LOWER($1) AND user_id != $2',
        [normalizedEmail, user_id]
      )
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email is already in use' })
      }
      updates.push(`email = $${idx++}`)
      values.push(normalizedEmail)
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    values.push(user_id)
    const result = await pool.query(
      `UPDATE public.users SET ${updates.join(', ')} WHERE user_id = $${idx} RETURNING user_id, full_name, email, phone, role`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ message: 'Profile updated', user: result.rows[0] })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message })
  }
}

async function changePassword(req, res) {
  try {
    const { user_id } = req.params
    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current and new password are required' })
    }

    const userResult = await pool.query('SELECT password_hash, full_name FROM users WHERE user_id = $1', [user_id])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    if (!STRONG_PASSWORD_REGEX.test(new_password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters and include a letter, number, and special character' })
    }

    if (normalizeName(new_password) && normalizeName(new_password) === normalizeName(userResult.rows[0].full_name)) {
      return res.status(400).json({ message: 'Password must not be the same as your name' })
    }

    const hashedPassword = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hashedPassword, user_id])

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message })
  }
}
