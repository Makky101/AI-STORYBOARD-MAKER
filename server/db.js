// ============================================================================
// DB.JS - Database Connection Pool
// ============================================================================
// This file creates and exports a PostgreSQL database connection pool.
// A "pool" is a collection of database connections that can be reused,
// which is much more efficient than creating a new connection for every query.

// ----------------------------------------------------------------------------
// STEP 1: Import Required Packages
// ----------------------------------------------------------------------------
// pg: The PostgreSQL client library for Node.js
import pg from 'pg';

// dotenv: Loads environment variables from .env file
import dotenv from 'dotenv';

// ----------------------------------------------------------------------------
// STEP 2: Load Environment Variables
// ----------------------------------------------------------------------------
// Read the .env file to get database credentials
dotenv.config();

// ----------------------------------------------------------------------------
// STEP 3: Extract the Pool Class
// ----------------------------------------------------------------------------
// The pg package exports a Pool class that we'll use to create our connection pool
const { Pool } = pg;

// ----------------------------------------------------------------------------
// STEP 4: Create the Connection Pool
// ----------------------------------------------------------------------------
// A connection pool maintains multiple database connections that can be reused.
// This is much faster than opening a new connection for every query.
//
// How it works:
// 1. When you run a query, the pool gives you an available connection
// 2. After the query finishes, the connection is returned to the pool
// 3. The next query can reuse that same connection
//
// Benefits:
// - Faster: No need to reconnect to the database for every query
// - Efficient: Limits the number of simultaneous connections
// - Automatic: The pool handles connection management for us

const pool = new Pool({
    // Database username (from .env file)
    user: process.env.DB_USER,

    // Database server address (usually 'localhost' for local development)
    host: process.env.DB_HOST,

    // Name of the specific database to connect to
    database: process.env.DB_NAME,

    // Password for the database user (from .env file)
    password: process.env.DB_PASSWORD,

    // Port number the PostgreSQL server is listening on (usually 5432)
    port: process.env.DB_PORT,

    // SSL/TLS Configuration for Production Databases
    // Many cloud database providers (like Render, Heroku, AWS RDS) require SSL connections
    ssl: process.env.NODE_ENV === 'production'
        ? {
            // rejectUnauthorized: false allows connections even if the SSL certificate
            // cannot be verified. This is common for cloud databases with self-signed certs.
            // In production, this is generally safe because:
            // 1. The connection is still encrypted
            // 2. Cloud providers manage their own certificates
            // 3. You're connecting via a trusted connection string
            rejectUnauthorized: false
        }
        : false // No SSL for local development
});

// ----------------------------------------------------------------------------
// STEP 5: Export the Query Function
// ----------------------------------------------------------------------------
// We export a simple function that other files can use to run database queries.
//
// Usage example:
//   import { query } from './db.js';
//   const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
//
// Parameters:
//   - text: The SQL query string (use $1, $2, etc. for parameters)
//   - params: An array of values to safely insert into the query
//
// The pool.query() method:
//   1. Gets an available connection from the pool
//   2. Runs the query with the provided parameters
//   3. Returns the connection to the pool
//   4. Returns the query results

export const query = (text, params) => pool.query(text, params);

// Note: We use parameterized queries ($1, $2, etc.) instead of string concatenation
// to prevent SQL injection attacks. Never do: `SELECT * FROM users WHERE id = ${userId}`
// Always do: query('SELECT * FROM users WHERE id = $1', [userId])
