# Adytum Alchemist Guide (`adytum-alchemist-ai-workflow`)

Interactive 22 Major Arcana symbolic study workstation, timed meditation timer, and reflection-gated curriculum backed by local Ollama or OpenAI-compatible inference endpoints on `127.0.0.1:8135`.

---

## Overview

`adytum-alchemist-ai-workflow` guides study across Key 0 (`The Fool`) through Key 21 (`The World`) using structured symbolic correspondences (`public/tarot/info.txt`), full-card visual inspection (`public/tarot/*.jpg` + embedded Hebrew letterforms), timed contemplation intervals, and written reflection gates persisted in local browser storage.

- **Local Daemon (`server.py`)**: Serves compiled static assets on `127.0.0.1:8135` with SPA fallback routing, loopback origin checking, and `/health` JSON status.
- **Inference Routing**: Supports local Ollama (`http://127.0.0.1:11434`), Ollama Cloud, and OpenAI-compatible endpoints configured directly in the client without server-side credential storage.
- **Zero-Telemetry Persistence**: Session notes, completed keys, and provider preferences remain strictly inside local `localStorage`.

---

## Quick Start

### Vite Development Server

```bash
git clone https://github.com/1nc0gn30/adytum-alchemist-ai-workflow.git
cd adytum-alchemist-ai-workflow
npm install
npm run dev
```

### Production Build & Local Workstation Daemon (`:8135`)

```bash
npm run build
python3 server.py --port 8135
curl -s http://127.0.0.1:8135/health
```

---

## Verification & Tests

```bash
npm run lint     # TypeScript strict check (tsc --noEmit)
npm test         # Node test runner: 22 Arcana assets, hygiene, and server.py loopback/health checks
npm run build    # Vite production bundle -> dist/
gitleaks detect --source . --no-banner --redact
```

---

## Repository Layout

- `src/App.tsx` — 22-key initiation progression, reflection gate, meditation timer, and provider client
- `public/tarot/` — 22 Major Arcana card illustrations, `Hebrewt.TTF`, and canonical reference text (`info.txt`)
- `server.py` — Loopback HTTP server (`127.0.0.1:8135`) with `/health` probe and SPA fallback
- `electron/main.cjs` — Desktop Electron shell entry point
- `tests/test_adytum.mjs` — Deterministic asset, hygiene, and HTTP server test suite

---

## License & Support

- **Open Access**: 100% free and open-access with zero paywalls or locked curriculum keys.
- **Support**: [Buy Us a Coffee via Stripe](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)

Engineered by **1nc0gn30** ([@1nc0gn30](https://github.com/1nc0gn30) · [1nc0gn30.si](https://1nc0gn30.si)) · [NullAI Platform](https://nullai.tech) · [Zoth Studio](https://zoth.nullai.tech)
