const express = require('express');
const { gradeExam, getGrades } = require('../controllers/gradeController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Grades
 *   description: Grading and submission management
 */

/**
 * @swagger
 * /grades:
 *   post:
 *     summary: Submit and grade an exam
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - exam_id
 *               - student_id
 *               - submission
 *             properties:
 *               exam_id:
 *                 type: string
 *               student_id:
 *                 type: string
 *               submission:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Exam graded successfully
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, upload.single('submission'), gradeExam);
/**
 * @swagger
 * /grades:
 *   get:
 *     summary: Get grades
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam_id
 *         schema:
 *           type: string
 *         description: Filter by exam ID
 *     responses:
 *       200:
 *         description: List of grades
 */
router.get('/', verifyToken, getGrades);

module.exports = router;