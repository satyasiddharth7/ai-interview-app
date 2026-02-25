const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server running successfully ✅");
});

app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});