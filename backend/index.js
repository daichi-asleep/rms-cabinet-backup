import 'dotenv/config';
import express from "express";
import fetch from "node-fetch";
import xml2js from "xml2js";
import JSZip from "jszip";

const app = express();
const API_BASE = "https://api.rms.rakuten.co.jp/es/1.0";
const SERVICE_SECRET = process.env.SERVICE_SECRET;
const LICENSE_KEY = process.env.LICENSE_KEY;

// ESA 認証ヘッダ作成
const getAuthHeader = () => {
  const token = Buffer.from(`${SERVICE_SECRET}:${LICENSE_KEY}`).toString("base64");
  return `ESA ${token}`;
};

// XML → JSON パーサ
const parseXML = async (xml) =>
  await xml2js.parseStringPromise(xml, { explicitArray: false });

// ① フォルダ一覧取得
app.get("/api/folders", async (req, res) => {
  const offset = req.query.offset || 1;
  const limit = req.query.limit || 100;

  const url = `${API_BASE}/cabinet/folders/get?offset=${offset}&limit=${limit}`;
  const response = await fetch(url, { headers: { Authorization: getAuthHeader() }});
  const xml = await response.text();
  const json = await parseXML(xml);
  res.json(json);
});

// ② ファイル一覧取得
app.get("/api/files", async (req, res) => {
  const { folderId, offset = 1, limit = 100 } = req.query;
  if (!folderId) return res.status(400).json({ error: "folderId is required" });

  const url = `${API_BASE}/cabinet/files/get?folderId=${folderId}&offset=${offset}&limit=${limit}`;
  const response = await fetch(url, { headers: { Authorization: getAuthHeader() }});
  const xml = await response.text();
  const json = await parseXML(xml);
  res.json(json);
});

// ③ 指定フォルダ ZIP ダウンロード
app.get("/api/download/folder", async (req, res) => {
  const folderId = req.query.folderId;
  if (!folderId) return res.status(400).json({ error: "folderId is required" });

  const filesUrl = `${API_BASE}/cabinet/files/get?folderId=${folderId}&offset=1&limit=100`;
  const filesResp = await fetch(filesUrl, { headers: { Authorization: getAuthHeader() }});
  const filesXml = await filesResp.text();
  const filesJson = await parseXML(filesXml);

  const files = filesJson.result?.cabinetFilesGetResult?.files?.file || [];
  const zip = new JSZip();

  for (const file of files) {
    const fileId = file.FileId;
    const fileName = file.FileName;
    const fileUrl = `${API_BASE}/cabinet/file/download?fileId=${fileId}`;
    const bin = await fetch(fileUrl, { headers: { Authorization: getAuthHeader() }}).then(r => r.arrayBuffer());
    zip.file(fileName, bin);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  res.setHeader("Content-Disposition", `attachment; filename=folder_${folderId}.zip`);
  res.setHeader("Content-Type", "application/zip");
  res.send(buffer)
