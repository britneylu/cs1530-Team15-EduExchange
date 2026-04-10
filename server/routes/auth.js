const express = require('express');
const router = express.Router();
const db = require('../db/database');

// not actually certain this will be the flow but just wanted to have some sort of stubs

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Redirect to Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Redirects the user to Google's OAuth login page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Redirect to Google OAuth
 */
router.get('/google', (req, res) => {
    res.json({ message: 'Redirect to Google OAuth' });
});

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     description: Google redirects back here with an auth code to create a session
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code returned by Google
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Handle Google callback, create session
 */
router.get('/google/callback', (req, res) => {
    res.json({ message: 'Handle Google callback, create session' });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Session cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Clear session
 */
router.post('/logout', (req, res) => {
    res.json({ message: 'Clear session' });
});

module.exports = router;
