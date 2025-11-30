import 'dotenv/config';
import express from "express";
import fetch from "node-fetch";
import xml2js from "xml2js";
import JSZip from "jszip";

const app = express();

const SERVICE_SECRET = process.env.SERVICE_SECRET;
const LICENSE_KEY = process.env.LICENSE_KEY;

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

/**
 * RMS APIに接続して Cabinet XML を取得（後でバックアップ処理を追加可能）
 */
app.get("/rms-test", async (req, res) => {
  try {
    const url = "https://api.rms.rakuten.co.jp/es/1.0/cabinet/file/list";

    const headers = {
      "Content-Type": "application/xml",
      "User-Agent": "ASLEEP-RMS-Backup"
      // "Authorization": `ESA ${signature}` ← 署名実装時に追加
    };

    const body = `
      <request>
        <licenseKey>${LICENSE_KEY}</licenseKey>
        <serviceSecret>${SERVICE_SECRET}</serviceSecret>
      </request>
    `;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body
    });

    const text = await response.text();
    res.type("application/xml").send(text);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port " + PORT));
