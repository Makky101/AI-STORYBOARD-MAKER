// ============================================================================
// SERVER.JS - Main Express Server Configuration
// ============================================================================
// This file sets up and starts the Express web server for the application.
// It configures middleware, routes, and database connections.

// ----------------------------------------------------------------------------
// STEP 1: Load Environment Variables
// ----------------------------------------------------------------------------
// We use dotenv to load secret values (like API keys) from a .env file.
// This must be done FIRST before any other imports that might need these values.
import dotenv from 'dotenv';
dotenv.config(); // This reads the .env file and makes variables available via process.env

// ----------------------------------------------------------------------------
// STEP 2: Import Required Packages
// ----------------------------------------------------------------------------
// Express: The web framework that handles HTTP requests and responses
import express from 'express';

// CORS: Allows our frontend (running on a different port) to make requests to this server
import cors from 'cors';

// Helmet: Adds security headers to HTTP responses to protect against common attacks
import helmet from 'helmet';

// ----------------------------------------------------------------------------
// STEP 3: Import Our Custom Route Handlers
// ----------------------------------------------------------------------------
// These files contain the logic for handling different API endpoints
import authRoute from './routes/auth.js';      // Handles /api/auth/* (login, register)
import projectRoute from './routes/projects.js'; // Handles /api/projects/* (CRUD operations)

// ----------------------------------------------------------------------------
// STEP 4: Create the Express Application
// ----------------------------------------------------------------------------
// This creates our main server application object
const app = express();

// Define which port the server will listen on
// If PORT is set in .env, use that. Otherwise, default to 5000
const PORT = process.env.PORT || 5000;

// ----------------------------------------------------------------------------
// STEP 5: Configure Middleware (in order of execution)
// ----------------------------------------------------------------------------
// Middleware are functions that process requests before they reach our routes.
// They execute in the order they are added.

// 5a. Security Headers
// Helmet adds various HTTP headers to protect against attacks
app.use(helmet());

// 5b. CORS (Cross-Origin Resource Sharing)
// This allows our React frontend to make requests to this server
app.use(cors({
    // Which domains are allowed to make requests to this server
    // If CLIENT_URL is set in .env, use that. Otherwise, allow all origins (*)
    origin: process.env.CLIENT_URL || '*',

    // Which HTTP methods are allowed
    methods: ['GET', 'POST', 'PUT', 'DELETE'],

    // Which headers the frontend is allowed to send
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 5c. JSON Body Parser
// This allows us to read JSON data from request bodies
// Without this, req.body would be undefined
app.use(express.json());

// ----------------------------------------------------------------------------
// STEP 6: Register API Routes
// ----------------------------------------------------------------------------
// When a request comes in, Express checks these routes in order.
// If the URL starts with the specified path, it forwards the request to that router.

// All authentication endpoints (login, register, etc.)
app.use('/api/auth', authRoute);

// All project-related endpoints (create, read, update, delete projects)
app.use('/api/projects', projectRoute);

// ----------------------------------------------------------------------------
// STEP 7: Database Connection
// ----------------------------------------------------------------------------
// The database connection is managed by the pool in db.js
// We don't need to explicitly connect here - the pool handles it automatically
// when queries are made

// ----------------------------------------------------------------------------
// STEP 8: Basic Health Check Route
// ----------------------------------------------------------------------------
// This is a simple endpoint to verify the server is running
// Visit http://localhost:5000/ in your browser to see this message
app.get('/', (req, res) => {
    res.send('Script-to-Storyboard API Running');
});

// ----------------------------------------------------------------------------
// STEP 9: Start the Server
// ----------------------------------------------------------------------------
// This tells Express to start listening for incoming HTTP requests
app.listen(PORT, () => {
    // This message is printed to the console when the server successfully starts
    console.log(`Server running on port ${PORT}`);
});
