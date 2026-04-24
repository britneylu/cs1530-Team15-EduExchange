const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 2
 *         listing_id:
 *           type: integer
 *           example: 3
 *         saved_at:
 *           type: string
 *           example: 2025-04-20T12:00:00
 */

/**
 * @swagger
 * /wishlist/{userId}:
 *   get:
 *     summary: Get all saved listings for a user
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: List of saved listings
 *       500:
 *         description: Server error
 */
router.get('/:userId', (req, res) => {
    try {
        // Join wishlist with listings so the response includes full listing details
        const items = db.prepare(`
            SELECT w.id AS wishlist_id, w.saved_at,
                   l.id, l.title, l.description, l.price, l.category, l.condition, l.status
            FROM wishlist w
            JOIN listings l ON w.listing_id = l.id
            WHERE w.user_id = ?
            ORDER BY w.saved_at DESC
        `).all(req.params.userId);

        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Save a listing to a user's wishlist
 *     tags: [Wishlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - listing_id
 *             properties:
 *               user_id:
 *                 type: integer
 *               listing_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Listing saved to wishlist
 *       409:
 *         description: Already in wishlist
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', (req, res) => {
    try {
        const { user_id, listing_id } = req.body;

        if (!user_id || !listing_id) {
            return res.status(400).json({ error: 'Missing required fields: user_id, listing_id' });
        }

        // Check if listing exists
        const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(listing_id);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check for duplicate (unique constraint already set, but give a clean error)
        const existing = db.prepare(
            'SELECT id FROM wishlist WHERE user_id = ? AND listing_id = ?'
        ).get(user_id, listing_id);

        if (existing) {
            return res.status(409).json({ error: 'Listing already in wishlist' });
        }

        const result = db.prepare(
            'INSERT INTO wishlist (user_id, listing_id) VALUES (?, ?)'
        ).run(user_id, listing_id);

        res.status(201).json({ id: result.lastInsertRowid, user_id, listing_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /wishlist/{userId}/{listingId}:
 *   delete:
 *     summary: Remove a listing from a user's wishlist
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing removed from wishlist
 *       404:
 *         description: Wishlist entry not found
 *       500:
 *         description: Server error
 */
router.delete('/:userId/:listingId', (req, res) => {
    try {
        const { userId, listingId } = req.params;

        const existing = db.prepare(
            'SELECT id FROM wishlist WHERE user_id = ? AND listing_id = ?'
        ).get(userId, listingId);

        if (!existing) {
            return res.status(404).json({ error: 'Wishlist entry not found' });
        }

        db.prepare(
            'DELETE FROM wishlist WHERE user_id = ? AND listing_id = ?'
        ).run(userId, listingId);

        res.json({ message: `Listing ${listingId} removed from wishlist` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
