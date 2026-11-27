// node build.mjs -> index.html (fonts, logo and app screens inlined as data URIs; GSAP from cdnjs; audio stays external)
import fs from 'node:fs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const A = f => path.join(dir, 'assets', f);
const uri = (f, mime) => `data:${mime};base64,${fs.readFileSync(A(f)).toString('base64')}`;
const MAP = {

  MONTSERRAT: uri('Montserrat.woff2', 'font/woff2'),
  DISCOVER: uri('discover_frost.webp', 'image/webp'), FEED: uri('feed_frost.webp', 'image/webp'), MALL: uri('mall_frost.webp', 'image/webp'),
};
for (const n of ['nicobar', 'shara', 'hazan', 'kahanii', 'issa', 'zankov', 'nomcore']) MAP['H_' + n.toUpperCase()] = uri(`hero/${n}_c.webp`, 'image/webp');
let html = fs.readFileSync(path.join(dir, 'index.src.html'), 'utf8');
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => { if (!MAP[k]) throw new Error('missing asset ' + k); return MAP[k]; });
html = html.replace('/*TIMELINE_JSON*/null', JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'))));
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('index.html', (fs.statSync(path.join(dir, 'index.html')).size / 1024).toFixed(0), 'KB');
