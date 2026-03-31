const express = require("express");
const cors = require("cors");
require("dotenv").config();

const admin = require("./firebaseAdmin");
const authMiddleware = require("./middleware/auth");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { extractResumeText } = require("./utils/resumeText");
const { GoogleGenAI } = require("@google/genai");

/* ================= APP ================= */

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

/* ================= GEMINI ================= */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function safeJsonParse(text) {
  try {
    if (!text || typeof text !== "string") {
      throw new Error("Empty response");
    }

    const cleaned = text.trim();

    try {
      return JSON.parse(cleaned);
    } catch (_) {}

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const objectCandidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(objectCandidate);
      } catch (_) {}
    }

    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const arrayCandidate = cleaned.slice(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(arrayCandidate);
      } catch (_) {}
    }

    throw new Error("No valid JSON found");
  } catch (err) {
    console.error("Invalid JSON from Gemini:", text);
    throw new Error("Gemini returned invalid JSON");
  }
}

async function generateJson(systemInstruction, prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.6,
      maxOutputTokens: 1600,
    },
  });

  const text = response.text?.trim() || "{}";
  return safeJsonParse(text);
}

/* ================= FILE UPLOAD ================= */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) =>
      cb(null, Date.now() + "-" + file.originalname),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ================= SESSION ================= */

const sessions = new Map();
const sessionKey = (uid) => `interview:${uid}`;

function extractQuestionCount(text) {
  const lower = (text || "").toLowerCase();
  const match = lower.match(/(\d+)\s*(question|questions)/);

  if (match) {
    const count = parseInt(match[1], 10);
    if (!isNaN(count) && count > 0) {
      return count;
    }
  }

  return null;
}

/* ================= HEALTH ================= */

app.get("/api/health", (req, res) => {
  res.json({ message: "Backend working ✅" });
});

/* ================= START INTERVIEW ================= */

app.post(
  "/api/interview/start",
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    let uploadedPath = null;

    try {
      const name = (req.body.name || "").trim();
      const profession = (req.body.profession || "").trim();
      const strength = (req.body.strength || "").trim();

      if (!req.file) {
        return res.status(400).json({ error: "Resume file required" });
      }

      uploadedPath = req.file.path;
      const resumeText = await extractResumeText(uploadedPath);

      sessions.set(sessionKey(req.user.uid), {
        name,
        profession,
        strength,
        resumeText,
        transcript: [],
        questionCount: 0,
        maxQuestions: 8,
        mode: "chat",
        startedAt: Date.now(),
      });

      const data = await generateJson(
        `You are an AI interview assistant.

Respond ONLY in valid JSON format:
{
  "message": "text"
}

Rules:
- greet the candidate warmly
- say you can help with interview preparation
- mention you can start a mock interview when the user asks
- do NOT ask interview questions yet`,
        `
Candidate Name: ${name}
Target Role: ${profession}
Strength: ${strength}

Resume:
${resumeText.slice(0, 8000)}
`
      );

      const session = sessions.get(sessionKey(req.user.uid));

      const welcomeMessage =
        data.message ||
        `Hello ${name || "Candidate"}! I can help you prepare for your ${profession || "interview"}. Ask me anything, or say "start mock interview" to begin.`;

      session.transcript.push({
        role: "ai",
        content: welcomeMessage,
      });

      return res.json({
        ok: true,
        message: welcomeMessage,
        mode: "chat",
        questionCount: 0,
        maxQuestions: 8,
      });
    } catch (err) {
      console.error("Start interview error:", err);
      res.status(500).json({
        error: "Failed to start interview",
        details: err.message,
      });
    } finally {
      if (uploadedPath) {
        try {
          fs.unlinkSync(uploadedPath);
        } catch {}
      }
    }
  }
);

/* ================= MESSAGE ================= */

