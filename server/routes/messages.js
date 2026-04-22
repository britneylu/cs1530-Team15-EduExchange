const express = require("express");
const router = express.Router();
const db = require("../db/database");

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
router.get("/:listingId", (req, res) => {
    res.json({ message: `Get messages for listing ${req.params.listingId}` });
});

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message in a chat thread
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chat_id
 *               - sender_id
 *               - content
 *             properties:
 *               chat_id:
 *                 type: integer
 *                 example: 1
 *               sender_id:
 *                 type: integer
 *                 example: 2
 *               content:
 *                 type: string
 *                 example: Is this still available?
 *     responses:
 *       201:
 *         description: Message saved — returns the new message row
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Chat not found
 */
router.post("/", (req, res) => {
    try {
        const { chat_id, sender_id, content } = req.body;
        if (!chat_id || !sender_id || !content || !content.trim()) {
            return res
                .status(400)
                .json({
                    error: "chat_id, sender_id, and content are required",
                });
        }

        const chat = db
            .prepare("SELECT id FROM chats WHERE id = ?")
            .get(chat_id);
        if (!chat) return res.status(404).json({ error: "Chat not found" });

        const result = db
            .prepare(
                `
            INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)
        `,
            )
            .run(chat_id, sender_id, content.trim());

        const message = db
            .prepare("SELECT * FROM messages WHERE id = ?")
            .get(result.lastInsertRowid);
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
