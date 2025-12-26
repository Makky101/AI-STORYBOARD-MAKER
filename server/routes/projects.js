// ============================================================================
// PROJECTS.JS - Project Management Routes
// ============================================================================
// This file defines all the API endpoints for managing storyboard projects.
// It handles creating, reading, updating, and deleting projects and their scenes.

// ----------------------------------------------------------------------------
// STEP 1: Import Required Packages and Modules
// ----------------------------------------------------------------------------
// Express Router: Allows us to define routes in a modular way
import express from 'express';

// Database query function: For running SQL queries
import * as db from '../db.js';

// Authentication middleware: Verifies the user is logged in
import auth from '../middleware/authMiddleware.js';

// AI service functions: For generating scripts and images
import { generateScript, generateImage } from '../services/aiService.js';

// Rate limiting middleware: Prevents abuse by limiting requests
import { apiLimiter, aiLimiter } from '../middleware/rateLimiter.js';

// ----------------------------------------------------------------------------
// STEP 2: Create Router Instance
// ----------------------------------------------------------------------------
// This router will handle all routes starting with /api/projects
const router = express.Router();

// ----------------------------------------------------------------------------
// STEP 3: Apply Rate Limiting to All Routes
// ----------------------------------------------------------------------------
// This limits how many requests a user can make to prevent abuse
// The apiLimiter is applied to ALL routes in this file
router.use(apiLimiter);

// ============================================================================
// ROUTE 1: GET /api/projects
// ============================================================================
// Purpose: Get all projects belonging to the logged-in user
// Method: GET
// Authentication: Required (auth middleware)
// Returns: Array of project objects

