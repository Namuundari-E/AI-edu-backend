const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const { gradeExamWithLLM } = require('../services/llmService');

const gradeExam = async (req, res) => {
    try {
        const { exam_id, student_id } = req.body;
        const submission_image = req.file ? `/uploads/exams/${req.file.filename}` : null;

        if (!exam_id || !student_id || !submission_image) {
            return sendError(res, 'Exam ID, student ID, and submission image are required', 400);
        }

        // Get teacher_id for activity log
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (teacherError || !teacher) {
            return sendError(res, 'Teacher not found', 404);
        }

        const { data: exam } = await supabase
            .from('exams')
            .select('*, class:classes(*)')
            .eq('id', exam_id)
            .single();

        if (!exam) {
            return sendError(res, 'Exam not found', 404);
        }

        // Grade with LLM
        const gradingResult = await gradeExamWithLLM(exam, submission_image);

        const { data, error } = await supabase
            .from('exam_submissions')
            .insert([{
                exam_id,
                student_id,
                submission_image_url: submission_image,  // Matches schema
                graded_score: gradingResult.score,       // Matches schema
                feedback: gradingResult.feedback,
                status: 'graded',                        // Matches enum
                graded_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabase.from('activity_log').insert([{
            teacher_id: teacher.id,
            activity_type: 'GRADE_EXAM',
            description: `Graded exam for student`
        }]);

        sendSuccess(res, data, 'Exam graded successfully', 201);
    } catch (error) {
        console.error('Grade exam error:', error);
        sendError(res, 'Failed to grade exam', 500);
    }
};

const getGrades = async (req, res) => {
    try {
        const { exam_id } = req.query;

        let query = supabase
            .from('exam_submissions')
            .select(`
                *,
                student:students(*),
                exam:exams(exam_name, total_points)
            `)
            .order('graded_at', { ascending: false });

        if (exam_id) {
            query = query.eq('exam_id', exam_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        console.error('Get grades error:', error);
        sendError(res, 'Failed to fetch grades', 500);
    }
};

module.exports = { gradeExam, getGrades };