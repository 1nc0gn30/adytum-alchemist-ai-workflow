import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllKeys, getKey, validatePlan, hardenPlan, generateProjectInvariants } from '../src/core/adytum.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = express();
const PORT = process.env.PORT || 8135;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(distDir));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'adytum-alchemist-ai-workflow',
    port: Number(PORT),
    keysCount: 22,
    zeroEgress: true,
  });
});

app.get('/api/keys', (req, res) => {
  res.json({ keys: getAllKeys() });
});

app.get('/api/keys/:id', (req, res) => {
  const key = getKey(req.params.id);
  if (!key) return res.status(404).json({ error: 'Key must be between 0 and 21' });
  res.json(key);
});

app.get('/api/invariants', (req, res) => {
  const name = req.query.project || 'Sovereign Architecture';
  const intention = req.query.intention || '';
  res.json(generateProjectInvariants(String(name), String(intention)));
});

app.post('/api/validate', (req, res) => {
  const planText = req.body?.plan || req.body?.text || req.body?.spec || '';
  res.json(validatePlan(String(planText)));
});

app.post('/api/harden', (req, res) => {
  const planText = req.body?.plan || req.body?.text || req.body?.spec || '';
  const projectName = req.body?.projectName || 'Sovereign Architecture';
  res.json(hardenPlan(String(planText), String(projectName)));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[AdytumAlchemist] Workstation server listening on http://127.0.0.1:${PORT}`);
});
