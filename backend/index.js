import express from "express";
import fetch from "node-fetch";
import JSZip from "jszip";

const app = express();

app.get("/", (req, res) => {
  res.send("RMS Cabinet Backup API is running");
});

// ここに後でバックアップ処理を追加します（ステップ2）
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server started on port " + port);
});
