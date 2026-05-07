const pool = require('../config/db')

const listParts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.parts ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load parts', error: error.message })
  }
}

const createPart = async (req, res) => {
  try {
    const { name, sku, quantity, unit_price, reorder_level } = req.body
    const result = await pool.query(
      `INSERT INTO public.parts (name, sku, quantity, unit_price, reorder_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, sku || null, Number(quantity || 0), unit_price ?? null, Number(reorder_level || 0)]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to create part', error: error.message })
  }
}

const updatePartQuantity = async (req, res) => {
  try {
    const { part_id } = req.params
    const { quantity } = req.body
    const result = await pool.query(
      `UPDATE public.parts
       SET quantity = $1
       WHERE part_id = $2
       RETURNING *`,
      [Number(quantity), part_id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to update part', error: error.message })
  }
}

const listOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, p.name AS part_name, p.sku, u.full_name AS requested_by_name
       FROM public.part_orders o
       JOIN public.parts p ON p.part_id = o.part_id
       LEFT JOIN public.users u ON u.user_id = o.requested_by
       ORDER BY o.created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load orders', error: error.message })
  }
}

const createOrder = async (req, res) => {
  try {
    const { part_id, requested_by, job_id, quantity } = req.body
    const result = await pool.query(
      `INSERT INTO public.part_orders (part_id, requested_by, job_id, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [part_id, requested_by || null, job_id || null, Number(quantity)]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message })
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params
    const { status } = req.body
    const result = await pool.query(
      `UPDATE public.part_orders
       SET status = $1
       WHERE order_id = $2
       RETURNING *`,
      [status, order_id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order', error: error.message })
  }
}

const getReorderSuggestions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.part_id, p.name, p.sku, p.quantity, p.reorder_level, p.unit_price,
              GREATEST((COALESCE(p.reorder_level, 0) * 2) - p.quantity, 1) AS suggested_order_qty,
              COALESCE((
                SELECT SUM(o.quantity)
                FROM public.part_orders o
                WHERE o.part_id = p.part_id
                  AND o.status IN ('requested', 'approved', 'ordered')
              ), 0) AS open_order_qty
       FROM public.parts p
       WHERE p.quantity <= COALESCE(p.reorder_level, 0)
       ORDER BY (p.quantity - COALESCE(p.reorder_level, 0)) ASC, p.created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load reorder suggestions', error: error.message })
  }
}

module.exports = {
  listParts,
  createPart,
  updatePartQuantity,
  listOrders,
  createOrder,
  updateOrderStatus,
  getReorderSuggestions,
}
