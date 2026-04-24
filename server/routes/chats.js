const express = require("express");
const router = express.Router();
const db = require("../db/database");

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         listing_id:
 *           type: integer
 *           example: 3
 *         buyer_id:
 *           type: integer
 *           example: 2
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2026-04-22T10:00:00Z
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         chat_id:
 *           type: integer
 *           example: 1
 *         sender_id:
 *           type: integer
 *           example: 2
 *         content:
 *           type: string
 *           example: Is this still available?
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2026-04-22T10:01:00Z
 */

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Create or retrieve a chat thread for a (listing, buyer) pair
 *     tags: [Chats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listing_id
 *               - buyer_id
 *             properties:
 *               listing_id:
 *                 type: integer
 *                 example: 3
 *               buyer_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Chat created or already existed - returns the chat row
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Missing fields or seller messaging themselves
 *       404:
 *         description: Listing not found
 */
router.post("/", (req, res) => {
    try {
        const { listing_id, buyer_id } = req.body;
        if (!listing_id || !buyer_id) {
            return res
                .status(400)
                .json({ error: "listing_id and buyer_id are required" });
        }

        const listing = db
            .prepare("SELECT id, seller_id FROM listings WHERE id = ?")
            .get(listing_id);
        if (!listing)
            return res.status(404).json({ error: "Listing not found" });

        if (listing.seller_id === buyer_id) {
            return res
                .status(400)
                .json({ error: "Seller cannot message themselves" });
        }

        // INSERT OR IGNORE exploits the UNIQUE(listing_id, buyer_id) constraint -
        // safe to call multiple times as it only creates a row on first contact.
        db.prepare(
            `
            INSERT OR IGNORE INTO chats (listing_id, buyer_id) VALUES (?, ?)
        `,
        ).run(listing_id, buyer_id);

        const chat = db
            .prepare(
                "SELECT * FROM chats WHERE listing_id = ? AND buyer_id = ?",
            )
            .get(listing_id, buyer_id);

        res.status(201).json(chat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /chats/{chatId}/messages:
 *   get:
 *     summary: Get all messages for a chat thread
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The chat ID
 *     responses:
 *       200:
 *         description: Array of messages ordered oldest to newest
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       404:
 *         description: Chat not found
 */
router.get("/:chatId/messages", (req, res) => {
    try {
        const chat = db
            .prepare("SELECT id FROM chats WHERE id = ?")
            .get(req.params.chatId);
        if (!chat) return res.status(404).json({ error: "Chat not found" });

        const messages = db
            .prepare(
                `
            SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC
        `,
            )
            .all(req.params.chatId);

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
