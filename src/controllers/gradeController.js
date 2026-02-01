const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const { gradeExamWithLLM } = require('../services/llmService');

const gradeExam = async (req, res) => {
    try {
        const { exam_id } = req.body;
        // student_id is now optional as we extract the code from the image
        let { student_id } = req.body;
        const submission_image = req.file ? `/uploads/exams/${req.file.filename}` : null;

        if (!exam_id || !submission_image) {
            return sendError(res, 'Exam ID and submission image are required', 400);
        }

        // 1. Fetch Exam & Class info
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*, class:classes(*)')
            .eq('id', exam_id)
            .single();

        if (examError || !exam) {
            return sendError(res, 'Exam not found', 404);
        }

        // 2. Grade with LLM & Extract Student Code
        const gradingResult = await gradeExamWithLLM(exam, submission_image);

        // 3. Automatic Student Matching if student_id not provided
        if (!student_id && gradingResult.student_code) {
            const { data: matchedStudent } = await supabase
                .from('students')
                .select('id')
                .eq('class_id', exam.class_id)
                .ilike('student_id', `%${gradingResult.student_code}%`) // Search for code in student_id
                .single();

            if (matchedStudent) {
                student_id = matchedStudent.id;
            }
        }

        // 4. Save/Update Submission (Upsert)
        const { data: submission, error: subError } = await supabase
            .from('exam_submissions')
            .upsert({
                exam_id,
                student_id: student_id || null, // Might be null if matching failed
                submission_image_url: submission_image,
                graded_score: gradingResult.score || 0,
                feedback: gradingResult.feedback,
                question_results: gradingResult.question_results || [],
                status: student_id ? 'graded' : 'pending_match',
                graded_at: new Date().toISOString()
            }, {
                onConflict: 'exam_id, student_id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (subError) {
            // Handle unique constraint if upsert fails for some Reason
            console.error('Upsert error details:', subError);
            throw subError;
        }

        // 5. Response with match status
        sendSuccess(res, {
            ...submission,
            extracted_code: gradingResult.student_code,
            is_matched: !!student_id
        }, 'Exam processed successfully', 201);

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

const updateGrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { graded_score, feedback, status, student_id, question_results } = req.body;

        const { data, error } = await supabase
            .from('exam_submissions')
            .update({
                graded_score,
                feedback,
                status,
                student_id,
                question_results,
                graded_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Grade updated successfully');
    } catch (error) {
        console.error('Update grade error:', error);
        sendError(res, 'Failed to update grade', 500);
    }
};

module.exports = { gradeExam, getGrades, updateGrade };
