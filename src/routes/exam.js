const express = require('express');
const { createExam, getExams, getExamById } = require('../controllers/examController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Exams
 *   description: Exam management
 */

/**
 * @swagger
 * /exams:
 *   post:
 *     summary: Create a new exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - class_id
 *               - total_marks
 *             properties:
 *               title:
 *                 type: string
 *               class_id:
 *                 type: string
 *               total_marks:
 *                 type: integer
 *               questions:
 *                 type: string
 *                 description: JSON string of questions
 *               exam_image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Exam created successfully
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, upload.single('exam_image'), createExam);
/**
 * @swagger
 * /exams:
 *   get:
 *     summary: Get all exams for the teacher
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exams
 */
router.get('/', verifyToken, getExams);
/**
 * @swagger
 * /exams/{examId}:
 *   get:
 *     summary: Get exam by ID
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam details
 *       404:
 *         description: Exam not found
 */
router.get('/:examId', verifyToken, getExamById);

module.exports = router;