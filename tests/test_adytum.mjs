import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
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

function readJpegDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return { width: 0, height: 0 };
}

test('canonical 22 HD Major Arcana assets, og-banner 1200x630, sitemap lastmod, and info.txt exist', () => {
  const tarotDir = path.join(ROOT, 'public', 'tarot');
  assert.ok(fs.existsSync(tarotDir), 'public/tarot directory missing');
  const jpgs = fs.readdirSync(tarotDir).filter((f) => f.endsWith('.jpg'));
  assert.equal(jpgs.length, 22, `Expected 22 Major Arcana card images, found ${jpgs.length}`);

  const foolDim = readJpegDimensions(path.join(tarotDir, 'fool.jpg'));
  assert.ok(foolDim.width >= 400, `Expected HD tarot card >=400px wide, got ${foolDim.width}px`);

  const ogPath = path.join(ROOT, 'public', 'og-banner.jpg');
  assert.ok(fs.existsSync(ogPath), 'public/og-banner.jpg missing');
  const ogDim = readJpegDimensions(ogPath);
  assert.equal(ogDim.width, 1200);
  assert.equal(ogDim.height, 630);

  const sitemap = fs.readFileSync(path.join(ROOT, 'public', 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes('<lastmod>'), 'public/sitemap.xml missing <lastmod>');

  const infoPath = path.join(tarotDir, 'info.txt');
  assert.ok(fs.existsSync(infoPath), 'public/tarot/info.txt missing');
  assert.ok(fs.statSync(infoPath).size > 10000, 'public/tarot/info.txt unexpectedly truncated');
});

test('exportSanitizer redacts all API secrets and App.tsx uses it on export', () => {
  const appSrc = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');
  assert.ok(
    appSrc.includes('sanitizeProviderSettingsForExport(providerSettings)'),
    'App.tsx handleDownloadSession must sanitize providerSettings'
  );
  // Execute the sanitizer logic directly via tsx to verify runtime redaction
  const out = execFileSync(
    'npx',
    [
      'tsx',
      '-e',
      `import { sanitizeProviderSettingsForExport } from './src/lib/exportSanitizer.ts';
       const safe = sanitizeProviderSettingsForExport({
         provider: 'anthropic',
         agyBridgeBaseUrl: 'http://127.0.0.1:18000/v1',
         agyBridgeModel: 'gemini-3.8-flash-high',
         ollamaLocalBaseUrl: 'http://127.0.0.1:11434',
         ollamaLocalModel: 'hermes3:8b',
         azothLocalBaseUrl: 'http://127.0.0.1:8136',
         agyCliModel: 'gemini-3.8-flash-high',
         hermesCliModel: 'default',
         grokCliModel: 'grok-3-mini',
         codexCliModel: 'o4-mini',
         claudeCodeModel: 'sonnet',
         openaiApiKey: 'sk-LIVE-SECRET-OPENAI-9999',
         openaiModel: 'gpt-4.1-mini',
         anthropicApiKey: 'sk-ant-LIVE-SECRET-ANTHROPIC-7777',
         anthropicModel: 'claude-sonnet-4-20250514',
         geminiApiKey: 'AIza-LIVE-SECRET-GEMINI-6666',
         geminiModel: 'gemini-2.5-flash',
         openrouterApiKey: 'sk-or-LIVE-SECRET-OPENROUTER-5555',
         openrouterModel: 'openai/gpt-4o-mini',
         xaiApiKey: 'xai-LIVE-SECRET-GROK-4444',
         xaiModel: 'grok-3-mini',
         ollamaCloudApiKey: 'ol-LIVE-SECRET-CLOUD-8888',
         ollamaCloudBaseUrl: 'https://ollama.com',
         ollamaCloudModel: 'llama3.1:8b',
         customBaseUrl: 'http://127.0.0.1:1234/v1',
         customApiKey: 'cust-LIVE-SECRET-CUSTOM-3333',
         customModel: 'local-model',
       });
       console.log(JSON.stringify(safe));`,
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  for (const secret of [
    'sk-LIVE-SECRET-OPENAI-9999',
    'sk-ant-LIVE-SECRET-ANTHROPIC-7777',
    'AIza-LIVE-SECRET-GEMINI-6666',
    'sk-or-LIVE-SECRET-OPENROUTER-5555',
    'xai-LIVE-SECRET-GROK-4444',
    'ol-LIVE-SECRET-CLOUD-8888',
    'cust-LIVE-SECRET-CUSTOM-3333',
    'openaiApiKey',
    'anthropicApiKey',
    'geminiApiKey',
    'openrouterApiKey',
    'xaiApiKey',
    'ollamaCloudApiKey',
    'customApiKey',
  ]) {
    assert.ok(!out.includes(secret), `Secret or key property leaked in exported JSON: ${secret}`);
  }
  const parsed = JSON.parse(out);
  assert.equal(parsed.credentialsRedacted, true);
  assert.equal(parsed.provider, 'anthropic');
});

test('adytum CLI exposes real subcommands and rejects unknown commands', () => {
  const ver = execFileSync('adytum', ['--version'], { encoding: 'utf8' });
  assert.ok(ver.includes('2.4.0'), `Expected v2.4.0 in CLI version, got ${ver}`);

  const listJson = JSON.parse(execFileSync('adytum', ['list', '--json'], { encoding: 'utf8' }));
  assert.equal(listJson.count, 22);

  const key7 = JSON.parse(execFileSync('adytum', ['key', '7', '--json'], { encoding: 'utf8' }));
  assert.equal(key7.name, 'The Chariot');

  let badExit = 0;
  try {
    execFileSync('adytum', ['nonexistent-subcommand-xyz'], { stdio: 'pipe' });
  } catch (err) {
    badExit = err.status || 1;
  }
  assert.notEqual(badExit, 0, 'Unknown CLI subcommand must exit non-zero');
});

test('tracked files maintain strict attribution, canonical org URL, and hygiene', () => {
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
  assert.ok(
    appContent.includes('https://github.com/1nc0gn30/adytum-alchemist-ai-workflow'),
    'Canonical GitHub repo URL missing in src/App.tsx'
  );
});

test('server.py serves /health, /api/keys, POST /api/validate, OPTIONS preflight, and rejects cross-origin', async () => {
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
          assert.equal(data.version, '2.4.0');
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

    const opt = await fetch(`http://127.0.0.1:${port}/api/validate`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://127.0.0.1:3000' },
    });
    assert.equal(opt.status, 204);

    const keysRes = await fetch(`http://127.0.0.1:${port}/api/keys`);
    assert.equal(keysRes.status, 200);
    const keysData = await keysRes.json();
    assert.equal(keysData.count, 22);

    const valRes = await fetch(`http://127.0.0.1:${port}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Quick cloud-only prototype with no tests or boundaries.' }),
    });
    assert.equal(valRes.status, 200);
    const valData = await valRes.json();
    assert.equal(valData.passed, false);
    const key9 = valData.checks.find((c) => c.keyNumber === 9);
    assert.equal(key9.passed, false);
  } finally {
    proc.kill('SIGTERM');
  }
});
