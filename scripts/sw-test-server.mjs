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
    if (path === '/__test/sw-bump') {
      bump += 1;
      res.end(String(bump));
      return;
    }
    if (!legacyOn && bump > 0 && path === '/sw.js') {
      // Simulates the next deploy: same script URL, different bytes.
      const upstreamRes = await fetch(`http://127.0.0.1:${upstream}${req.url}`);
      const body = await upstreamRes.text();
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' });
      res.end(`${body}\n// deploy ${bump}\n`);
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
