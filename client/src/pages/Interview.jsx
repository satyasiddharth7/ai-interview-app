import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

function Interview() {
  const navigate = useNavigate();

  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("interviewProfile") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingStart, setLoadingStart] = useState(true);
  const [interviewDone, setInterviewDone] = useState(false);
  const [report, setReport] = useState(null);
  const [progress, setProgress] = useState({
    questionCount: 0,
    maxQuestions: 8,
  });

  const [cameraError, setCameraError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);

  const sendingLock = useRef(false);
  const hasStartedRef = useRef(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const typeWriterEffect = useCallback((fullText) => {
    return new Promise((resolve) => {
      const safeText = fullText || "";
      let index = 0;

      setMessages((prev) => [...prev, { sender: "ai", text: "" }]);

      const interval = setInterval(() => {
        index++;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: safeText.slice(0, index),
          };
          return updated;
        });

        if (index >= safeText.length) {
          clearInterval(interval);
          resolve();
        }
      }, 15);
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause?.();
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError("");

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      }

      setCameraOn(true);
    } catch (err) {
      console.error("Camera start error:", err);
      setCameraError("Camera permission denied or camera not available.");
      setCameraOn(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const finishInterview = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const token = await user.getIdToken();

      const res = await fetch("http://localhost:5000/api/interview/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to finish interview");
      }

      const finalReport = data.report || null;

      setReport(finalReport);
      setInterviewDone(true);

      if (finalReport) {
        localStorage.setItem("latestInterviewReport", JSON.stringify(finalReport));

        const history = JSON.parse(localStorage.getItem("interviewHistory") || "[]");
        history.unshift({
          score: finalReport.score,
          summary: finalReport.summary,
          date: Date.now(),
        });
        localStorage.setItem("interviewHistory", JSON.stringify(history));

        const oldReports = JSON.parse(localStorage.getItem("interviewReports") || "[]");
        oldReports.unshift({
          date: new Date().toISOString(),
          role: profile.profession || "Interview",
          name: profile.name || "Candidate",
          report: finalReport,
        });
        localStorage.setItem("interviewReports", JSON.stringify(oldReports));
      }

      const summaryText = finalReport
        ? `Interview complete.

Score: ${finalReport.score}/10

Summary: ${finalReport.summary || "Evaluation generated successfully."}`
        : "Interview complete. Final report generated.";

      await typeWriterEffect(summaryText);
    } catch (err) {
      console.error("Finish interview failed:", err);
      await typeWriterEffect(
        "Interview ended, but I could not generate the final report."
      );
      setInterviewDone(true);
    }
  }, [profile.name, profile.profession, typeWriterEffect]);

  const startInterview = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setLoadingStart(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("name", profile.name || "");
      formData.append("profession", profile.profession || "");
      formData.append("strength", profile.strength || "");

      const resumeFileData = localStorage.getItem("resumeFileData");
      const resumeFileName = localStorage.getItem("resumeFileName") || "resume.pdf";

      if (!resumeFileData) {
        throw new Error("Resume file not found in localStorage");
      }

      const byteString = atob(resumeFileData.split(",")[1]);
      const mimeString = resumeFileData.split(",")[0].split(":")[1].split(";")[0];

      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const file = new File([ab], resumeFileName, { type: mimeString });
      formData.append("resume", file);

      const res = await fetch("http://localhost:5000/api/interview/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start interview");
      }

      setProgress({
        questionCount: data.questionCount ?? 0,
        maxQuestions: data.maxQuestions || 8,
      });

      await typeWriterEffect(
        data.message ||
          data.question ||
          `Hello ${profile.name || "Candidate"} 👋 I can help you prepare for your ${
            profile.profession || "interview"
          }. Ask me anything, or say "start mock interview" to begin.`
      );
    } catch (err) {
      console.error("Start interview failed:", err);
      await typeWriterEffect("I couldn't start the interview. Please try again.");
    } finally {
      setLoadingStart(false);
    }
  }, [profile.name, profile.profession, profile.strength, typeWriterEffect]);

  useEffect(() => {
    if (!hasStartedRef.current) {
      startInterview();
    }
  }, [startInterview]);

  const handleSend = async () => {
    if (sendingLock.current || loadingStart || interviewDone) return;

    const userText = input.trim();
    if (!userText || isTyping) return;

    sendingLock.current = true;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsTyping(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const token = await user.getIdToken();

      const res = await fetch("http://localhost:5000/api/interview/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answer: userText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to send answer");
      }

      if (data.questionCount !== undefined && data.maxQuestions) {
        setProgress({
          questionCount: data.questionCount,
          maxQuestions: data.maxQuestions,
        });
      }

      let aiReply = "";

      if (data.feedback && data.nextQuestion) {
        aiReply = `Feedback: ${data.feedback}

${data.nextQuestion}`;
      } else if (data.nextQuestion) {
        aiReply = data.nextQuestion;
      } else if (data.feedback) {
        aiReply = data.feedback;
      } else if (data.message) {
        aiReply = data.message;
      } else if (data.reply) {
        aiReply = data.reply;
      } else if (data.done) {
        aiReply = "Interview complete.";
      } else {
        aiReply = "Let's continue.";
      }

      await typeWriterEffect(aiReply);

      if (data.done) {
        await finishInterview();
      }
    } catch (err) {
      console.error("AI reply failed:", err);
      await typeWriterEffect(
        "I couldn’t reach the AI server right now. Try again in a moment."
      );
    } finally {
      setIsTyping(false);
      sendingLock.current = false;
    }
  };

  const handleEndInterview = async () => {
    try {
      stopCamera();

      if (!interviewDone) {
        await finishInterview();
      }
    } catch (err) {
      console.error("End interview error:", err);
    } finally {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white flex">
      <div className="flex-1 flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-2 text-indigo-400">
          🤖 AI Interview Session
        </h2>

        <p className="text-sm text-slate-400 mb-4">
          Progress: {progress.questionCount}/{progress.maxQuestions}
        </p>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-lg p-4 rounded-2xl transition-all duration-300 ${
                msg.sender === "ai"
                  ? "bg-white/5 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  : "bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] ml-auto"
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-7">
                <span className="font-semibold">
                  {msg.sender === "ai" ? "AI: " : "You: "}
                </span>
                {msg.text}
              </p>
            </div>
          ))}

          {loadingStart && (
            <div className="max-w-lg p-4 rounded-2xl bg-white/5 border border-indigo-500/30">
              <p className="text-sm text-slate-300">
                AI is starting the interview...
              </p>
            </div>
          )}

          {isTyping && !loadingStart && (
            <div className="max-w-lg p-4 rounded-2xl bg-white/5 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">AI:</span>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div className="mt-4 flex gap-3 items-end">
          <textarea
            rows={2}
            placeholder={
              interviewDone
                ? "Interview completed"
                : 'Ask anything or type "start mock interview"...'
            }
            className="flex-1 p-3 rounded-xl bg-slate-900 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-none min-h-[56px] max-h-40 overflow-y-auto text-white leading-6"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping || loadingStart || interviewDone}
            onKeyDown={(e) => {
              if (e.repeat) return;

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            disabled={isTyping || loadingStart || interviewDone}
            className="px-6 h-[56px] rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:shadow-[0_0_30px_rgba(99,102,241,0.9)] disabled:opacity-60"
          >
            {loadingStart
              ? "Starting..."
              : isTyping
              ? "AI Thinking..."
              : interviewDone
              ? "Done"
              : "Send 🚀"}
          </button>

          <button
            onClick={handleEndInterview}
            className="px-5 h-[56px] rounded-xl font-semibold bg-red-600 hover:bg-red-500 transition-all duration-300 shadow-lg"
          >
            End
          </button>
        </div>
      </div>

      <div className="w-80 border-l border-indigo-500/20 p-6 hidden md:block">
        <div className="bg-white/5 backdrop-blur-lg border border-indigo-500/20 rounded-2xl p-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <h3 className="font-semibold mb-3 text-indigo-400">🎥 Webcam Preview</h3>

          <div className="h-52 bg-slate-900 rounded-xl overflow-hidden border border-indigo-500/20 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-xl bg-black"
            />

            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-xl">
                <div className="text-center px-4">
                  <p className="text-slate-300 text-sm">Camera is off</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Click Start Webcam to allow camera access
                  </p>
                </div>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="mt-3 text-xs text-red-400">{cameraError}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={startCamera}
              disabled={cameraOn}
              className="rounded-xl px-4 py-2.5 font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Start Webcam
            </button>

            <button
              onClick={stopCamera}
              disabled={!cameraOn}
              className="rounded-xl px-4 py-2.5 font-medium bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Stop Webcam
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white/5 backdrop-blur-lg border border-indigo-500/20 rounded-2xl p-4">
          <h3 className="font-semibold mb-2 text-indigo-400">📋 Interview Info</h3>
          <p className="text-sm text-slate-300">Name: {profile.name}</p>
          <p className="text-sm text-slate-300">Role: {profile.profession}</p>
          <p className="text-sm text-slate-300">Strength: {profile.strength}</p>
          <p className="text-sm text-slate-300 mt-2">
            Questions: {progress.questionCount}/{progress.maxQuestions}
          </p>
        </div>

        {report && (
          <div className="mt-6 bg-white/5 backdrop-blur-lg border border-indigo-500/20 rounded-2xl p-4">
            <h3 className="font-semibold mb-2 text-indigo-400">📊 Final Report</h3>
            <p className="text-sm text-slate-300 mb-2">
              Score: {report.score}/10
            </p>

            {report.summary && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-white">Summary</p>
                <p className="text-sm text-slate-300">{report.summary}</p>
              </div>
            )}

            {Array.isArray(report.strengths) && report.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-white">Strengths</p>
                <ul className="text-sm text-slate-300 list-disc ml-5">
                  {report.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(report.weak_points) && report.weak_points.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-white">Weak Points</p>
                <ul className="text-sm text-slate-300 list-disc ml-5">
                  {report.weak_points.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(report.suggestions) && report.suggestions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white">Suggestions</p>
                <ul className="text-sm text-slate-300 list-disc ml-5">
                  {report.suggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;