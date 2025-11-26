import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// 認証情報（Render の Environment Variables）
const SERVICE_SECRET = process.env.RMS_SERVICE_SECRET;
const LICENSE_KEY = process.env.RMS_LICENSE_KEY;
const SHOP_URL = process.env.RMS_SHOP_URL; // shop.r10s.jp/xxxxxx

// RMS API: Signature生成関数
function generateSignature(secret, licenseKey, timestamp) {
  const text = `${licenseKey}:${timestamp}`;
  return crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");
}

// RMS API: 共通ヘッダー（APPLICATION_ID不要版）
function buildHeaders() {
  const timestamp = new Date().toISOString();
  const signature = generateSignature(SERVICE_SECRET, LICENSE_KEY, timestamp);

  return {
    "Content-Type": "application/json",
    // APPLICATION_ID を削除して署名だけ使用
    "Authorization": `ESA ${signature}`,
    "X-RMS-Timestamp": timestamp
  };
}

// === CabinetAPI: フォルダ一覧を取得 ===
app.get("/folders", async (req, res) => {
  const url = `https://api.rms.rakuten.co.jp/es/2.0/cabinet/folders/get`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        shopUrl: SHOP_URL
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Cabinet folders error:", error);
    res.status(500).json({ error: "Error fetching folder list" });
  }
});

// 起動メッセージ
app.get("/", (req, res) => {
  res.send("RMS Cabinet Backup API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
