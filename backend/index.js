import 'dotenv/config';
import express from "express";
import fetch from "node-fetch";
import xml2js from "xml2js";
import JSZip from "jszip";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// ESM で __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_SECRET = process.env.SERVICE_SECRET;
const LICENSE_KEY = process.env.LICENSE_KEY;

// ESA 認証
const getHeaders = () => ({
  "Authorization": `ESA ${Buffer.from(`${SERVICE_SECRET}:${LICENSE_KEY}`).toString("base64")}`
});

// ================= API =================

// フォルダ一覧
app.get("/api/folders", async (req, res) => {
  try {
    const offset = req.query.offset ?? 1;
    const limit = req.query.limit ?? 100;
    const url = `https://api.rms.rakuten.co.jp/es/1.0/cabinet/folders/get?offset=${offset}&limit=${limit}`;

    const xml = await fetch(url, { headers: getHeaders() }).then(r => r.text());
    const result = await xml2js.parseStringPromise(xml, { explicitArray: false });

    const folders = result.result.cabinetFoldersGetResult.folders.folder;
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ZIP 生成
app.post("/api/zip", async (req, res) => {
  try {
    const { folderId } = req.body;
    if (!folderId) return res.status(400).json({ error: "folderId required" });

    const zip = new JSZip();
    const saveFolder = zip.folder(`folder_${folderId}`);

    const url = `https://api.rms.rakuten.co.jp/es/1.0/cabinet/files/get?folderId=${folderId}`;
    const xml = await fetch(url, { headers: getHeaders() }).then(r => r.text());
    const json = await xml2js.parseStringPromise(xml, { explicitArray: false });

    const images = json.result.cabinetFilesGetResult.files.file;
    for (const img of images) {
      const fileBuffer = await fetch(img.FileUrl).then(r => r.arrayBuffer());
      saveFolder.file(img.FileName, Buffer.from(fileBuffer));
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Disposition", `attachment; filename=folder_${folderId}.zip`);
    res.setHeader("Content-Type", "application/zip");
    res.send(zipBuffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============== 静的ファイル ===============
app.use(express.static(path.join(__dirname, "public")));

// =============== catch-all ===============
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => console.log("Server started on port 3000"));
