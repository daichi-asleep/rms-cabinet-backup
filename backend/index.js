import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Environment Variables (Render .env) =====
// RMS_SERVICE_SECRET
// RMS_LICENSE_KEY
// RMS_SHOP_URL  → shop.r10s.jp/ショップID（末尾 / は自動付与）
let SERVICE_SECRET = process.env.RMS_SERVICE_SECRET;
let LICENSE_KEY = process.env.RMS_LICENSE_KEY;
let SHOP_URL = process.env.RMS_SHOP_URL;

// SHOP_URL の末尾スラッシュ補正
if (SHOP_URL && !SHOP_URL.endsWith("/")) SHOP_URL = SHOP_URL + "/";

// 署名生成
function generateSignature(secret, licenseKey, timestamp) {
  const text = `${licenseKey}:${timestamp}`;
  return crypto.createHmac("sha256", secret).update(text).digest("hex");
}

// RMS API 共通ヘッダ（APPLICATION_ID 不要版）
function buildHeaders() {
  const timestamp = new Date().toISOString();
  const signature = generateSignature(SERVICE_SECRET, LICENSE_KEY, timestamp);

  return {
    "Content-Type": "application/json",
    "Authorization": `ESA ${signature}`, // ← APPLICATION_ID 不要
    "X-RMS-Timestamp": timestamp
  };
}

// ---- Test Route ----
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

// ---- Cabinet フォルダ一覧 ----
app.get("/folders", async (req, res) => {
  // 必須チェック（早期 return）
  if (!SERVICE_SECRET || !LICENSE_KEY || !SHOP_URL) {
    return res.status(500).json({
      error: "Missing Environment Variables",
      RMS_SERVICE_SECRET: SERVICE_SECRET ? "SET" : "MISSING",
      RMS_LICENSE_KEY: LICENSE_KEY ? "SET" : "MISSING",
      RMS_SHOP_URL: SHOP_URL ? SHOP_URL : "MISSING"
    });
  }

  const url = "https://api.rms.rakuten.co.jp/es/2.0/cabinet/folders/get";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ shopUrl: SHOP_URL })
    });

    const raw = await response.text();

    // JSON 変換できる場合のみ成功扱い
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

// ---- Default Route ----
app.get("/", (req, res) => {
  res.send("RMS Cabinet Backup API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
