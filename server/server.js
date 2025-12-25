require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const authRoute = require('./routes/auth');
const projectRoute = require('./routes/projects');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/projects', projectRoute);

// Database Connection
/*console.log(
    process.env.DB_USER,
    process.env.DB_HOST,
    process.env.DB_NAME,
    process.env.DB_PASSWORD,
    process.env.DB_PORT,
)*/

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

// Basic Route
app.get('/', (req, res) => {
    res.send('Script-to-Storyboard API Running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
