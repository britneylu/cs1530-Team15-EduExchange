const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.post('/', (req, res) => {
    try {
        const { listing_id, reported_user_id, reason, details } = req.body;
        if (!listing_id || !reported_user_id || !reason) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // const reporter_id = req.session?.userId;
        const reporter_id = 1; // Placeholder for testing - replace with session user ID in production
        if (!reporter_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const result = db.prepare(`
            INSERT INTO reports (listing_id, reported_user_id, reporter_id, reason, details)
            VALUES (?, ?, ?, ?, ?)
        `).run(listing_id, reported_user_id, reporter_id, reason, details);
        const newReport = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(newReport);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;