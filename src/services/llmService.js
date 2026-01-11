const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
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
- Title: ${exam.title}
- Total Marks: ${exam.total_marks}
- Questions: ${JSON.stringify(exam.questions)}

INSTRUCTIONS:
1. Carefully analyze the handwritten answers in the image
2. The text is in Mongolian language - read it carefully
3. Check each answer against the correct solution
4. Provide marks for each question
5. Give constructive feedback in Mongolian

Please respond in this JSON format:
{
  "marks_obtained": <total marks>,
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

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mediaType,
                            data: base64Image,
                        },
                    },
                    {
                        type: 'text',
                        text: prompt
                    }
                ],
            }],
        });

        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Failed to parse LLM response');
    } catch (error) {
        console.error('LLM grading error:', error);

        return {
            marks_obtained: 0,
            question_results: [],
            feedback: 'Автомат шалгалт амжилтгүй боллоо. Гараар шалгана уу.'
        };
    }
};

module.exports = { gradeExamWithLLM };