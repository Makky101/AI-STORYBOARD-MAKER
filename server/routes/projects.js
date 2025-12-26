import express from 'express';
import * as db from '../db.js';
import auth from '../middleware/authMiddleware.js';
import { generateScript, generateImage } from '../services/aiService.js';
import { apiLimiter, aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply general API limiter to all routes here
router.use(apiLimiter);

// Get all projects for user
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create new project and generate script immediately
router.post('/', auth, aiLimiter, async (req, res) => {
    try {
        const { title, input } = req.body;

        // 1. Create Project
        const projectResult = await db.query(
            'INSERT INTO projects (user_id, title, original_input) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, title, input]
        );

        const project = projectResult.rows[0];

        // 2. Generate Script
        const scenesData = await generateScript(input);

        // 3. Save Scenes
        const scenePromises = scenesData.map(scene => {
            return db.query(
                'INSERT INTO scenes (project_id, scene_number, title, location, description, action, mood, image_prompt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [project.id, scene.scene_number, scene.title, scene.location, scene.description, scene.action, scene.mood, scene.image_prompt]
            );
        });

        await Promise.all(scenePromises);

        //put 'project' here later
        res.json({ project, scenes: scenesData });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get single project with scenes

router.get('/:id', auth, async (req, res) => {
    try {
        const project = await db.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (project.rows.length === 0) return res.status(404).send('Project not found');

        const scenes = await db.query('SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_number ASC', [req.params.id]);

        res.json({ project: project.rows[0], scenes: scenes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// Generate Images for a project
router.post('/:id/generate-images', auth, aiLimiter, async (req, res) => {
    try {
        console.log(`Request received for Project ID: ${req.params.id}`);

        // Check ownership
        const project = await db.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (project.rows.length === 0) return res.status(404).send('Project not found');

        // Get scenes
        const scenes = await db.query('SELECT * FROM scenes WHERE project_id = $1 ORDER BY scene_number ASC', [req.params.id]);
        console.log(`Found ${scenes.rows.length} scenes to process`);

        // Generate images for all scenes in parallel
        const imagePromises = scenes.rows.map(async (scene) => {
            if (!scene.image_url) {
                try {
                    console.log(`Generating image for scene ${scene.scene_number}...`);
                    const imageUrl = await generateImage(scene.image_prompt);

                    await db.query('UPDATE scenes SET image_url = $1 WHERE id = $2', [imageUrl, scene.id]);
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

        console.log("All scenes processed successfully.");
        res.json(updatedScenes);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
