require('dotenv').config();
const express = require('express');
const xml2js = require('xml2js');
const fetch = require('node-fetch'); // Node.js 17以下の場合
const app = express();

const SERVICE_SECRET = process.env.SERVICE_SECRET;
const LICENSE_KEY = process.env.LICENSE_KEY;

app.get("/", (req, res) => res.send("Server is running"));

app.listen(3000, () => console.log("Server started on port 3000"));
