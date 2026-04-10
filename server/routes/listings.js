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
    res.json({ message: 'Get all listings' });
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
    res.json({ message: `Get listing ${req.params.id}` });
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
    const listing = req.body;
    res.status(201).json({ message: 'Listing created', listing });
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
    res.json({ message: `Update listing ${req.params.id}` });
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
    res.json({ message: `Delete listing ${req.params.id}` });
});

module.exports = router;
