// Notify Bing, Yandex and other IndexNow engines about changed pages.
// Run after a deploy: node scripts/indexnow.js            (all sitemap URLs)
//                     node scripts/indexnow.js /gyik/     (only these paths)
const fs = require('fs');
const path = require('path');

const host = 'hangszerszallitas.hu';
const root = path.join(__dirname, '..');
const keyFile = fs.readdirSync(root).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
const key = fs.readFileSync(path.join(root, keyFile), 'utf8').trim();

const args = process.argv.slice(2);
const urlList = args.length
  ? args.map((p) => `https://${host}${p.startsWith('/') ? p : '/' + p}`)
  : [...fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${keyFile}`, urlList }),
}).then((res) => console.log(res.status, res.statusText, `(${urlList.length} URLs)`));
