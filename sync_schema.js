const fs = require('fs');
const path = require('path');
const pool = require('./server/config/db');

async function syncSchema() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('Schema synchronized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error synchronizing schema:', err);
    process.exit(1);
  }
}

syncSchema();
