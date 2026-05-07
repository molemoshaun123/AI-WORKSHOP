-- AI Workshop System PostgreSQL Schema

-- Users Table
CREATE TABLE IF NOT EXISTS public.users 
( 
    user_id serial NOT NULL, 
    full_name character varying(150) COLLATE pg_catalog."default" NOT NULL, 
    email character varying(150) COLLATE pg_catalog."default" NOT NULL, 
    phone character varying(20) COLLATE pg_catalog."default", 
    password_hash text COLLATE pg_catalog."default" NOT NULL, 
    pin character varying(10) COLLATE pg_catalog."default", -- Added PIN field
    password_reset_token text COLLATE pg_catalog."default",
    password_reset_expires timestamp without time zone,
    role character varying(20) COLLATE pg_catalog."default" NOT NULL, 
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT users_pkey PRIMARY KEY (user_id), 
    CONSTRAINT users_email_key UNIQUE (email) 
); 

-- Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles 
( 
    vehicle_id serial NOT NULL, 
    user_id integer NOT NULL, 
    make character varying(100) COLLATE pg_catalog."default" NOT NULL, 
    model character varying(100) COLLATE pg_catalog."default" NOT NULL, 
    year integer, 
    registration_number character varying(50) COLLATE pg_catalog."default", 
    vin character varying(100) COLLATE pg_catalog."default", 
    color character varying(50) COLLATE pg_catalog."default", 
    mileage integer, 
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id), 
    CONSTRAINT vehicles_registration_number_key UNIQUE (registration_number),
    CONSTRAINT fk_vehicle_user FOREIGN KEY (user_id) REFERENCES public.users (user_id) ON DELETE CASCADE
); 

-- Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs 
( 
    job_id serial NOT NULL, 
    user_id integer NOT NULL, 
    vehicle_id integer NOT NULL, 
    assigned_admin_id integer, 
    title character varying(150) COLLATE pg_catalog."default" NOT NULL, 
    symptoms text COLLATE pg_catalog."default" NOT NULL, 
    status character varying(30) COLLATE pg_catalog."default" NOT NULL DEFAULT 'pending'::character varying, 
    priority character varying(20) COLLATE pg_catalog."default" DEFAULT 'normal'::character varying, 
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, 
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT jobs_pkey PRIMARY KEY (job_id),
    CONSTRAINT fk_job_user FOREIGN KEY (user_id) REFERENCES public.users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_job_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicles (vehicle_id) ON DELETE CASCADE,
    CONSTRAINT fk_job_admin FOREIGN KEY (assigned_admin_id) REFERENCES public.users (user_id) ON DELETE SET NULL
); 

-- AI Diagnosis Table
CREATE TABLE IF NOT EXISTS public.ai_diagnosis 
( 
    diagnosis_id serial NOT NULL, 
    job_id integer NOT NULL, 
    symptoms_input text COLLATE pg_catalog."default" NOT NULL, 
    predicted_problem text COLLATE pg_catalog."default", 
    confidence_score numeric(5, 2), 
    recommendation text COLLATE pg_catalog."default", 
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT ai_diagnosis_pkey PRIMARY KEY (diagnosis_id),
    CONSTRAINT fk_diagnosis_job FOREIGN KEY (job_id) REFERENCES public.jobs (job_id) ON DELETE CASCADE
); 

-- Image Analysis Table
CREATE TABLE IF NOT EXISTS public.image_analysis 
( 
    analysis_id serial NOT NULL, 
    job_id integer NOT NULL, 
    image_type character varying(30) COLLATE pg_catalog."default" NOT NULL, 
    image_url text COLLATE pg_catalog."default", 
    result_label character varying(100) COLLATE pg_catalog."default", 
    confidence_score numeric(5, 2), 
    notes text COLLATE pg_catalog."default", 
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT image_analysis_pkey PRIMARY KEY (analysis_id),
    CONSTRAINT fk_analysis_job FOREIGN KEY (job_id) REFERENCES public.jobs (job_id) ON DELETE CASCADE
); 

-- Job Status History Table
CREATE TABLE IF NOT EXISTS public.job_status_history 
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
); 

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages
(
    message_id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES public.jobs(job_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
