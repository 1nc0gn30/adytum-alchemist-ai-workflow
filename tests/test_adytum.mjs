import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

test('canonical 22 Major Arcana assets and info.txt exist', () => {
  const tarotDir = path.join(ROOT, 'public', 'tarot');
  assert.ok(fs.existsSync(tarotDir), 'public/tarot directory missing');
  const entries = fs.readdirSync(tarotDir);
  const jpgs = entries.filter((f) => f.endsWith('.jpg'));
  assert.equal(jpgs.length, 22, `Expected 22 Major Arcana card images, found ${jpgs.length}`);
  const infoPath = path.join(tarotDir, 'info.txt');
  assert.ok(fs.existsSync(infoPath), 'public/tarot/info.txt missing');
  assert.ok(fs.statSync(infoPath).size > 10000, 'public/tarot/info.txt unexpectedly truncated');
});

test('tracked files maintain strict attribution and hygiene', () => {
  const filesToCheck = ['README.md', 'index.html', 'server.py', 'public/robots.txt', 'public/sitemap.xml', 'src/App.tsx'];
  for (const rel of filesToCheck) {
    const p = path.join(ROOT, rel);
    assert.ok(fs.existsSync(p), `Expected file ${rel}`);
    const content = fs.readFileSync(p, 'utf8');
    assert.ok(!/100\.106\.\d+\.\d+/.test(content), `Tailscale IP found in ${rel}`);
    assert.ok(!/\/home\/zoth/.test(content), `Machine path found in ${rel}`);
  }
  const appContent = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
  assert.ok(
    appContent.includes('Neal Frazier Tech (@1nc0gn30)') && appContent.includes('NullAI Platform'),
    'Canonical footer attribution missing in src/App.tsx'
  );
});

test('server.py serves /health and rejects cross-origin browser requests', async () => {
  const port = await getFreePort();
  const proc = spawn('python3', [path.join(ROOT, 'server.py'), '--port', String(port)], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  try {
    let healthy = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`, {
          headers: { Origin: `http://127.0.0.1:${port}` },
        });
        if (res.status === 200) {
          const data = await res.json();
          assert.equal(data.status, 'online');
          assert.equal(data.arcana_count, 22);
          assert.equal(data.port, port);
          assert.equal(res.headers.get('access-control-allow-origin'), `http://127.0.0.1:${port}`);
          healthy = true;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    assert.ok(healthy, 'server.py did not respond healthy within 3s');

    const cross = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: 'https://evil.example' },
    });
    assert.equal(cross.status, 403);
  } finally {
    proc.kill('SIGTERM');
  }
});