app.post("/api/interview/message", authMiddleware, async (req, res) => {
  try {
    const { answer } = req.body;
    const session = sessions.get(sessionKey(req.user.uid));

    if (!session) {
      return res.status(400).json({ error: "No active session" });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({ error: "Answer required" });
    }

    const userText = answer.trim();

    session.transcript.push({
      role: "user",
      content: userText,
    });

    const lower = userText.toLowerCase();

    const startInterview =
      lower.includes("start interview") ||
      lower.includes("mock interview") ||
      lower.includes("take interview") ||
      lower.includes("begin interview") ||
      lower.includes("ask questions") ||
      lower.includes("start mock") ||
      lower.includes("take a mock") ||
      lower.includes("start test");

    /* ========= CHAT MODE ========= */

    if (session.mode === "chat") {
      if (!startInterview) {
        const data = await generateJson(
          `You are an AI interview assistant.

Respond ONLY in valid JSON:
{
  "reply": "text"
}

Rules:
- help the user prepare for interviews
- answer their questions clearly
- keep the answer useful and concise
- if they ask to start interview, suggest starting mock interview`,
          `
Candidate role: ${session.profession}
Candidate strength: ${session.strength}

Resume:
${session.resumeText.slice(0, 6000)}

User message:
${userText}
`
        );

        const reply =
          data.reply ||
          "Sure — I can help you prepare. Ask me about interview topics, or say 'start mock interview' to begin.";

        session.transcript.push({
          role: "ai",
          content: reply,
        });

        return res.json({
          ok: true,
          message: reply,
          mode: "chat",
          questionCount: session.questionCount,
          maxQuestions: session.maxQuestions,
        });
      }

      const requestedCount = extractQuestionCount(userText);

      if (requestedCount) {
        session.maxQuestions = requestedCount;
      } else {
        session.maxQuestions = 8;
      }

      session.mode = "interview";
      session.questionCount = 1;

      const data = await generateJson(
        `You are a mock interviewer.

Respond ONLY JSON:
{
  "question": "text"
}

Rules:
- ask exactly one first interview question
- base it on the candidate role, strength, and resume
- do not give feedback yet
- keep it clear and professional`,
        `
Candidate Name: ${session.name}
Candidate Role: ${session.profession}
Candidate Strength: ${session.strength}

Resume:
${session.resumeText.slice(0, 8000)}
`
      );

      const firstQuestion =
        data.question ||
        "Tell me about yourself and your experience related to this role.";

      session.transcript.push({
        role: "ai",
        content: firstQuestion,
      });

      return res.json({
        ok: true,
        nextQuestion: firstQuestion,
        questionCount: session.questionCount,
        maxQuestions: session.maxQuestions,
        mode: "interview",
        done: false,
      });
    }

    /* ========= INTERVIEW MODE ========= */

    if (session.questionCount >= session.maxQuestions) {
      return res.json({
        ok: true,
        done: true,
        questionCount: session.questionCount,
        maxQuestions: session.maxQuestions,
        mode: "interview",
      });
    }

    const data = await generateJson(
      `You are an AI mock interviewer.

Respond ONLY JSON:
{
  "feedback": "text",
  "next_question": "text",
  "done": false
}

Rules:
- feedback short and encouraging
- ask ONE next interview question
- never repeat earlier questions
- base questions on the role, resume, and previous answers
- if interview should end, set "done" to true and "next_question" to null`,
      `
Candidate role: ${session.profession}
Candidate strength: ${session.strength}

Resume:
${session.resumeText.slice(0, 8000)}

Conversation:
${session.transcript
  .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
  .join("\n")
  .slice(0, 8000)}
`
    );

    if (data.done) {
      return res.json({
        ok: true,
        feedback: data.feedback || "Good job. The interview is complete.",
        nextQuestion: null,
        questionCount: session.questionCount,
        maxQuestions: session.maxQuestions,
        done: true,
        mode: "interview",
      });
    }

    session.questionCount++;

    const nextQuestion =
      data.next_question || "Can you explain that with a practical example?";

    session.transcript.push({
      role: "ai",
      content: nextQuestion,
    });

    return res.json({
      ok: true,
      feedback: data.feedback || "Good attempt. Let's continue.",
      nextQuestion,
      questionCount: session.questionCount,
      maxQuestions: session.maxQuestions,
      done: session.questionCount >= session.maxQuestions,
      mode: "interview",
    });
  } catch (err) {
    console.error("Message error:", err);
    res.status(500).json({
      error: "Message failed",
      details: err.message,
    });
  }
});

/* ================= FINISH ================= */

app.post("/api/interview/finish", authMiddleware, async (req, res) => {
  try {
    const session = sessions.get(sessionKey(req.user.uid));

    if (!session) {
      return res.status(400).json({ error: "No session" });
    }

    const conversationText = session.transcript
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");

    const report = await generateJson(
      `You are an interview evaluator.

Respond ONLY JSON:
{
  "score": 0,
  "summary": "text",
  "strengths": [],
  "weak_points": [],
  "suggestions": []
}

Rules:
- score must be a number from 0 to 10
- summary should be short and professional
- strengths must be an array of short strings
- weak_points must be an array of short strings
- suggestions must be an array of short strings`,
      `
Interview Transcript:
${conversationText.slice(0, 12000)}
`
    );

    sessions.delete(sessionKey(req.user.uid));

    return res.json({
      ok: true,
      report,
    });
  } catch (err) {
    console.error("Finish error:", err);
    res.status(500).json({
      error: "Finish failed",
      details: err.message,
    });
  }
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));