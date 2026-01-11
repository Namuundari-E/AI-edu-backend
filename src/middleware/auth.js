const supabase = require('../config/supabase');
const { sendError } = require('../utils/response');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return sendError(res, 'Access token required', 401);
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return sendError(res, 'Invalid or expired token', 401);
        }

        req.userId = user.id;
        req.userEmail = user.email;
        next();
    } catch (error) {
        return sendError(res, 'Authentication failed', 401);
    }
};

module.exports = { verifyToken };