router.get('/', auth, async (req, res) => {
    try {
        // --------------------------------------------------------------------
        // Step 1.1: Query the database for user's projects
        // --------------------------------------------------------------------
        // req.user.id comes from the auth middleware after verifying the JWT token
        // We select all projects where user_id matches the logged-in user
        // ORDER BY created_at DESC means newest projects first
        const result = await db.query(
            'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );

        // --------------------------------------------------------------------
        // Step 1.2: Send the projects back to the client
        // --------------------------------------------------------------------
        // result.rows contains an array of project objects
        res.json(result.rows);

    } catch (err) {
        // If anything goes wrong (database error, etc.), log it and send error response
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ============================================================================
// ROUTE 2: POST /api/projects
// ============================================================================
// Purpose: Create a new project and generate its script using AI
// Method: POST
// Authentication: Required (auth middleware)
// Rate Limiting: AI limiter (stricter than normal API limiter)
// Body: { title: string, input: string }
// Returns: { project: object, scenes: array }

router.post('/', auth, aiLimiter, async (req, res) => {
    try {
        // --------------------------------------------------------------------
        // Step 2.1: Extract data from request body
        // --------------------------------------------------------------------
        // The client sends us a title and the user's movie idea
        const { title, input } = req.body;

        // --------------------------------------------------------------------
        // Step 2.2: Create the project in the database
        // --------------------------------------------------------------------
        // INSERT a new row into the projects table
        // RETURNING * means we get back the newly created project (including its ID)
        const projectResult = await db.query(
            'INSERT INTO projects (user_id, title, original_input) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, title, input]
        );

        // Extract the project object from the query result
        const project = projectResult.rows[0];

        // --------------------------------------------------------------------
        // Step 2.3: Generate the script using AI
        // --------------------------------------------------------------------
        // This calls the Gemini API to convert the user's idea into structured scenes
        // scenesData will be an array of scene objects
        const scenesData = await generateScript(input);

        // --------------------------------------------------------------------
        // Step 2.4: Save all scenes to the database
        // --------------------------------------------------------------------
        // For each scene in the generated script, we need to save it to the database
        // We use map() to create an array of database query promises
        const scenePromises = scenesData.map(scene => {
            // Insert each scene into the scenes table
            // We link it to the project using project.id
            return db.query(
                'INSERT INTO scenes (project_id, scene_number, title, location, description, action, mood, image_prompt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [
                    project.id,           // Link to the project we just created
                    scene.scene_number,   // Scene order (1, 2, 3, etc.)
                    scene.title,          // Scene title
                    scene.location,       // Where it takes place
                    scene.description,    // Visual description
                    scene.action,         // What happens
                    scene.mood,           // Emotional tone
                    scene.image_prompt    // Detailed prompt for image generation
                ]
            );
        });

        // Wait for all scene insertions to complete
        // Promise.all() runs them in parallel for speed
        await Promise.all(scenePromises);

        // --------------------------------------------------------------------
        // Step 2.5: Send response back to client
        // --------------------------------------------------------------------
        // Return both the project and the scenes
        res.json({ project, scenes: scenesData });

    } catch (err) {
        // If anything fails (AI error, database error, etc.), log and send error
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ============================================================================
// ROUTE 3: GET /api/projects/:id
// ============================================================================
// Purpose: Get a single project with all its scenes
// Method: GET
// Authentication: Required (auth middleware)
// URL Parameter: id (the project ID)
// Returns: { project: object, scenes: array }

router.get('/:id', auth, async (req, res) => {
    try {
        // --------------------------------------------------------------------
        // Step 3.1: Get the project from the database
        // --------------------------------------------------------------------
        // req.params.id comes from the URL (e.g., /api/projects/123)
        // We check both that the project exists AND that it belongs to this user
        const project = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        // If no project found, send 404 error
        if (project.rows.length === 0) {
            return res.status(404).send('Project not found');
        }

        // --------------------------------------------------------------------
        // Step 3.2: Get all scenes for this project
        // --------------------------------------------------------------------
        // Get scenes ordered by scene_number so they're in the right order
        const scenes = await db.query(
            'SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_number ASC',
            [req.params.id]
        );

        // --------------------------------------------------------------------
        // Step 3.3: Send response
        // --------------------------------------------------------------------
        // Return the project and its scenes
        res.json({
            project: project.rows[0],  // The project object
            scenes: scenes.rows        // Array of scene objects
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ============================================================================
// ROUTE 4: POST /api/projects/:id/generate-images
// ============================================================================
// Purpose: Generate AI images for all scenes in a project
// Method: POST
// Authentication: Required (auth middleware)
// Rate Limiting: AI limiter (this is expensive, so we limit it more)
// URL Parameter: id (the project ID)
// Returns: Array of updated scene objects with image URLs

router.post('/:id/generate-images', auth, aiLimiter, async (req, res) => {
    try {
        // Log for debugging
        console.log(`Request received for Project ID: ${req.params.id}`);

        // --------------------------------------------------------------------
        // Step 4.1: Verify project ownership
        // --------------------------------------------------------------------
        // Make sure the project exists and belongs to this user
        const project = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (project.rows.length === 0) {
            return res.status(404).send('Project not found');
        }

        // --------------------------------------------------------------------
        // Step 4.2: Get all scenes for this project
        // --------------------------------------------------------------------
        const scenes = await db.query(
            'SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_number ASC',
            [req.params.id]
        );

        console.log(`Found ${scenes.rows.length} scenes to process`);

        // --------------------------------------------------------------------
        // Step 4.3: Generate images for each scene
        // --------------------------------------------------------------------
        // We process all scenes in parallel for speed
        // For each scene, we:
        // 1. Check if it already has an image
        // 2. If not, generate one using the image_prompt
        // 3. Save the image URL to the database
        // 4. Return the updated scene

        const imagePromises = scenes.rows.map(async (scene) => {
            // Only generate if the scene doesn't already have an image
            if (!scene.image_url) {
                try {
                    console.log(`Generating image for scene ${scene.scene_number}...`);

                    // Call Hugging Face API to generate the image
                    const imageUrl = await generateImage(scene.image_prompt);

                    // Save the image URL to the database
                    await db.query(
                        'UPDATE scenes SET image_url = $1 WHERE id = $2',
                        [imageUrl, scene.id]
                    );

                    // Return the scene with its new image URL
                    return { ...scene, image_url: imageUrl };

                } catch (e) {
                    // If image generation fails for this scene, log it but continue
                    console.error(`Failed scene ${scene.scene_number}: ${e.message}`);
                    // Return the scene unchanged
                    return scene;
                }
            } else {
                // Scene already has an image, return it unchanged
                return scene;
            }
        });

        // Wait for all image generations to complete
        const updatedScenes = await Promise.all(imagePromises);

        console.log("All scenes processed successfully.");

        // --------------------------------------------------------------------
        // Step 4.4: Send updated scenes back to client
        // --------------------------------------------------------------------
        res.json(updatedScenes);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ============================================================================
// ROUTE 5: DELETE /api/projects/:id
// ============================================================================
// Purpose: Delete a project and all its scenes
// Method: DELETE
// Authentication: Required (auth middleware)
// URL Parameter: id (the project ID)
// Returns: Success message

router.delete('/:id', auth, async (req, res) => {
    try {
        // --------------------------------------------------------------------
        // Step 5.1: Verify ownership
        // --------------------------------------------------------------------
        // Make sure the project exists and belongs to this user
        const project = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (project.rows.length === 0) {
            return res.status(404).send('Project not found');
        }

        // --------------------------------------------------------------------
        // Step 5.2: Delete all scenes first
        // --------------------------------------------------------------------
        // We delete scenes before the project in case the database doesn't
        // have CASCADE delete configured
        await db.query('DELETE FROM scenes WHERE project_id = $1', [req.params.id]);

        // --------------------------------------------------------------------
        // Step 5.3: Delete the project
        // --------------------------------------------------------------------
        await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);

        // --------------------------------------------------------------------
        // Step 5.4: Send success response
        // --------------------------------------------------------------------
        res.json({ message: 'Project deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ============================================================================
// ROUTE 6: PUT /api/projects/scenes/:sceneId
// ============================================================================
// Purpose: Update a specific scene's details
// Method: PUT
// Authentication: Required (auth middleware)
// URL Parameter: sceneId (the scene ID)
// Body: { title, location, description, action, mood }
// Returns: Updated scene object

router.put('/scenes/:sceneId', auth, async (req, res) => {
    try {
        // --------------------------------------------------------------------
        // Step 6.1: Extract data from request
        // --------------------------------------------------------------------
        const { sceneId } = req.params;
        const { title, location, description, action, mood } = req.body;

        // --------------------------------------------------------------------
        // Step 6.2: Verify ownership via JOIN query
        // --------------------------------------------------------------------
        // We need to check that:
        // 1. The scene exists
        // 2. The scene's project belongs to this user
        // We do this with a JOIN between scenes and projects tables
        const sceneCheck = await db.query(
            'SELECT s.* FROM scenes s JOIN projects p ON s.project_id = p.id WHERE s.id = $1 AND p.user_id = $2',
            [sceneId, req.user.id]
        );

        if (sceneCheck.rows.length === 0) {
            return res.status(404).send('Scene not found or unauthorized');
        }

        // --------------------------------------------------------------------
        // Step 6.3: Update the scene
        // --------------------------------------------------------------------
        // Update the scene with the new values
        // RETURNING * gives us back the updated scene
        const result = await db.query(
            'UPDATE scenes SET title = $1, location = $2, description = $3, action = $4, mood = $5 WHERE id = $6 RETURNING *',
            [title, location, description, action, mood, sceneId]
        );

        // --------------------------------------------------------------------
        // Step 6.4: Send updated scene back to client
        // --------------------------------------------------------------------
        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ============================================================================
// EXPORT THE ROUTER
// ============================================================================
// Make this router available to server.js
export default router;
