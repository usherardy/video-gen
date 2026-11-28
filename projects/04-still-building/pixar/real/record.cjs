// Records real/shaw-scroll.mp4: node real/record.cjs <frames-dir>, then encode the frames with ffmpeg (see ../README.md).
const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2], b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 693 }, deviceScaleFactor: 1080 / 390, isMobile: true, hasTouch: true });
  await p.goto('https://shawgames.com', { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('goto', e.message));
  await p.waitForTimeout(3000);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const N = 8 * 30, total = 2600; // 8 s, ease-in-out scroll over ~2600 css px
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1), e = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    await p.evaluate(y => window.scrollTo(0, y), Math.round(e * total));
    await p.waitForTimeout(15);
    await p.screenshot({ path: `${dir}/f${String(i).padStart(3, '0')}.jpg`, type: 'jpeg', quality: 90 });
  }
  await b.close();
})();
