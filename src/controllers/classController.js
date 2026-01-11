const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const createClass = async (req, res) => {
    try {
        const { name, grade_level, subject } = req.body;

        if (!name || !grade_level || !subject) {
            return sendError(res, 'Class name, grade level, and subject are required', 400);
        }

        // Get teacher_id from teachers table using user_id
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (teacherError || !teacher) {
            return sendError(res, 'Teacher not found', 404);
        }

        const { data, error } = await supabase
            .from('classes')
            .insert([{
                class_name: name,  // Matches schema
                grade_level,
                subject,
                teacher_id: teacher.id
            }])
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabase.from('activity_log').insert([{
            teacher_id: teacher.id,
            activity_type: 'CREATE_CLASS',
            description: `Created class: ${name}`
        }]);

        sendSuccess(res, data, 'Class created successfully', 201);
    } catch (error) {
        console.error('Create class error:', error);
        sendError(res, 'Failed to create class', 500);
    }
};

const getClasses = async (req, res) => {
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
            .from('classes')
            .select('*, students(count)')
            .eq('teacher_id', teacher.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        console.error('Get classes error:', error);
        sendError(res, 'Failed to fetch classes', 500);
    }
};

const addStudent = async (req, res) => {
    try {
        const { class_id, name, student_id } = req.body;

        if (!class_id || !name || !student_id) {
            return sendError(res, 'Class ID, name, and student ID are required', 400);
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

        const { data, error } = await supabase
            .from('students')
            .insert([{
                class_id,
                student_name: name,  // Matches schema
                student_id
            }])
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabase.from('activity_log').insert([{
            teacher_id: teacher.id,
            activity_type: 'ADD_STUDENT',
            description: `Added student: ${name} to class`
        }]);

        sendSuccess(res, data, 'Student added successfully', 201);
    } catch (error) {
        console.error('Add student error:', error);
        sendError(res, 'Failed to add student', 500);
    }
};

const getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', classId)
            .order('student_name');

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        console.error('Get students error:', error);
        sendError(res, 'Failed to fetch students', 500);
    }
};

module.exports = { createClass, getClasses, addStudent, getClassStudents };