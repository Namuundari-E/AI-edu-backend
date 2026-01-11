const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const getHistory = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

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
            .from('activity_log')
            .select('*')
            .eq('teacher_id', teacher.id)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        console.error('Get history error:', error);
        sendError(res, 'Failed to fetch history', 500);
    }
};

module.exports = { getHistory };