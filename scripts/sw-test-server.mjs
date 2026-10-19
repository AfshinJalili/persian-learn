// Test-only server for __tests__/*.sw.spec.ts: runs `next start` on PORT+1 and
// proxies it on PORT. GET /__test/legacy-sw/on makes /sw.js return the
// pre-fix worker (simulating a phone that installed the old build);
// /__test/legacy-sw/off goes back to the real file. GET /__test/sw-bump
// changes the worker's bytes, like a new deploy would.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import http from 'node:http';

const port = Number(process.env.PORT || 3100);
const upstream = port + 1;
const legacy = readFileSync(new URL('../__tests__/fixtures/legacy-sw.js', import.meta.url));
let legacyOn = false;
let bump = 0;
// /__test/sw-fast-warm/on serves the worker with the audio warm-up throttle
// turned down, so a test can watch the whole manifest get cached quickly.
let fastWarm = false;
// Audio clip requests seen (GET /__test/audio-hits, reset with /reset).
let audioHits = { total: 0, ranged: 0, paths: {} };

const next = spawn('npx', ['next', 'start', '-p', String(upstream)], { stdio: 'inherit' });
process.on('exit', () => next.kill());
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(0));

http
  .createServer(async (req, res) => {
    const path = (req.url || '/').split('?')[0];
    if (path.startsWith('/__test/legacy-sw/')) {
      legacyOn = path.endsWith('/on');
      res.end(String(legacyOn));
      return;
    }
    if (path.startsWith('/__test/sw-fast-warm/')) {
      fastWarm = path.endsWith('/on');
      res.end(String(fastWarm));
      return;
    }
    if (path === '/__test/audio-hits/reset') {
      audioHits = { total: 0, ranged: 0, paths: {} };
      res.end('0');
      return;
    }
    if (path === '/__test/audio-hits') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(audioHits));
      return;
    }
    if (/^\/audio\/[0-9a-f]+\.mp3$/.test(path)) {
      audioHits.total += 1;
      if (req.headers.range) audioHits.ranged += 1;
      audioHits.paths[path] = (audioHits.paths[path] || 0) + 1;
    }
    if (!legacyOn && (bump > 0 || fastWarm) && path === '/sw.js') {
      const upstreamRes = await fetch(`http://127.0.0.1:${upstream}${req.url}`);
      let body = await upstreamRes.text();
      // A bump simulates the next deploy: same script URL, different bytes.
      if (bump > 0) body = body.replace("const SW_VERSION = '", `const SW_VERSION = 'deploy${bump}-`);
      if (fastWarm) {
        body = body
          .replace(/const WARM_CONCURRENCY = \d+;/, 'const WARM_CONCURRENCY = 12;')
          .replace(/const WARM_PRIORITY_PAUSE_MS = \d+;/, 'const WARM_PRIORITY_PAUSE_MS = 0;')
          .replace(/const WARM_IDLE_PAUSE_MS = \d+;/, 'const WARM_IDLE_PAUSE_MS = 0;');
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' });
      res.end(body);
      return;
    }
    if (path === '/__test/sw-bump') {
      bump += 1;
      res.end(String(bump));
      return;
    }
    if (legacyOn && path === '/sw.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' });
      res.end(legacy);
      return;
    }
    const proxied = http.request(
      { host: '127.0.0.1', port: upstream, path: req.url, method: req.method, headers: req.headers },
      (up) => {
        res.writeHead(up.statusCode || 502, up.headers);
        up.pipe(res);
      }
    );
    proxied.on('error', () => {
      res.writeHead(502);
      res.end();
    });
    req.pipe(proxied);
  })
  .listen(port);
