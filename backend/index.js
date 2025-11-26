import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ここに後でバックアップ処理を追加します（ステップ2）
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

// 環境変数
let SERVICE_SECRET = process.env.RMS_SERVICE_SECRET;
let LICENSE_KEY = process.env.RMS_LICENSE_KEY;
let SHOP_URL = process.env.RMS_SHOP_URL;

// SHOP_URL に末尾スラッシュを付与
if (SHOP_URL && !SHOP_URL.endsWith("/")) {
  SHOP_URL += "/";
}

// 署名生成関数
function generateSignature(secret, licenseKey, timestamp) {
  if (!secret || !licenseKey) return null;
  const text = `${licenseKey}:${timestamp}`;
  return crypto.createHmac("sha256", secret).update(text).digest("hex");
}

// ヘッダー作成
function buildHeaders() {
  const timestamp = new Date().toISOString();
  const signature = generateSignature(SERVICE_SECRET, LICENSE_KEY, timestamp);

  return {
    "Content-Type": "application/json",
    "Authorization": signature ? `ESA ${signature}` : "",
    "X-RMS-Timestamp": timestamp
  };
}

// テスト用ルート
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

// Cabinet フォルダ取得
app.get("/folders", async (req, res) => {
  // 環境変数チェック
  if (!SERVICE_SECRET || !LICENSE_KEY || !SHOP_URL) {
    return res.status(500).json({
      error: "Environment variables not set",
      SERVICE_SECRET: SERVICE_SECRET ? "SET" : "MISSING",
      LICENSE_KEY: LICENSE_KEY ? "SET" : "MISSING",
      SHOP_URL: SHOP_URL ? SHOP_URL : "MISSING"
    });
  }

  const url = "https://api.rms.rakuten.co.jp/es/2.0/cabinet/folders/get";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ shopUrl: SHOP_URL })
    });

    const text = await response.text();

    // JSON 変換
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      res.status(500).json({
        error: "Invalid JSON response from RMS API",
        raw: text
      });
    }

  } catch (error) {
    res.status(500).json({
      error: "Error fetching folder list",
      details: error.message
    });
  }
});

// 起動メッセージ
app.get("/", (req, res) => {
  res.send("RMS Cabinet Backup API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
