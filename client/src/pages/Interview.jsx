import React, { useState } from "react";
import { useLocation } from "react-router-dom";

function Interview() {
  const location = useLocation();
  const saved = JSON.parse(localStorage.getItem("interviewProfile") || "{}");
const { name, profession, strength } = saved;

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Hello ${name || "Candidate"}! Let's begin your ${profession || ""} interview.`
    }
  ]);

  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input) return;

    const newMessages = [
      ...messages,
      { sender: "user", text: input },
      { sender: "ai", text: "Interesting answer. Can you explain more?" }
    ];

    setMessages(newMessages);
    setInput("");
  };

  return (
    <div style={{ width: "60%", margin: "50px auto" }}>
      <h2>AI Interview Chat</h2>

      <div style={{ border: "1px solid gray", padding: "20px", minHeight: "300px" }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.sender === "ai" ? "left" : "right",
              marginBottom: "10px"
            }}
          >
            <strong>{msg.sender === "ai" ? "AI" : "You"}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <br />

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your answer..."
        style={{ width: "80%", padding: "10px" }}
      />

      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default Interview;