import React, { useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/"); // redirect to login if not logged in
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
  <h1>Welcome to AI Interview App</h1>

  <button onClick={() => navigate("/setup")}>Start AI Interview</button>

  <br /><br />

  <button onClick={handleLogout}>Logout</button>
</div>
  );
}

export default Dashboard;