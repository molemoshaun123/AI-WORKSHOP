const { Pool } = require("pg");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
  // Use full connection string (works perfectly with Neon + channel_binding)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  // Fallback to individual parameters (for local development)
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD || "",
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
  });
}

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

pool
  .connect()
  .then(async () => {
    console.log("PostgreSQL connected successfully")
    await pool.query(
      'ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS pin character varying(10)'
    )
    await pool.query(
      `ALTER TABLE IF EXISTS public.users
        ADD COLUMN IF NOT EXISTS password_reset_token text,
        ADD COLUMN IF NOT EXISTS password_reset_expires timestamp without time zone`
    )
    await pool.query(
      `ALTER TABLE IF EXISTS public.jobs
        ADD COLUMN IF NOT EXISTS appointment_date timestamp without time zone,
        ADD COLUMN IF NOT EXISTS estimated_hours numeric(6, 2),
        ADD COLUMN IF NOT EXISTS estimated_days numeric(6, 2),
        ADD COLUMN IF NOT EXISTS mechanic_id integer,
        ADD COLUMN IF NOT EXISTS predicted_completion timestamp without time zone,
        ADD COLUMN IF NOT EXISTS scheduled_rank integer`
    )
    await pool.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'fk_jobs_mechanic'
         ) THEN
           ALTER TABLE public.jobs
           ADD CONSTRAINT fk_jobs_mechanic
           FOREIGN KEY (mechanic_id)
           REFERENCES public.users(user_id)
           ON DELETE SET NULL;
         END IF;
       END $$`
    )
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.job_status_history
      (
          history_id serial NOT NULL,
          job_id integer NOT NULL,
          status character varying(30) COLLATE pg_catalog."default" NOT NULL,
          changed_by integer,
          changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          notes text COLLATE pg_catalog."default",
          image_url text,
          CONSTRAINT job_status_history_pkey PRIMARY KEY (history_id),
          CONSTRAINT fk_history_job FOREIGN KEY (job_id) REFERENCES public.jobs (job_id) ON DELETE CASCADE,
          CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES public.users (user_id) ON DELETE SET NULL
      )`
    )
    await pool.query(
      `ALTER TABLE IF EXISTS public.job_status_history
       ADD COLUMN IF NOT EXISTS image_url text`
    )
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.messages
      (
          message_id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
          receiver_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
          job_id INTEGER REFERENCES public.jobs(job_id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.parts
      (
          part_id SERIAL PRIMARY KEY,
          name character varying(150) NOT NULL,
          sku character varying(60),
          quantity integer NOT NULL DEFAULT 0,
          unit_price numeric(10, 2),
          reorder_level integer DEFAULT 0,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.part_orders
      (
          order_id SERIAL PRIMARY KEY,
          part_id integer NOT NULL REFERENCES public.parts(part_id) ON DELETE CASCADE,
          requested_by integer REFERENCES public.users(user_id) ON DELETE SET NULL,
          job_id integer REFERENCES public.jobs(job_id) ON DELETE SET NULL,
          quantity integer NOT NULL,
          status character varying(30) NOT NULL DEFAULT 'requested',
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      )`
    )
    // ── Suppliers tables ──
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.suppliers
      (
          supplier_id SERIAL PRIMARY KEY,
          name character varying(150) NOT NULL,
          location character varying(200) NOT NULL,
          contact_phone character varying(30),
          delivery_days_min integer DEFAULT 1,
          delivery_days_max integer DEFAULT 3,
          rating numeric(2, 1) DEFAULT 4.0,
          color character varying(20) DEFAULT '#06b6d4',
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.supplier_parts
      (
          supplier_part_id SERIAL PRIMARY KEY,
          supplier_id integer NOT NULL REFERENCES public.suppliers(supplier_id) ON DELETE CASCADE,
          part_id integer NOT NULL REFERENCES public.parts(part_id) ON DELETE CASCADE,
          price numeric(10, 2) NOT NULL,
          in_stock boolean DEFAULT true,
          last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      )`
    )
    await pool.query(
      `ALTER TABLE IF EXISTS public.part_orders
       ADD COLUMN IF NOT EXISTS supplier_id integer REFERENCES public.suppliers(supplier_id) ON DELETE SET NULL`
    )

    // ── Enterprise Quotes & Invoices ──
    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.quotes
      (
          quote_id SERIAL PRIMARY KEY,
          job_id integer NOT NULL REFERENCES public.jobs(job_id) ON DELETE CASCADE,
          amount numeric(10, 2) NOT NULL,
          status character varying(30) DEFAULT 'pending',
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      )`
    )

    await pool.query(
      `CREATE TABLE IF NOT EXISTS public.invoices
      (
          invoice_id SERIAL PRIMARY KEY,
          job_id integer NOT NULL REFERENCES public.jobs(job_id) ON DELETE CASCADE,
          amount numeric(10, 2) NOT NULL,
          status character varying(30) DEFAULT 'unpaid',
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      )`
    )

    // ── Seed 5 suppliers if empty ──
    const suppCount = await pool.query('SELECT COUNT(*) FROM public.suppliers')
    if (Number(suppCount.rows[0].count) === 0) {
      const suppliers = [
        { name: 'Midas Pretoria Central', location: 'Pretoria CBD, Gauteng', phone: '012 322 1100', dmin: 1, dmax: 2, rating: 4.5, color: '#ef4444' },
        { name: 'AutoZone Centurion', location: 'Centurion Mall, Gauteng', phone: '012 663 4400', dmin: 2, dmax: 3, rating: 4.2, color: '#3b82f6' },
        { name: 'Goldwagen Midrand', location: 'Midrand, Gauteng', phone: '011 312 0800', dmin: 1, dmax: 3, rating: 4.7, color: '#22c55e' },
        { name: 'Parts World Sandton', location: 'Sandton City, Gauteng', phone: '011 784 9900', dmin: 2, dmax: 4, rating: 4.0, color: '#f97316' },
        { name: 'Township Auto Soshanguve', location: 'Soshanguve Block H, Gauteng', phone: '012 799 5500', dmin: 3, dmax: 5, rating: 3.8, color: '#a855f7' },
      ]
      for (const s of suppliers) {
        await pool.query(
          `INSERT INTO public.suppliers (name, location, contact_phone, delivery_days_min, delivery_days_max, rating, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [s.name, s.location, s.phone, s.dmin, s.dmax, s.rating, s.color]
        )
      }
      console.log('Seeded 5 suppliers')

      // Seed supplier_parts pricing for all existing parts
      const partsRes = await pool.query('SELECT part_id, unit_price FROM public.parts')
      const suppRes = await pool.query('SELECT supplier_id FROM public.suppliers ORDER BY supplier_id')
      const priceMultipliers = [1.0, 0.92, 1.08, 1.15, 0.78] // different pricing per shop
      const stockChance = [true, true, true, true, true] // in_stock defaults

      for (const part of partsRes.rows) {
        const basePrice = Number(part.unit_price) || 100
        for (let i = 0; i < suppRes.rows.length; i++) {
          const suppId = suppRes.rows[i].supplier_id
          const price = Math.round(basePrice * priceMultipliers[i] * 100) / 100
          // Make one or two shops occasionally out of stock for realism
          const inStock = !(i === 3 && basePrice > 200) && !(i === 4 && basePrice > 500)
          await pool.query(
            `INSERT INTO public.supplier_parts (supplier_id, part_id, price, in_stock)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [suppId, part.part_id, price, inStock]
          )
        }
      }
      console.log('Seeded supplier part pricing')
    }
  })
  .catch((err) => console.error("Database connection error:", err.message));

module.exports = pool;
