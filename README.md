# AI Workshop Management System

This web app helps an auto workshop manage customers, vehicles, service jobs, inventory, and communication in one place.

## What the web app does

- Lets customers register, log in, add vehicle details, request service, and view estimates.
- Lets admins manage jobs, customers, and inventory from a dashboard.
- Provides AI-assisted tools for fault diagnosis, damage triage, parts compatibility checks, cost estimation, smart scheduling, and message/job summarization.
- Supports inbox-style communication between workshop staff and users.
- Exposes backend APIs for auth, vehicles, jobs, images, messages, admin actions, AI tools, and inventory.

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT + bcrypt

## Run locally

1. Install dependencies:
   - `npm install`
   - `npm run install-client`
2. Configure `.env` with your database and API keys.
3. Start full app:
   - `npm run dev`
NB REMEMBER TO CREATE ENV FILE
