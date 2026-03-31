import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SetupInterview from "./pages/SetupInterview";
import Interview from "./pages/Interview";
import Report from "./pages/Report";
import History from "./pages/History";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setup" element={<SetupInterview />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/report" element={<Report />} />
        <Route path="/history" element={<History />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}