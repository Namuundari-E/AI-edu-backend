const express = require('express');
const {
    createClass,
    getClasses,
    addStudent,
    getClassStudents
} = require('../controllers/classController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Class and student management
 */

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - grade_level
 *             properties:
 *               name:
 *                 type: string
 *               grade_level:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       201:
 *         description: Class created successfully
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, createClass);
/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes for the teacher
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get('/', verifyToken, getClasses);
/**
 * @swagger
 * /classes/students:
 *   post:
 *     summary: Add a student to a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - name
 *               - student_id
 *             properties:
 *               class_id:
 *                 type: string
 *               name:
 *                 type: string
 *               student_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student added successfully
 *       500:
 *         description: Server error
 */
router.post('/students', verifyToken, addStudent);
/**
 * @swagger
 * /classes/{classId}/students:
 *   get:
 *     summary: Get all students in a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/:classId/students', verifyToken, getClassStudents);

module.exports = router;