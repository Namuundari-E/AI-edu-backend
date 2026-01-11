const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3010/api';
const TIMESTAMP = Date.now();
const USER_EMAIL = `teacher_${TIMESTAMP}@example.com`;
const USER_PASSWORD = 'SecurePass123!';
const USER_NAME = 'Test Teacher';

let token = '';
let classId = '';
let studentId = '';
let examId = '';

// Helper for colored logs
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

async function runTest(name, testFn) {
    process.stdout.write(`${colors.blue}Running test: ${name}...${colors.reset} `);
    try {
        await testFn();
        console.log(`${colors.green}PASSED${colors.reset}`);
    } catch (error) {
        console.log(`${colors.red}FAILED${colors.reset}`);
        console.error(`${colors.yellow}Error details:${colors.reset}`, error.response ? error.response.data : error.message);
        // Don't stop on error, try to continue if possible? 
        // Actually, many tests depend on previous state, so we might as well stop or handle gracefully.
        // For now, let's keep going but some subsequent tests might fail.
    }
}

async function main() {
    console.log(`Starting API Tests against ${BASE_URL}\nUsing email: ${USER_EMAIL}\n`);

    // 1. Signup
    await runTest('Signup', async () => {
        const res = await axios.post(`${BASE_URL}/auth/signup`, {
            email: USER_EMAIL,
            password: USER_PASSWORD,
            name: USER_NAME
        });
        if (!res.data.success) throw new Error('Signup failed success check');
    });

    // 2. Login
    await runTest('Login', async () => {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: USER_EMAIL,
            password: USER_PASSWORD
        });
        if (!res.data.success || !res.data.data.token) throw new Error('Login failed success check');
        token = res.data.data.token;
        // Set default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    });

    // 3. Get Profile
    await runTest('Get Profile', async () => {
        const res = await axios.get(`${BASE_URL}/auth/profile`);
        if (!res.data.success || res.data.data.name !== USER_NAME) throw new Error(`Profile data mismatch. Expected name ${USER_NAME}, got ${res.data.data.name}`);
    });

    // 4. Create Class
    await runTest('Create Class', async () => {
        const res = await axios.post(`${BASE_URL}/classes`, {
            name: `Math 101 - ${TIMESTAMP}`,
            grade_level: "Grade 10",
            subject: "Mathematics"
        });
        if (!res.data.success) throw new Error('Create class failed');
        classId = res.data.data.id;
    });

    // 5. Get All Classes
    await runTest('Get All Classes', async () => {
        const res = await axios.get(`${BASE_URL}/classes`);
        if (!res.data.success) throw new Error('Get classes failed');
        const found = res.data.data.find(c => c.id === classId);
        if (!found) throw new Error('Created class not found in list');
    });

    // 6. Add Student
    await runTest('Add Student to Class', async () => {
        const res = await axios.post(`${BASE_URL}/classes/students`, {
            class_id: classId,
            name: "Jane Smith",
            student_id: `STU_${TIMESTAMP}`
        });
        if (!res.data.success) throw new Error('Add student failed');
    });

    // 7. Get Students in Class (Note: API path is /classes/:classId/students)
    await runTest('Get Students in Class', async () => {
        const res = await axios.get(`${BASE_URL}/classes/${classId}/students`);
        if (!res.data.success) throw new Error('Get students failed');
        if (res.data.data.length === 0) throw new Error('No students found');
        studentId = res.data.data[0].id; // Store for potential grading if needed, though not using grading today
    });

    // 8. Create Exam
    await runTest('Create Exam', async () => {
        const res = await axios.post(`${BASE_URL}/exams`, {
            name: `Midterm Exam - ${TIMESTAMP}`,
            class_id: classId,
            total_points: 100,
            exam_date: "2024-06-15",
            answer_key: {
                questions: [
                    {
                        question_number: 1,
                        correct_answer: "42",
                        points: 10
                    }
                ]
            }
        });
        if (!res.data.success) throw new Error('Create exam failed');
        examId = res.data.data.id;
    });

    // 9. Get All Exams
    await runTest('Get All Exams', async () => {
        const res = await axios.get(`${BASE_URL}/exams`);
        if (!res.data.success) throw new Error('Get exams failed');
        const found = res.data.data.find(e => e.id === examId);
        if (!found) throw new Error('Created exam not found in list');
    });

    // 10. Get Exam by ID
    await runTest('Get Exam by ID', async () => {
        const res = await axios.get(`${BASE_URL}/exams/${examId}`);
        if (!res.data.success) throw new Error('Get exam by ID failed');
        if (res.data.data.id !== examId) throw new Error('ID mismatch');
    });

    // 11. History
    await runTest('Get Activity History', async () => {
        const res = await axios.get(`${BASE_URL}/history`);
        if (!res.data.success) throw new Error('Get history failed');
    });

    console.log('\nAll tests completed.');
}

main();
