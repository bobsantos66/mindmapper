// node render.cjs [out.mp4] [w] [h] [fps] [still-seconds...]
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const ROOT = __dirname, [, , OUT = 'out/preview.mp4', w = '960', h = '540', fps = '24', ...stills] = process.argv;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(f => require('fs').existsSync(f));   // set CHROME=/path/to/chrome if not found
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
  const port = srv.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage(); page.on('requestfailed', r => console.log('FAIL', r.url())); page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); }); page.on('pageerror', e => console.log('PAGE ERROR', e.message)); page.on('console', m => console.log('console:', m.text()));
  await page.goto(`http://127.0.0.1:${port}/${process.env.PAGE || "index.html"}?w=${w}&h=${h}&look=${process.env.LOOK || 'c'}&style=${process.env.STYLE || 'ph'}${process.env.XQ || ''}`); await page.waitForFunction('window.ready', { timeout: 180000 });
  fs.mkdirSync(path.join(ROOT, path.dirname(OUT)), { recursive: true });
  if (stills.length) {
    for (const s of stills) { const d = await page.evaluate(t => window.frame(t), +s); fs.writeFileSync(path.join(ROOT, path.dirname(OUT), `still-${s}.jpg`), Buffer.from(d.split(',')[1], 'base64')); }
  } else {
    const dur = await page.evaluate(() => window.DUR), n = Math.round(dur * +fps), t0 = Date.now();
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', fps, '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', path.join(ROOT, OUT)]);
    const done = new Promise(r => ff.on('close', r));
    for (let f = 0; f < n; f++) { const d = await page.evaluate(t => window.frame(t), f / +fps); if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if (f % 24 === 0) process.stdout.write(`\r${f}/${n}`); }
    ff.stdin.end(); await done; console.log(`\n${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${OUT}`);
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
