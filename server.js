const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`
    <h1>👑 Hasindu MD</h1>
    <p>WhatsApp Pairing Service</p>
  `);
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    bot: "Hasindu MD"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Hasindu MD Pairing Server running on port ${PORT}`);
});
