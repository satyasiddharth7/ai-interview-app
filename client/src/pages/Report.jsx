import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Report() {
  const navigate = useNavigate();
  const location = useLocation();

  const report = useMemo(() => {
    if (location.state?.report) {
      return location.state.report;
    }

    try {
      return JSON.parse(localStorage.getItem("latestInterviewReport") || "null");
    } catch {
      return null;
    }
  }, [location.state]);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220] text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">No report found</h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-2 bg-indigo-500 hover:bg-indigo-400 px-5 py-3 rounded-xl font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📊 Interview Report</h1>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-400 mb-2">Final Score</h2>
          <p className="text-3xl font-bold">{report.score}/10</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-400 mb-2">Summary</h2>
          <p className="text-white/80 leading-7">{report.summary || "No summary available."}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-400 mb-3">Strengths</h2>
          {Array.isArray(report.strengths) && report.strengths.length > 0 ? (
            <ul className="list-disc ml-5 space-y-2 text-white/80">
              {report.strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-white/60">No strengths found.</p>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-400 mb-3">Weak Points</h2>
          {Array.isArray(report.weak_points) && report.weak_points.length > 0 ? (
            <ul className="list-disc ml-5 space-y-2 text-white/80">
              {report.weak_points.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-white/60">No weak points found.</p>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-indigo-400 mb-3">Suggestions</h2>
          {Array.isArray(report.suggestions) && report.suggestions.length > 0 ? (
            <ul className="list-disc ml-5 space-y-2 text-white/80">
              {report.suggestions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-white/60">No suggestions found.</p>
          )}
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="bg-indigo-500 hover:bg-indigo-400 px-6 py-3 rounded-xl font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}