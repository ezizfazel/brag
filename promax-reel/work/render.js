// usage: node render.js stills 1 2 3   |   node render.js full [workers]
const { chromium } = require('playwright');
const http=require('http'), fs=require('fs'), path=require('path');
const root=__dirname;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.jpg':'image/jpeg'};
const srv=http.createServer((q,r)=>{ const p=path.join(root,decodeURIComponent(q.url.split('?')[0])); fs.readFile(p,(e,d)=>{ if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'}); r.end(d); }); });
(async()=>{
  await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
  const mode=process.argv[2];
  const b=await chromium.launch();
  const open=async()=>{ const p=await b.newPage({viewport:{width:1080,height:1920}}); p.on('pageerror',e=>console.log('ERR',e.message));
    await p.goto(`http://localhost:${port}/reel.html`); await p.waitForFunction(()=>window.READY,null,{timeout:60000}); return p; };
  if(mode==='stills'){
    const p=await open(); fs.mkdirSync(path.join(root,'stills'),{recursive:true});
    for(const t of process.argv.slice(3).map(Number)){ await p.evaluate(t=>window.renderAt(t),t); await p.screenshot({path:path.join(root,'stills',`r_${t.toFixed(2)}.jpg`),type:'jpeg',quality:88}); }
  } else {
    const out=path.join(root,'out'); fs.mkdirSync(out,{recursive:true});
    const p0=await open(); const [dur,fps]=await p0.evaluate(()=>[window.DURATION,window.FPS]); await p0.close();
    const total=Math.round(dur*fps); const workers=+process.argv[3]||3; let next=0,done=0; const t0=Date.now();
    await Promise.all([...Array(workers)].map(async()=>{ const p=await open();
      while(true){ const i=next++; if(i>=total) break; const f=path.join(out,`o_${String(i).padStart(5,'0')}.png`);
        await p.evaluate(t=>window.renderAt(t),i/fps); await p.screenshot({path:f,type:'png'});
        if(++done%100===0) console.log(done,'/',total,((Date.now()-t0)/1000).toFixed(0)+'s'); } }));
    console.log('done',total,((Date.now()-t0)/1000).toFixed(0)+'s');
  }
  await b.close(); srv.close();
})();
