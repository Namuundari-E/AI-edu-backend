const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const { generateExamWithLLM } = require('../services/llmService');

// Backend: controllers/examController.js
const generateExam = async (req, res) => {
    try {
        const { topic, difficulty } = req.body;

        if (!topic || !difficulty) {
            return sendError(res, 'Topic and difficulty are required', 400);
        }

        const examData = await generateExamWithLLM(topic, difficulty);
        sendSuccess(res, examData);

    } catch (error) {
        console.error('Exam generation error:', error);
        sendError(res, 'Failed to generate exam', 500);
    }
};

const createExam = async (req, res) => {
    try {
        // We store core exam metadata and the answer key.
        // The full questions JSON is currently NOT persisted because the
        // 'questions' column does not exist in the 'exams' table schema.
        const { name, class_id, total_points, answer_key, exam_date } = req.body;

        if (!name || !class_id || !answer_key) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (teacherError) throw teacherError;

        const { data, error } = await supabase
            .from('exams')
            .insert([{
                exam_name: name,
                class_id,
                total_points: parseInt(total_points),
                // Ensure it's stored as a clean JSON object
                answer_key: typeof answer_key === 'string' ? JSON.parse(answer_key) : answer_key,
                exam_date,
                teacher_id: teacher.id
            }])
            .select()
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Exam created successfully', 201);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getExams = async (req, res) => {
    try {
        // Get teacher_id from teachers table
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (teacherError || !teacher) {
            return sendError(res, 'Teacher not found', 404);
        }

        const { data, error } = await supabase
            .from('exams')
            .select(`
                *,
                class:classes(class_name, grade_level),
                submissions:exam_submissions(count)
            `)
            .eq('teacher_id', teacher.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        console.error('Get exams error:', error);
        sendError(res, 'Failed to fetch exams', 500);
    }
};

const getExamById = async (req, res) => {
    try {
        const { examId } = req.params;

        // Get teacher_id from teachers table
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (teacherError || !teacher) {
            return sendError(res, 'Teacher not found', 404);
        }

        const { data, error } = await supabase
            .from('exams')
            .select(`
                *,
                class:classes(class_name, grade_level),
                submissions:exam_submissions(*)
            `)
            .eq('id', examId)
            .eq('teacher_id', teacher.id)
            .single();

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        console.error('Get exam error:', error);
        sendError(res, 'Failed to fetch exam', 500);
    }
};

module.exports = { createExam, getExams, getExamById, generateExam };
