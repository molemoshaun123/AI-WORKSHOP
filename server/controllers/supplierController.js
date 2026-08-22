const pool = require('../config/db')

// List all suppliers
const listSuppliers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.suppliers ORDER BY rating DESC, supplier_id')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load suppliers', error: error.message })
  }
}

// Compare prices for a specific part across all suppliers
const comparePrices = async (req, res) => {
  try {
    const { part_id } = req.params
    const result = await pool.query(
      `SELECT s.supplier_id, s.name, s.location, s.contact_phone, s.delivery_days_min,
              s.delivery_days_max, s.rating, s.color,
              sp.price, sp.in_stock, sp.last_updated,
              p.name AS part_name, p.sku, p.quantity AS current_stock, p.unit_price AS your_price
       FROM public.suppliers s
       LEFT JOIN public.supplier_parts sp ON sp.supplier_id = s.supplier_id AND sp.part_id = $1
       LEFT JOIN public.parts p ON p.part_id = $1
       ORDER BY sp.price ASC NULLS LAST`,
      [part_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to compare prices', error: error.message })
  }
}

// Place an order with a specific supplier
const orderFromSupplier = async (req, res) => {
  try {
    const { part_id, supplier_id, quantity, job_id, requested_by } = req.body
    if (!part_id || !supplier_id || !quantity) {
      return res.status(400).json({ message: 'part_id, supplier_id, and quantity are required' })
    }

    const result = await pool.query(
      `INSERT INTO public.part_orders (part_id, requested_by, job_id, quantity, supplier_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [part_id, requested_by || null, job_id || null, Number(quantity), supplier_id]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to create supplier order', error: error.message })
  }
}

// Get order history with supplier info
const listOrdersWithSuppliers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, p.name AS part_name, p.sku,
              u.full_name AS requested_by_name,
              s.name AS supplier_name, s.location AS supplier_location, s.color AS supplier_color
       FROM public.part_orders o
       JOIN public.parts p ON p.part_id = o.part_id
       LEFT JOIN public.users u ON u.user_id = o.requested_by
       LEFT JOIN public.suppliers s ON s.supplier_id = o.supplier_id
       ORDER BY o.created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load orders', error: error.message })
  }
}

module.exports = {
  listSuppliers,
  comparePrices,
  orderFromSupplier,
  listOrdersWithSuppliers,
}
