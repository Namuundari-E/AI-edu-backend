const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const createExam = async (req, res) => {
    try {
        const { name, class_id, total_points, answer_key, exam_date } = req.body;

        if (!name || !class_id || !total_points || !answer_key || !exam_date) {
            return sendError(res, 'Name, class ID, total points, answer key, and exam date are required', 400);
        }

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
            .insert([{
                exam_name: name,
                class_id,
                total_points: parseInt(total_points),
                answer_key: typeof answer_key === 'string' ? JSON.parse(answer_key) : answer_key,
                exam_date,
                teacher_id: teacher.id
            }])
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabase.from('activity_log').insert([{
            teacher_id: teacher.id,
            activity_type: 'CREATE_EXAM',
            description: `Created exam: ${name}`
        }]);

        sendSuccess(res, data, 'Exam created successfully', 201);
    } catch (error) {
        console.error('Create exam error:', error);
        sendError(res, 'Failed to create exam', 500);
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

module.exports = { createExam, getExams, getExamById };