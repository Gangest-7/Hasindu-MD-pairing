const express = require("express");
const pino = require("pino");
const mongoose = require("mongoose");
const fs = require("fs");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  delay
} = require("@whiskeysockets/baileys");

const SessionModel = require("./models/session");

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URL = process.env.MONGO_URL;

app.use(express.json());
app.use(express.static("public"));

if (MONGO_URL) {
  mongoose.connect(MONGO_URL)
    .then(() => console.log("🍃 MongoDB Connected Successfully!"))
    .catch(err => console.error("❌ MongoDB Error:", err));
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/api/pair", async (req, res) => {
  let phone = String(req.body.phone || "").replace(/[^0-9]/g, "");

  if (!phone) {
    return res.status(400).json({ error: "WhatsApp number එක ඇතුළත් කරන්න." });
  }

  if (phone.startsWith("0")) {
    phone = "94" + phone.substring(1);
  }

  console.log("📱 New Pairing Request For Number:", phone);

  const sessionDir = "./session";
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionDir, { recursive: true });
  } catch (e) {
    console.error("Session clean error:", e);
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: Browsers.ubuntu("Chrome"),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      connectTimeoutMs: 60000
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection } = update;
      console.log("📡 Pairing status:", connection || "connecting");

      if (connection === "open") {
        console.log("✅ PAIRING SUCCESSFUL!");
        console.log("💾 Saving session to MongoDB...");

        try {
          await delay(3000);
          if (fs.existsSync("./session/creds.json")) {
            const credsData = JSON.parse(fs.readFileSync("./session/creds.json", "utf-8"));
            await SessionModel.findOneAndUpdate(
              { id: "hasindu_session" },
              { sessionData: credsData, updatedAt: Date.now() },
              { upsert: true, new: true }
            );
            console.log("🍃 Session stored in MongoDB Database!");
          }
        } catch (err) {
          console.error("❌ Failed to save session to DB:", err);
        }

        await delay(2000);
        try { await sock.end(undefined); } catch (e) {}
      }
    });

    await delay(4000);

    const code = await sock.requestPairingCode(phone);
    console.log("🔑 Pairing Code Generated:", code);

    if (!res.headersSent) {
      res.json({ success: true, code });
    }

  } catch (err) {
    console.error("❌ Pairing Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Pairing code එක ගැනීමට නොහැකි විය." });
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("👑 HASINDU MD PAIRING SERVER RUNNING ON PORT:", PORT);
});
