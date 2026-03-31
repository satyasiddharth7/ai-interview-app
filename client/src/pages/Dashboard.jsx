import React, { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("Friend");
  const [spot, setSpot] = useState({ x: 0, y: 0, show: false });

  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("interviewProfile") || "{}");
    } catch {
      return {};
    }
  }, []);

  const latestReport = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("latestInterviewReport") || "null");
    } catch {
      return null;
    }
  }, []);

  const interviewHistory = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("interviewReports") || "[]");
    } catch {
      return [];
    }
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      show: true,
    });
  };

  const handleMouseLeave = () => {
    setSpot((s) => ({ ...s, show: false }));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setName("Friend");
        return;
      }

      if (user.displayName) setName(user.displayName);
      else if (user.email) setName(user.email.split("@")[0]);

      try {
        const token = await user.getIdToken();

        await fetch("http://localhost:5000/api/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error("ME TEST FAILED:", err);
      }
    });

    return () => unsubscribe();
  }, []);

  const lastScoreText = latestReport?.score !== undefined
    ? `${latestReport.score} / 10`
    : "No report yet";

  return (
    <div
      className="min-h-screen bg-[#0B1220] text-white px-6 py-10 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spot.show ? 1 : 0,
          background: `radial-gradient(650px circle at ${spot.x}px ${spot.y}px, rgba(99,102,241,0.18), transparent 55%)`,
        }}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Welcome back, {name} <span className="align-middle">👋</span>
            </h1>
            <p className="mt-2 text-white/70">
              Ready to sharpen your interview skills?
            </p>
          </div>

          <button
            onClick={() => navigate("/setup")}
            className="rounded-xl bg-indigo-500 hover:bg-indigo-400 transition px-5 py-3 font-semibold shadow-lg shadow-indigo-500/20 w-full md:w-auto"
          >
            Start New Interview 🚀
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card
            title="🎯 Target Role"
            value={profile.profession || "Not set"}
            onClick={() => navigate("/setup")}
          />
          <Card
            title="💪 Core Strength"
            value={profile.strength || "Not set"}
            onClick={() => navigate("/setup")}
          />
          <Card
            title="📊 Last Score"
            value={lastScoreText}
            onClick={() => navigate("/report")}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <BigCard
            title="🤖 Smart AI Questions"
            desc="Personalized interview questions based on your profile."
            onClick={() => navigate("/interview")}
          />
          <BigCard
            title="📈 Performance Analytics"
            desc={
              latestReport
                ? `Latest score: ${lastScoreText}. Click to view full report.`
                : "Feedback + improvement suggestions after each session."
            }
            onClick={() => navigate("/report")}
          />
          <BigCard
            title="🗂️ Interview History"
            desc={
              interviewHistory.length > 0
                ? `${interviewHistory.length} interview record(s) saved. Click to view history.`
                : "Track your previous interviews and monitor growth."
            }
            onClick={() => navigate("/history")}
          />
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl transition hover:bg-white/10 hover:border-white/20 text-left w-full cursor-pointer"
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-xl transition group-hover:opacity-100 bg-gradient-to-r from-indigo-500/20 via-cyan-400/10 to-purple-500/20" />
      <div className="relative">
        <div className="text-white/90 font-semibold">{title}</div>
        <div className="mt-2 text-white/70">{value}</div>
      </div>
    </button>
  );
}

function BigCard({ title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-7 shadow-2xl transition hover:bg-white/10 hover:border-white/20 text-left w-full cursor-pointer"
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-xl transition group-hover:opacity-100 bg-gradient-to-r from-indigo-500/20 via-cyan-400/10 to-purple-500/20" />
      <div className="relative">
        <div className="text-xl font-semibold">{title}</div>
        <p className="mt-2 text-white/70 leading-relaxed">{desc}</p>
      </div>
    </button>
  );
}