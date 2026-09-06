const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    bot: "Hasindu MD",
    message: "Pairing service is online"
  });
});

app.listen(PORT, () => {
  console.log("================================");
  console.log("👑 HASINDU MD PAIRING SERVER");
  console.log("✅ Server Online");
  console.log(`🌐 Port: ${PORT}`);
  console.log("================================");
});
