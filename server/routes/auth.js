const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getGoogleOAuthConfig() {
    return {
        clientId: process.env.GOOGLE_CLIENT_ID,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
        hostedDomain: process.env.GOOGLE_HOSTED_DOMAIN,
    };
}

function buildGoogleAuthUrl() {
    const { clientId, redirectUri, hostedDomain } = getGoogleOAuthConfig();
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
    });

    if (hostedDomain) {
        params.set('hd', hostedDomain);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

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
    const { clientId } = getGoogleOAuthConfig();

    if (!clientId) {
        return res.status(503).json({
            error: 'Google OAuth is not configured.',
            missing: ['GOOGLE_CLIENT_ID'],
        });
    }

    res.redirect(buildGoogleAuthUrl());
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
