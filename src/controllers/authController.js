const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return sendError(res, 'Email, password, and name are required', 400);
        }

        // 1️⃣ Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            return sendError(res, authError.message, 400);
        }

        const userId = authData.user.id;

        // 2️⃣ Insert profile into teachers table (matching schema)
        const { error: profileError } = await supabase
            .from('teachers')
            .insert({
                user_id: userId,  // References auth.users(id)
                full_name: name   // Matches schema column name
            });

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await supabase.auth.admin.deleteUser(userId);
            return sendError(res, profileError.message, 500);
        }

        return sendSuccess(
            res,
            { id: userId, email, name },
            'User created successfully',
            201
        );

    } catch (error) {
        console.error('Signup error:', error);
        return sendError(res, 'Signup failed', 500);
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 'Email and password are required', 400);
        }

        // Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !authData.user) {
            return sendError(res, 'Invalid credentials', 401);
        }

        // Get teacher profile
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id, full_name')
            .eq('user_id', authData.user.id)
            .single();

        if (teacherError || !teacher) {
            return sendError(res, 'Teacher profile not found', 404);
        }

        // Return Supabase session token
        sendSuccess(res, {
            token: authData.session.access_token,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: teacher.full_name
            }
        }, 'Login successful');
    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 'Login failed', 500);
    }
};

const getProfile = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('teachers')
            .select('id, user_id, full_name, created_at')
            .eq('user_id', req.userId)
            .single();

        if (error) throw error;

        sendSuccess(res, {
            id: data.id,
            userId: data.user_id,
            name: data.full_name,
            createdAt: data.created_at
        });
    } catch (error) {
        console.error('Get profile error:', error);
        sendError(res, 'Failed to fetch profile', 500);
    }
};

module.exports = { signup, login, getProfile };