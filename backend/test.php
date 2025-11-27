<?php
$serviceSecret = "SP419411_7hCOgkvkjlULItvY";
$licenseKey = "SL419411_jnEd2LOljBRQXcAS";
$credential = base64_encode("$serviceSecret:$licenseKey");

$url = "https://api.rms.rakuten.co.jp/es/1.0/cabinet/folders/get?offset=1&limit=100";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: ESA $credential"],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header("Content-Type: text/plain; charset=UTF-8");
echo "StatusCode: $httpCode\n\n";
echo $response;
