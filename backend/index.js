import 'dotenv/config';
import express from "express";
import fetch from "node-fetch";
import xml2js from "xml2js";
import JSZip from "jszip";

const app = express();
app.use(express.json());

const SERVICE_SECRET = process.env.SERVICE_SECRET;
const LICENSE_KEY = process.env.LICENSE_KEY;

// ESA 認証ヘッダ生成
const getHeaders = () => ({
  "Authorization": `ESA ${Buffer.from(`${SERVICE_SECRET}:${LICENSE_KEY}`).toString("base64")}`
});

// フォルダ一覧取得 API
app.get("/api/folders", async (req, res) => {
  try {
    const offset = req.query.offset ?? 1;
    const limit = req.query.limit ?? 100;

    const url = `https://api.rms.rakuten.co.jp/es/1.0/cabinet/folders/get?offset=${offset}&limit=${limit}`;
    const response = await fetch(url, { headers: getHeaders() });
    const xml = await response.text();

    const result = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const folders = result.result.cabinetFoldersGetResult.folders.folder;
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ZIP 作成（フォルダの images をまとめる）
app.post("/api/zip", async (req, res) => {
  const { folderId } = req.body;
  if (!folderId) return res.status(400).json({ error: "folderId required" });

  const zip = new JSZip();
  const folderPath = zip.folder(`folder_${folderId}`);

  const url = `https://api.rms.rakuten.co.jp/es/1.0/cabinet/files/get?folderId=${folderId}`;
  const xml = await fetch(url, { headers: getHeaders() }).then(r => r.text());
  const json = await xml2js.parseStringPromise(xml, { explicitArray: false });

  const images = json.result.cabinetFilesGetResult.files.file;
  for (const img of images) {
    const imgUrl = img.FileUrl;
    const buffer = await fetch(imgUrl).then(r => r.arrayBuffer());
    folderPath.file(img.FileName, Buffer.from(buffer));
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  res.setHeader("Content-Disposition", `attachment; filename=folder_${folderId}.zip`);
  res.setHeader("Content-Type", "application/zip");
  res.send(zipBuffer);
});

app.get("/", (req, res) => res.json({ status: "OK", message: "Server is running" }));
app.listen(3000, () => console.log("Server started on port 3000"));
