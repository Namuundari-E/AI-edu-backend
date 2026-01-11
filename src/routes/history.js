const express = require('express');
const { getHistory } = require('../controllers/historyController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: History
 *   description: Activity history
 */

/**
 * @swagger
 * /history:
 *   get:
 *     summary: Get activity history
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items to return (default 50)
 *     responses:
 *       200:
 *         description: History list
 */
router.get('/', verifyToken, getHistory);

module.exports = router;