// node src/library/build-library.cjs [--only iphone-18-pro] — exports GLB + previews for every model/colour
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'); const OUT = path.join(ROOT, 'assets/library');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
(async () => {
  await new Promise((r) => srv.listen(0, r)); const port = srv.address().port;
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
  p.on('pageerror', (e) => console.log('ERR', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
  await p.goto(`http://localhost:${port}/src/library/builder.html`); await p.waitForFunction(() => window.READY, null, { timeout: 60000 });
  const models = await p.evaluate(() => window.MODELS);
  fs.mkdirSync(path.join(OUT, 'models'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'previews'), { recursive: true });
  const catalog = [];
  for (const m of models) {
    if (only && m.id !== only) continue;
    const entry = { ...m, colors: [] };
    for (const [color, hex] of Object.entries(m.colors)) {
      const base = `${m.id}__${slug(color)}`;
      const glb = Buffer.from(await p.evaluate(([id, c]) => window.exportGLB(id, c), [m.id, color]), 'base64');
      fs.writeFileSync(path.join(OUT, 'models', base + '.glb'), glb);
      const views = { back: [205, 8], front: [25, 6] };
      const prev = {};
      for (const [k, [yaw, pitch]] of Object.entries(views)) {
        await p.evaluate(([id, c, y, pi]) => window.show(id, c, y, pi), [m.id, color, yaw, pitch]);
        const f = path.join(OUT, 'previews', `${base}__${k}.webp`);
        const png = await p.locator('canvas').screenshot({ omitBackground: true });
        require('child_process').execFileSync('python3', ['-c', 'import sys,io;from PIL import Image;im=Image.open(io.BytesIO(sys.stdin.buffer.read()));im=im.crop(im.getbbox());im.thumbnail((600,800));im.save(sys.argv[1],"WEBP",quality=88,method=6)', f], { input: png }); prev[k] = path.relative(path.join(ROOT, 'assets'), f);
      }
      entry.colors.push({ name: color, hex, slug: slug(color), glb: `library/models/${base}.glb`, preview_back: prev.back, preview_front: prev.front, glb_bytes: glb.length });
      console.log('✓', m.name, '·', color, (glb.length / 1024).toFixed(0) + ' KB');
    }
    catalog.push(entry);
  }
  if (!only) fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify({ generated_at: new Date().toISOString(), source: 'colours/dimensions: gsmarena.com spec pages; geometry: original procedural models (src/library/phone3d.js)', models: catalog }, null, 1));
  await b.close(); srv.close();
})();
