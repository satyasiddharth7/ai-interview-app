import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  /* clear previous user data */
  const clearLocalInterviewData = () => {
    localStorage.removeItem("interviewProfile");
    localStorage.removeItem("latestInterviewReport");
    localStorage.removeItem("interviewHistory");
    localStorage.removeItem("interviewReports");
    localStorage.removeItem("resumeFileData");
    localStorage.removeItem("resumeFileName");
    localStorage.removeItem("firstQuestion");
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      if (name?.trim()) {
        await updateProfile(res.user, { displayName: name.trim() });
      }

      /* clear old user dashboard data */
      clearLocalInterviewData();

      setMessage("✅ Account created successfully! Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setMessage("");

    try {
      await signInWithPopup(auth, googleProvider);

      /* clear old user dashboard data */
      clearLocalInterviewData();

      setMessage("✅ Signed in with Google successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center px-4">

      {/* background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="p-8">

          <h1 className="text-3xl font-bold tracking-tight">
            Create Account <span className="align-middle">✨</span>
          </h1>

          <p className="mt-2 text-white/70">
            Join and start your AI interview training
          </p>

          {/* Success message */}
          {message && (
            <div className="mt-4 p-3 text-sm bg-green-500/20 border border-green-400/30 rounded-lg text-green-300">
              {message}
            </div>
          )}

          {/* Google signup */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 transition py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            type="button"
          >
            <span className="inline-block h-5 w-5 rounded-full bg-white/90 text-black font-bold flex items-center justify-center">
              G
            </span>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/50">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Email signup */}
          <form className="space-y-4" onSubmit={handleEmailSignup}>

            <div>
              <label className="text-sm text-white/80">Name</label>
              <input
                className="mt-2 w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400/60"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-white/80">Email</label>
              <input
                className="mt-2 w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400/60"
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/80">Password</label>
              <input
                className="mt-2 w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400/60"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-2 text-xs text-white/50">
                Tip: use 8+ chars for better security.
              </p>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 transition py-3 font-semibold disabled:opacity-60"
              type="submit"
            >
              {loading ? "Creating..." : "Create account"}
            </button>

          </form>

          <p className="mt-6 text-center text-white/70">
            Already have an account?{" "}
            <Link className="text-indigo-300 hover:text-indigo-200" to="/login">
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}