const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Calculus Textbook
 *         description:
 *           type: string
 *           example: 8th edition, good condition
 *         price:
 *           type: number
 *           example: 25.00
 *         sellerId:
 *           type: integer
 *           example: 42
 */

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: A list of all listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get all listings
 */
router.get('/', (req, res) => {
    try {
        const { category, condition, min_price, max_price } = req.query;
        let query = 'SELECT * FROM listings WHERE status = ?';
        const params = ['Available'];

        if (category)  { query += ' AND category = ?';              params.push(category); }
        if (condition) { query += ' AND condition = ?';             params.push(condition); }
        if (min_price) { query += ' AND price >= ?';                params.push(Number(min_price)); }
        if (max_price) { query += ' AND price <= ?';                params.push(Number(max_price)); }

        query += ' ORDER BY created_at DESC';
        const listings = db.prepare(query).all(...params);
        res.json(listings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get a single listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: The requested listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get listing 1
 *       404:
 *         description: Listing not found
 */
router.get('/:id', (req, res) => {
    try {
        const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        res.json(listing);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Listing'
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listing created
 *                 listing:
 *                   $ref: '#/components/schemas/Listing'
 */
router.post('/', (req, res) => {
    try {
        const { seller_id, title, description, price, category, condition, image_url } = req.body;
        if (!seller_id || !title || !description || !price || !category || !condition) {
            return res.status(400).json({ error: 'Missing required fields: seller_id, title, description, price, category, condition' });
        }

        // Check for duplicate active listing by the same seller (FR12)
        const duplicate = db.prepare(`
            SELECT id FROM listings
            WHERE seller_id = ? AND title = ? AND description = ? AND status IN ('Available','Pending')
        `).get(seller_id, title, description);
        if (duplicate) {
            return res.status(409).json({ error: 'A listing with the same title and description already exists.' });
        }

        const result = db.prepare(`
            INSERT INTO listings (seller_id, title, description, price, category, condition, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(seller_id, title, description, price, category, condition, image_url || null);

        const newListing = db.prepare('SELECT * FROM listings WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(newListing);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update a listing
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Listing'
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update listing 1
 *       404:
 *         description: Listing not found
 */
router.put('/:id', (req, res) => {
    try {
        const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Listing not found' });
        if (listing.status === 'Sold') return res.status(403).json({ error: 'Cannot edit a sold listing' });

        const { title, description, price, category, condition, image_url, status } = req.body;
        db.prepare(`
            UPDATE listings
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                price = COALESCE(?, price),
                category = COALESCE(?, category),
                condition = COALESCE(?, condition),
                image_url = COALESCE(?, image_url),
                status = COALESCE(?, status),
                updated_at = datetime('now')
            WHERE id = ?
        `).run(title, description, price, category, condition, image_url, status, req.params.id);

        const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Archive (delete) a listing
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete listing 1
 *       404:
 *         description: Listing not found
 */
router.delete('/:id', (req, res) => {
    try {
        const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Listing not found' });

        // Soft delete: archive instead of removing from DB
        db.prepare(`UPDATE listings SET status = 'Archived', updated_at = datetime('now') WHERE id = ?`)
          .run(req.params.id);
        res.json({ message: `Listing ${req.params.id} archived successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
