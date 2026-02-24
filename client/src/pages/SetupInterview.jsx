import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function SetupInterview() {
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [strength, setStrength] = useState("");

  const navigate = useNavigate();

  const handleStart = () => {
  const data = { name, profession, strength };
  localStorage.setItem("interviewProfile", JSON.stringify(data));

  navigate("/interview");
};


  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Interview Setup</h2>

      <input
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Your Profession"
        value={profession}
        onChange={(e) => setProfession(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Your Core Strength"
        value={strength}
        onChange={(e) => setStrength(e.target.value)}
      />

      <br /><br />

      <button onClick={handleStart}>Start AI Interview</button>
    </div>
  );
}

export default SetupInterview;