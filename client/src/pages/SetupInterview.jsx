import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SetupInterview() {
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [strength, setStrength] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleStart = async (e) => {
    e.preventDefault();

    try {
      if (!resumeFile) {
        alert("Please upload resume PDF (required).");
        return;
      }

      setUploading(true);

      const profile = { name, profession, strength };
      localStorage.setItem("interviewProfile", JSON.stringify(profile));

      const base64File = await fileToBase64(resumeFile);
      localStorage.setItem("resumeFileData", base64File);
      localStorage.setItem("resumeFileName", resumeFile.name);

      setUploading(false);
      navigate("/interview");
    } catch (err) {
      setUploading(false);
      console.error("Setup failed:", err);
      alert("Something went wrong while preparing interview data.");
    }
  };

  return (
    <div className="min-h-screen bg-[#060A14] text-white relative overflow-hidden">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              AI Interview Setup
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              Configure your interview
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Upload resume (PDF) so AI can ask smarter questions.
            </p>
          </div>

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="text-sm text-white/70">Your Name</label>
              <input
                className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="e.g. Elon Musk"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Your Profession</label>
              <input
                className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="e.g. Frontend Developer"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Core Strength</label>
              <input
                className="mt-2 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="e.g. React, Problem Solving"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/70">
                Upload Resume (PDF) <span className="text-red-400">*</span>
              </label>

              <input
                type="file"
                accept="application/pdf"
                className="mt-2 block w-full text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white file:hover:bg-white/20"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (file.type !== "application/pdf") {
                    alert("Only PDF allowed.");
                    e.target.value = "";
                    return;
                  }

                  if (file.size > 5 * 1024 * 1024) {
                    alert("File size must be under 5MB.");
                    e.target.value = "";
                    return;
                  }

                  setResumeFile(file);
                }}
              />

              {resumeFile && (
                <p className="mt-2 text-xs text-white/50">
                  Selected: {resumeFile.name}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 font-semibold text-black hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
            >
              {uploading ? "Preparing Interview..." : "Start AI Interview →"}
            </button>
          </form>

          <p className="mt-5 text-xs text-white/40">
            Tip: PDF only. Keep resume under 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}