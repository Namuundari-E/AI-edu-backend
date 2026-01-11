# API Testing Guide

## Base URL
```
http://localhost:3010/api
```

## 1. Authentication Endpoints

### Signup
**POST** `/auth/signup`

**Request Body:**
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "teacher@example.com",
    "name": "John Doe"
  }
}
```x

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "teacher@example.com",
      "name": "John Doe"
    }
  }
}
```

### Get Profile
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## 2. Class Endpoints

### Create Class
**POST** `/classes`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Math 101",
  "grade_level": "Grade 10",
  "subject": "Mathematics"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "id": "uuid",
    "class_name": "Math 101",
    "grade_level": "Grade 10",
    "subject": "Mathematics",
    "teacher_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get All Classes
**GET** `/classes`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "class_name": "Math 101",
      "grade_level": "Grade 10",
      "subject": "Mathematics",
      "teacher_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "students": [{ "count": 25 }]
    }
  ]
}
```

### Add Student to Class
**POST** `/classes/students`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "class_id": "uuid",
  "name": "Jane Smith",
  "student_id": "STU001"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student added successfully",
  "data": {
    "id": "uuid",
    "class_id": "uuid",
    "student_name": "Jane Smith",
    "student_id": "STU001",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get Students in Class
**GET** `/classes/:classId/students`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "class_id": "uuid",
      "student_name": "Jane Smith",
      "student_id": "STU001",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 3. Exam Endpoints

### Create Exam
**POST** `/exams`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Midterm Exam",
  "class_id": "uuid",
  "total_points": 100,
  "exam_date": "2024-06-15",
  "answer_key": {
    "questions": [
      {
        "question_number": 1,
        "correct_answer": "42",
        "points": 10
      }
    ]
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Exam created successfully",
  "data": {
    "id": "uuid",
    "exam_name": "Midterm Exam",
    "class_id": "uuid",
    "total_points": 100,
    "exam_date": "2024-06-15",
    "answer_key": { ... },
    "teacher_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get All Exams
**GET** `/exams`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "exam_name": "Midterm Exam",
      "total_points": 100,
      "exam_date": "2024-06-15",
      "class": {
        "class_name": "Math 101",
        "grade_level": "Grade 10"
      },
      "submissions": [{ "count": 15 }]
    }
  ]
}
```

### Get Exam by ID
**GET** `/exams/:examId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "uuid",
    "exam_name": "Midterm Exam",
    "total_points": 100,
    "exam_date": "2024-06-15",
    "answer_key": { ... },
    "class": {
      "class_name": "Math 101",
      "grade_level": "Grade 10"
    },
    "submissions": [ ... ]
  }
}
```

## 4. Grading Endpoints

### Grade Exam (with file upload)
**POST** `/grades/grade`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
exam_id: uuid
student_id: uuid
file: <image file>
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Exam graded successfully",
  "data": {
    "id": "uuid",
    "exam_id": "uuid",
    "student_id": "uuid",
    "submission_image_url": "/uploads/exams/filename.jpg",
    "graded_score": 85.5,
    "feedback": "Good work!",
    "status": "graded",
    "graded_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get Grades
**GET** `/grades?exam_id=uuid` (optional query param)

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "graded_score": 85.5,
      "feedback": "Good work!",
      "status": "graded",
      "student": {
        "student_name": "Jane Smith",
        "student_id": "STU001"
      },
      "exam": {
        "exam_name": "Midterm Exam",
        "total_points": 100
      }
    }
  ]
}
```

## 5. Activity Log Endpoint

### Get Activity History
**GET** `/history?limit=50` (optional query param)

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "teacher_id": "uuid",
      "activity_type": "CREATE_CLASS",
      "description": "Created class: Math 101",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "teacher_id": "uuid",
      "activity_type": "ADD_STUDENT",
      "description": "Added student: Jane Smith to class",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Email, password, and name are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Teacher not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Signup failed"
}
```

## Testing with cURL

### Signup
```bash
curl -X POST http://localhost:3010/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Profile (replace TOKEN)
```bash
curl -X GET http://localhost:3010/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Create Class (replace TOKEN)
```bash
curl -X POST http://localhost:3010/api/classes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Math 101",
    "grade_level": "Grade 10",
    "subject": "Mathematics"
  }'
```

## Testing with Postman

1. Import the endpoints into Postman
2. Create an environment variable `token` 
3. After login, save the token to the environment
4. Use `{{token}}` in Authorization headers

## CORS Configuration

The backend now accepts requests from any origin with:
- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers: Content-Type, Authorization
- Credentials: true

**Note:** For production, update the CORS origin in `src/app.js` to your specific frontend domain.
