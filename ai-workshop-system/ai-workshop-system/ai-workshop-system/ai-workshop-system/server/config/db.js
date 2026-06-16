const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Necessary for Render cloud databases
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
      }
);

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
          CONSTRAINT job_status_history_pkey PRIMARY KEY (history_id),
          CONSTRAINT fk_history_job FOREIGN KEY (job_id) REFERENCES public.jobs (job_id) ON DELETE CASCADE,
          CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES public.users (user_id) ON DELETE SET NULL
      )`
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
  })
  .catch((err) => console.error("Database connection error:", err.message));

module.exports = pool;
