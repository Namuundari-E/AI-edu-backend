const supabase = require('../config/supabase');

const getClassAnalysis = async (classId, teacherId) => {
    try {
        const { data: submissions, error } = await supabase
            .from('exam_submissions')
            .select(`
        *,
        exam:exams!inner(class_id, total_marks)
      `)
            .eq('exam.class_id', classId)
            .eq('exam.teacher_id', teacherId);

        if (error) throw error;

        const totalSubmissions = submissions.length;
        const averageScore = submissions.reduce((acc, sub) =>
            acc + (sub.marks_obtained / sub.exam.total_marks) * 100, 0
        ) / totalSubmissions || 0;

        const passRate = submissions.filter(sub =>
            (sub.marks_obtained / sub.exam.total_marks) * 100 >= 60
        ).length / totalSubmissions * 100 || 0;

        return {
            totalSubmissions,
            averageScore: averageScore.toFixed(2),
            passRate: passRate.toFixed(2)
        };
    } catch (error) {
        console.error('Analysis error:', error);
        return null;
    }
};

module.exports = { getClassAnalysis };