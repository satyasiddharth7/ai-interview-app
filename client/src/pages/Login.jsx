import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setMessage("Login failed: " + err.message);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center px-4">
      {/* background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl"></div>
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome Back 👋
          </h1>

          <p className="mt-2 text-white/70">
            Login to continue your AI interview training
          </p>

          {message && (
            <div className="mt-4 text-sm bg-white/10 border border-white/20 p-3 rounded-lg">
              {message}
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <p
                onClick={handleForgotPassword}
                className="text-sm text-indigo-300 hover:text-indigo-200 cursor-pointer mt-2"
              >
                Forgot Password?
              </p>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 transition py-3 font-semibold disabled:opacity-60"
              type="submit"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-white/70">
            Don’t have an account?{" "}
            <Link
              className="text-indigo-300 hover:text-indigo-200"
              to="/register"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}