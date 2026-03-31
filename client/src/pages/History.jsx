import React, { useEffect, useState } from "react";

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("interviewHistory") || "[]");
    setHistory(saved);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1220] text-white p-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">Interview History</h1>

        {history.length === 0 ? (
          <p className="text-white/70">No interviews completed yet.</p>
        ) : (
          <div className="space-y-6">
            {history.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 p-6 rounded-xl border border-white/10"
              >
                <h2 className="text-xl font-semibold">
                  Score: {item.score} / 10
                </h2>

                <p className="text-white/70 mt-2">{item.summary}</p>

                <p className="text-sm text-white/40 mt-3">
                  {new Date(item.date).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}