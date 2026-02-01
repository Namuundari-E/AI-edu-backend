const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const gradeExamWithLLM = async (exam, submissionImagePath) => {
    try {
        // Read the image file
        const imagePath = path.join(__dirname, '../../', submissionImagePath);
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Determine media type
        const ext = path.extname(imagePath).toLowerCase();
        const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

        const prompt = `You are an expert math teacher grading a student's exam. 

EXAM DETAILS:
- Title: ${exam.exam_name || exam.title}
- Total Marks: ${exam.total_points || exam.total_marks}
- Correct Answers/Rubric: ${JSON.stringify(exam.answer_key || exam.questions)}

INSTRUCTIONS:
1. Look at the top-right corner of the paper. You will see 3 separate boxes for 'Student Code'.
2. Identify the 3-digit numeric code written inside those boxes (one digit per box).
3. Analyze the handwritten answers for each question.
4. The text is in Mongolian language - read it carefully.
5. Check each answer against the correct solution/rubric provided.
6. Provide marks for each question.
7. Give constructive feedback in Mongolian.

Please respond ONLY with a valid JSON object in this format:
{
  "student_code": "3-digit-string (e.g., '852')",
  "score": <total marks obtained>,
  "question_results": [
    {
      "question_number": 1,
      "marks_awarded": <marks>,
      "max_marks": <max>,
      "is_correct": <true/false>,
      "feedback": "feedback in Mongolian"
    }
  ],
  "feedback": "Overall feedback in Mongolian"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mediaType};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;

    } catch (error) {
        console.error('GPT-4o grading error:', error);

        return {
            score: 0,
            question_results: [],
            feedback: 'Автомат шалгалт амжилтгүй боллоо. (GPT API Error)'
        };
    }
};

const generateExamWithLLM = async (topic, difficulty) => {
    try {
        const prompt = `You are an experienced HIGH SCHOOL mathematics teacher.

Create a ${difficulty} difficulty written exam for 10–12th grade students on the topic "${topic}".

Requirements:
- Exactly 5 math problems (no multiple choice), suitable for high school level.
- Problems must be in MONGOLIAN language.
- Each question's "text" should be clear and self-contained.
- Each "answer" should be a short final numeric or algebraic answer (no long explanation).

Respond ONLY with a valid JSON object in this exact format:
{
  "name": "${topic} Шалгалт",
  "questions": [
    { "text": "Асуулт 1-ийн текст...", "answer": "Хариулт 1" },
    { "text": "Асуулт 2-ийн текст...", "answer": "Хариулт 2" },
    { "text": "Асуулт 3-ийн текст...", "answer": "Хариулт 3" },
    { "text": "Асуулт 4-ийн текст...", "answer": "Хариулт 4" },
    { "text": "Асуулт 5-ийн текст...", "answer": "Хариулт 5" }
  ],
  "answer_key": {
    "1": "Хариулт 1",
    "2": "Хариулт 2",
    "3": "Хариулт 3",
    "4": "Хариулт 4",
    "5": "Хариулт 5"
  }
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;

    } catch (error) {
        console.error('GPT-4o generation error:', error);
        throw error;
    }
};

module.exports = { gradeExamWithLLM, generateExamWithLLM };
