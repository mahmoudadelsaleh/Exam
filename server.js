import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
// لتقديم صفحة الـ HTML من مجلد public
app.use(express.static('public'));

app.post('/api/generate-quiz', async (req, res) => {
    const { grade, subject, lesson, numQuestions, marksPerQuestion, allowEssay } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: "مفتاح API غير متوفر" });

    const prompt = `
    أنت معلم ${subject} خبير للصف ${grade}.
    قم بإعداد اختبار عن درس: ${lesson}.
    التعليمات:
    1. عدد الأسئلة: ${numQuestions} (كل سؤال عليه ${marksPerQuestion} درجة).
    2. هل تتضمن أسئلة مقالية؟ ${allowEssay ? "نعم، اجعل بعض الأسئلة مقالية" : "لا، جميع الأسئلة اختيار من متعدد فقط"}.
    3. أرجع النتيجة بصيغة JSON فقط تحتوي على مصفوفة أسئلة. كل سؤال له الخصائص التالية:
       - questionText: نص السؤال
       - options: مصفوفة من 4 خيارات (اتركها فارغة إذا كان السؤال مقالياً)
       - correctAnswer: الإجابة الصحيحة للتصحيح التلقائي
       - isEssay: قيمة منطقية (true/false)
    `;

    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gemini-3.5-flash",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        res.json(JSON.parse(content));
    } catch (error) {
        res.status(500).json({ error: "حدث خطأ أثناء توليد الاختبار" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`الخادم يعمل على http://localhost:${PORT}`));
