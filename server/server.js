import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';


import authRoute from './routes/auth.js';
import projectRoute from './routes/projects.js';

const app = express();
const PORT = process.env.PORT || 5000;

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



// Basic Route
app.get('/', (req, res) => {
    res.send('Script-to-Storyboard API Running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
