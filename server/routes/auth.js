const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getGoogleOAuthConfig() {
    return {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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

async function exchangeCodeForTokens(code) {
    const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }),
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error_description || payload.error || 'Google token exchange failed');
    }

    return payload;
}

async function fetchGoogleProfile(accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error_description || payload.error || 'Failed to fetch Google profile');
    }

    return payload;
}

function inferUniversity(profile) {
    if (profile.hd) {
        return profile.hd;
    }

    if (profile.email && profile.email.includes('@')) {
        return profile.email.split('@')[1];
    }

    return 'Unknown';
}

function buildUsername(email) {
    return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32) || `user_${Date.now()}`;
}

function upsertGoogleUser(profile) {
    const existingUser = db.prepare(`
        SELECT id
        FROM users
        WHERE google_sub = ? OR email = ?
    `).get(profile.sub, profile.email);

    const name = profile.name || profile.email;
    const email = profile.email;
    const university = inferUniversity(profile);

    if (existingUser) {
        db.prepare(`
            UPDATE users
            SET name = ?,
                email = ?,
                university = ?,
                google_sub = ?,
                avatar_url = ?,
                last_login_at = datetime('now')
            WHERE id = ?
        `).run(name, email, university, profile.sub, profile.picture || null, existingUser.id);

        return db.prepare(`
            SELECT id, username, name, email, university, google_sub, avatar_url, last_login_at
            FROM users
            WHERE id = ?
        `).get(existingUser.id);
    }

    const usernameBase = buildUsername(email);
    let username = usernameBase;
    let suffix = 1;
    while (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
        username = `${usernameBase}_${suffix}`;
        suffix += 1;
    }

    const result = db.prepare(`
        INSERT INTO users (username, name, email, university, google_sub, avatar_url, last_login_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(username, name, email, university, profile.sub, profile.picture || null);

    return db.prepare(`
        SELECT id, username, name, email, university, google_sub, avatar_url, last_login_at
        FROM users
        WHERE id = ?
    `).get(result.lastInsertRowid);
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
router.get('/google/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        const { clientId, clientSecret, hostedDomain } = getGoogleOAuthConfig();

        if (!clientId || !clientSecret) {
            return res.status(503).json({
                error: 'Google OAuth is not fully configured.',
                missing: [
                    ...(!clientId ? ['GOOGLE_CLIENT_ID'] : []),
                    ...(!clientSecret ? ['GOOGLE_CLIENT_SECRET'] : []),
                ],
            });
        }

        if (error) {
            return res.status(400).json({ error: `Google login failed: ${error}` });
        }

        if (!code) {
            return res.status(400).json({ error: 'Missing authorization code.' });
        }

        const tokens = await exchangeCodeForTokens(code);
        const profile = await fetchGoogleProfile(tokens.access_token);

        if (!profile.email || !profile.email_verified) {
            return res.status(400).json({ error: 'Google account email is missing or unverified.' });
        }

        if (hostedDomain && profile.hd !== hostedDomain) {
            return res.status(403).json({ error: `Sign in with your ${hostedDomain} Google account.` });
        }

        const user = upsertGoogleUser(profile);
        res.json({
            message: 'Google account verified and user record synced.',
            user,
        });
    } catch (err) {
        console.error('[AUTH] Google callback failed:', err);
        res.status(500).json({ error: err.message || 'Google login failed.' });
    }
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
