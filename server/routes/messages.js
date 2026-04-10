const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         listingId:
 *           type: integer
 *           example: 5
 *         senderId:
 *           type: integer
 *           example: 12
 *         body:
 *           type: string
 *           example: Is this still available?
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-10T12:00:00Z
 */

/**
 * @swagger
 * /messages/{listingId}:
 *   get:
 *     summary: Get all messages for a listing
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The listing ID whose messages to retrieve
 *     responses:
 *       200:
 *         description: List of messages for the specified listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get messages for listing 5
 *       404:
 *         description: Listing not found
 */
router.get('/:listingId', (req, res) => {
    res.json({ message: `Get messages for listing ${req.params.listingId}` });
});

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Message'
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message sent
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 */
router.post('/', (req, res) => {
    res.json({ message: 'Message sent', data: req.body });
});

module.exports = router;
