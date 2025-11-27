import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";
import xml2js from "xml2js";

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Environment Variables =====
let SERVICE_SECRET = process.env.RMS_SERVICE_SECRET;
let LICENSE_KEY = process.env.RMS_LICENSE_KEY;

// Base64 認証トークン生成  (※ HMAC ではない)
function generateESA() {
  return Buffer.from(`${SERVICE_SECRET}:${LICENSE_KEY}`).toString("base64");
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

  // API 1.0 + GET + offset / limit クエリ方式
  const url = "https://api.rms.rakuten.co.jp/es/1.0/cabinet/folders/get?offset=1&limit=100";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `ESA ${generateESA()}`,
        "Content-Type": "application/xml"
      }
    });

    const rawXML = await response.text();

    // XML → JSON 変換
    const parser = new xml2js.Parser({ explicitArray: false });
    let json;
    try {
      json = await parser.parseStringPromise(rawXML);
    } catch {
      return res.status(500).json({
        error: "XML parse error",
        raw_response_preview: rawXML.substring(0, 500)
      });
    }

    return res.json(json);
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
