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

// Delete project and scenes (using cascade or manual)
router.delete('/:id', auth, async (req, res) => {
    try {
        // 1. Check ownership
        const project = await db.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (project.rows.length === 0) return res.status(404).send('Project not found');

        // 2. Delete scenes manually first (in case CASCADE is not set in DB)
        await db.query('DELETE FROM scenes WHERE project_id = $1', [req.params.id]);

        // 3. Delete project
        await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update a scene
router.put('/scenes/:sceneId', auth, async (req, res) => {
    try {
        const { sceneId } = req.params;
        const { title, location, description, action, mood } = req.body;

        // 1. Check ownership (via project connection)
        const sceneCheck = await db.query(
            'SELECT s.* FROM scenes s JOIN projects p ON s.project_id = p.id WHERE s.id = $1 AND p.user_id = $2',
            [sceneId, req.user.id]
        );
        if (sceneCheck.rows.length === 0) return res.status(404).send('Scene not found or unauthorized');

        // 2. Update scene
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
