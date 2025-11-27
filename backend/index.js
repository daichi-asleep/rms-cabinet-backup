// ---- Cabinet フォルダ一覧 ----
app.get("/folders", async (req, res) => {
  if (!SERVICE_SECRET || !LICENSE_KEY) {
    return res.status(500).json({
      error: "Missing Environment Variables",
      RMS_SERVICE_SECRET: SERVICE_SECRET ? "SET" : "MISSING",
      RMS_LICENSE_KEY: LICENSE_KEY ? "SET" : "MISSING"
    });
  }

  const url = "https://api.rms.rakuten.co.jp/es/1.0/cabinet/folders/get";

  // offset / limit を POST XML の body で渡す
  const requestXML = `
    <cabinetFoldersGetRequest>
      <offset>1</offset>
      <limit>100</limit>
    </cabinetFoldersGetRequest>
  `.trim();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `ESA ${generateESA()}`,
        "Content-Type": "application/xml; charset=UTF-8"
      },
      body: requestXML
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
