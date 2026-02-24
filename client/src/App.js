import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import SetupInterview from "./pages/SetupInterview";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setup" element={<SetupInterview />} />   {/* 👈 ADD THIS */}
        <Route path="/interview" element={<Interview />} />
      </Routes>
    </Router>
  );
}

export default App;