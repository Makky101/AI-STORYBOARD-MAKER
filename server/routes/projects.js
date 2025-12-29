import express from 'express';
import * as db from '../db.js';
import auth from '../middleware/authMiddleware.js';
import { generateScript, generateImage } from '../services/aiService.js';
import { apiLimiter, aiLimiter } from '../middleware/rateLimiter.js';
const router = express.Router();
router.use(apiLimiter);


router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
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
                    project.id,           
                    scene.scene_number,   
                    scene.title,          
                    scene.location,       
                    scene.description,    
                    scene.action,         
                    scene.mood,           
                    scene.image_prompt    
                ]
            );
        });

        await Promise.all(scenePromises);
        
        res.json({ project, scenes: scenesData });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const project = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (project.rows.length === 0) {
            return res.status(404).send('Project not found');
        }

        const scenes = await db.query(
            'SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_number ASC',
            [req.params.id]
        );

        res.json({
            project: project.rows[0],  
            scenes: scenes.rows        
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/:id/generate-images', auth, aiLimiter, async (req, res) => {
    try {
        const project = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (project.rows.length === 0) {
            return res.status(404).send('Project not found');
        }

        const scenes = await db.query(
            'SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_number ASC',
            [req.params.id]
        );

        const imagePromises = scenes.rows.map(async (scene) => {
            if (!scene.image_url) {
                try {
                    const imageUrl = await generateImage(scene.image_prompt);
                    await db.query(
                        'UPDATE scenes SET image_url = $1 WHERE id = $2',
                        [imageUrl, scene.id]
                    );
                    return { ...scene, image_url: imageUrl };
                } catch (e) {
                    console.error(`Failed scene ${scene.scene_number}: ${e.message}`);
                    return scene;
                }
            } else {
                return scene;
            }
        });

        const updatedScenes = await Promise.all(imagePromises);

        res.json(updatedScenes);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (project.rows.length === 0) {
            return res.status(404).send('Project not found');
        }

        await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);

        res.json({ message: 'Project deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.put('/scenes/:sceneId', auth, async (req, res) => {
    try {
        const { sceneId } = req.params;
        const { title, location, description, action, mood } = req.body;

        const sceneCheck = await db.query(
            'SELECT s.* FROM scenes s JOIN projects p ON s.project_id = p.id WHERE s.id = $1 AND p.user_id = $2',
            [sceneId, req.user.id]
        );

        if (sceneCheck.rows.length === 0) {
            return res.status(404).send('Scene not found or unauthorized');
        }

        const result = await db.query(
            'UPDATE scenes SET title = $1, location = $2, description = $3, action = $4, mood = $5 WHERE id = $6 RETURNING *',
            [title, location, description, action, mood, sceneId]
        );

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
