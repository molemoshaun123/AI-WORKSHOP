const pool = require('../config/db')

const generateQuote = async (req, res) => {
  try {
    const { job_id, amount, items } = req.body
    if (!job_id || amount == null) return res.status(400).json({ message: 'job_id and amount are required' })

    const result = await pool.query(
      `INSERT INTO public.quotes (job_id, amount, status) VALUES ($1, $2, 'pending') RETURNING *`,
      [job_id, amount]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate quote', error: error.message })
  }
}

const updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const result = await pool.query(
      `UPDATE public.quotes SET status = $1 WHERE quote_id = $2 RETURNING *`,
      [status, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Quote not found' })
    
    // If quote is approved, add a timeline event
    if (status === 'approved') {
      const quote = result.rows[0];
      await pool.query(
        `INSERT INTO public.job_status_history (job_id, status, changed_by, notes)
         VALUES ($1, $2, $3, $4)`,
        [quote.job_id, 'quote_approved', null, 'Customer approved the quote. Job is ready for AI assessment.']
      )
    }
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quote', error: error.message })
  }
}

const generateInvoice = async (req, res) => {
  try {
    const { job_id, amount, items } = req.body
    if (!job_id || amount == null) return res.status(400).json({ message: 'job_id and amount are required' })

    const result = await pool.query(
      `INSERT INTO public.invoices (job_id, amount, status) VALUES ($1, $2, 'unpaid') RETURNING *`,
      [job_id, amount]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate invoice', error: error.message })
  }
}

const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const result = await pool.query(
      `UPDATE public.invoices SET status = $1 WHERE invoice_id = $2 RETURNING *`,
      [status, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Invoice not found' })
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to update invoice', error: error.message })
  }
}

const getFinancesForJob = async (req, res) => {
  try {
    const { job_id } = req.params
    const quotes = await pool.query('SELECT * FROM public.quotes WHERE job_id = $1 ORDER BY created_at DESC', [job_id])
    const invoices = await pool.query('SELECT * FROM public.invoices WHERE job_id = $1 ORDER BY created_at DESC', [job_id])
    res.json({ quotes: quotes.rows, invoices: invoices.rows })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch finances', error: error.message })
  }
}

// To make things easier for UserDashboard, let's add a function to get all pending quotes and unpaid invoices for a user
const getUserActionItems = async (req, res) => {
  try {
    const { user_id } = req.params
    const quotes = await pool.query(
      `SELECT q.*, j.title FROM public.quotes q
       JOIN public.jobs j ON j.job_id = q.job_id
       WHERE j.user_id = $1 AND q.status = 'pending' ORDER BY q.created_at DESC`,
      [user_id]
    )
    const invoices = await pool.query(
      `SELECT i.*, j.title FROM public.invoices i
       JOIN public.jobs j ON j.job_id = i.job_id
       WHERE j.user_id = $1 AND i.status = 'unpaid' ORDER BY i.created_at DESC`,
      [user_id]
    )
    const unreadMessages = await pool.query(
      'SELECT COUNT(*)::int AS total FROM public.messages WHERE receiver_id = $1 AND is_read = FALSE',
      [user_id]
    )
    res.json({ pendingQuotes: quotes.rows, unpaidInvoices: invoices.rows, unreadMessages: unreadMessages.rows[0].total })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch action items', error: error.message })
  }
}

module.exports = {
  generateQuote,
  updateQuoteStatus,
  generateInvoice,
  updateInvoiceStatus,
  getFinancesForJob,
  getUserActionItems
}
