import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Environment Variables =====
let SERVICE_SECRET = process.env.RMS_SERVICE_SECRET;
let LICENSE_KEY = process.env.RMS_LICENSE_KEY;

// HMAC 署名
function generateSignature(secret, licenseKey, timestamp) {
  const text = `${licenseKey}:${timestamp}`;
  return crypto.createHmac("sha256", secret).update(text).digest("hex");
}

// RMS API 共通ヘッダー
function buildHeaders() {
  const timestamp = new Date().toISOString();
  const signature = generateSignature(SERVICE_SECRET, LICENSE_KEY, timestamp);

  return {
    "Content-Type": "application/json",
-   "Authorization": `ESA ${signature}`,
+   "Authorization": `ESA ${LICENSE_KEY}:${signature}`,
    "X-RMS-Timestamp": timestamp
  };
}

// ---- Test ----
app.get("/api/test", (req, res) => res.json({ message: "API OK" }));

// ---- Cabinet フォルダ一覧 ----
app.get("/folders", async (req, res) => {
  if (!SERVICE_SECRET || !LICENSE_KEY) {
    return res.status(500).json({
      error: "Missing Environment Variables",
      RMS_SERVICE_SECRET: SERVICE_SECRET ? "SET" : "MISSING",
      RMS_LICENSE_KEY: LICENSE_KEY ? "SET" : "MISSING"
    });
  }

  const url = "https://api.rms.rakuten.co.jp/es/2.0/cabinet/folders/get";

  try {
    const response = await fetch(url, {
  method: "POST",
  headers: buildHeaders(),
+ body: JSON.stringify({
+   shopUrl: process.env.RMS_SHOP_URL   // ← 必須
+ })
});


    const raw = await response.text();

    try {
      const json = JSON.parse(raw);
      return res.json(json);
    } catch {
      return res.status(500).json({
        error: "Invalid / non-JSON response from RMS API",
        raw_response_preview: raw.substring(0, 500)
      });
    }

  } catch (e) {
    return res.status(500).json({
      error: "Fetch Failed",
      details: e.message
    });
  }
});

// ---- Default ----
app.get("/", (req, res) => res.send("RMS Cabinet Backup API is running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
