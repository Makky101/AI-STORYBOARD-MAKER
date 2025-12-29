import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as db from '../db.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const newUser = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT(email) DO NOTHING RETURNING id, email;',
            [email, hashedPassword]
        );

        if(newUser.rowCount === 0) return res.status(409).json({error: 'Email has already been used'})

        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(400).send('Email is not found');

        // Check password
        const validPass = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPass) return res.status(400).send('Invalid password');

        // Create and assign token
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.header('Authorization', token).json({ token, user: { id: user.rows[0].id } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
