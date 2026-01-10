// server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ============= AUTH ROUTES =============

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Get teacher profile
        const { data: teacher } = await supabase
            .from('teachers')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();

        res.json({
            success: true,
            user: data.user,
            teacher,
            session: data.session
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ============= TEACHER ROUTES =============

// Get teacher profile
app.get('/api/teacher/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Update teacher profile
app.put('/api/teacher/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('teachers')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ============= CLASS ROUTES =============

// Get all classes for teacher
app.get('/api/classes/:teacherId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select(`
        *,
        students:students(count)
      `)
            .eq('teacher_id', req.params.teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Create new class
app.post('/api/classes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await logActivity(req.body.teacher_id, 'class_created', `Created class: ${req.body.class_name}`);

        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ============= EXAM ROUTES =============

// Get all exams for teacher
app.get('/api/exams/:teacherId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .select(`
        *,
        classes:classes(class_name),
        exam_submissions:exam_submissions(count)
      `)
            .eq('teacher_id', req.params.teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Create new exam
app.post('/api/exams', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;

        await logActivity(req.body.teacher_id, 'exam_created', `Created exam: ${req.body.exam_name}`);

        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ============= GRADING ROUTES =============

// Grade exam submission with LLM
app.post('/api/grade', async (req, res) => {
    try {
        const { submission_id, exam_id, image_data, teacher_id } = req.body;

        // Get exam details and answer key
        const { data: exam } = await supabase
            .from('exams')
            .select('*, classes(*)')
            .eq('id', exam_id)
            .single();

        // Call LLM for grading
        const gradingResult = await gradeWithLLM(image_data, exam.answer_key, exam);

        // Update submission
        const { data, error } = await supabase
            .from('exam_submissions')
            .update({
                graded_score: gradingResult.score,
                feedback: gradingResult.feedback,
                status: 'graded',
                graded_at: new Date().toISOString()
            })
            .eq('id', submission_id)
            .select()
            .single();

        if (error) throw error;

        await logActivity(teacher_id, 'exam_graded', `Graded submission for exam: ${exam.exam_name}`);

        res.json({ success: true, data, grading: gradingResult });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ============= DASHBOARD/ANALYTICS ROUTES =============

// Get dashboard stats
app.get('/api/dashboard/:teacherId', async (req, res) => {
    try {
        const teacherId = req.params.teacherId;

        // Get counts
        const { count: classCount } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        const { count: examCount } = await supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        const { count: gradedCount } = await supabase
            .from('exam_submissions')
            .select('*, exams!inner(*)', { count: 'exact', head: true })
            .eq('exams.teacher_id', teacherId)
            .eq('status', 'graded');

        // Get recent grades
        const { data: recentGrades } = await supabase
            .from('exam_submissions')
            .select(`
        *,
        exams(exam_name),
        students(student_name)
      `)
            .eq('status', 'graded')
            .order('graded_at', { ascending: false })
            .limit(10);

        res.json({
            success: true,
            stats: {
                totalClasses: classCount,
                totalExams: examCount,
                totalGraded: gradedCount
            },
            recentGrades
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ============= ACTIVITY LOG ROUTES =============

// Get activity history
app.get('/api/activity/:teacherId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('activity_log')
            .select('*')
            .eq('teacher_id', req.params.teacherId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ============= HELPER FUNCTIONS =============

async function logActivity(teacherId, activityType, description) {
    await supabase
        .from('activity_log')
        .insert({
            teacher_id: teacherId,
            activity_type: activityType,
            description: description,
            created_at: new Date().toISOString()
        });
}

async function gradeWithLLM(imageData, answerKey, examDetails) {
    // This will call your LLM API (Anthropic Claude)
    // See the separate prompt for implementation

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: imageData
                        }
                    },
                    {
                        type: 'text',
                        text: `You are grading a math exam. Answer key: ${JSON.stringify(answerKey)}. 
            Analyze the handwritten answers in the image and provide:
            1. Total score out of ${examDetails.total_points}
            2. Detailed feedback for each question
            3. Identify correct and incorrect answers
            
            Return JSON: { "score": number, "feedback": string, "breakdown": [] }`
                    }
                ]
            }]
        })
    });

    const result = await response.json();
    const content = result.content[0].text;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, feedback: content };
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});