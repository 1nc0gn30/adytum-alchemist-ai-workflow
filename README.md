# Adytum Alchemist Guide (`adytum-alchemist-ai-workflow`)

Interactive 22 Major Arcana symbolic study workstation, hermetic architectural correspondence matrix, timed BOTA contemplation timer, and reflection-gated curriculum backed by local Ollama or OpenAI-compatible inference endpoints on `127.0.0.1:8135`.

---

## What It Does

`adytum-alchemist-ai-workflow` guides sequential initiation and architectural contemplation across **Key 0 (`The Fool`)** through **Key 21 (`The World`)**:
- Displays full-card Major Arcana illustrations (`/tarot/*.jpg`), Hebrew letter attributions (`Aleph`..`Tav`), gematria values, and canonical BOTA reference excerpts (`public/tarot/info.txt`).
- Provides an interactive **5-Minute Meditation Timer** after recording Conscious Intention, Symbol Observation, and Subconscious Directive prompts.
- Unlocks local JSON session exports and progress tracking across all 22 keys with **zero paywalls, zero blur locks, and zero external telemetry**.

---

## How It Works

1. **Client-Side 22-Key State Machine (`src/App.tsx`)**: Manages stage progression (`welcome` -> `lesson` -> `meditating` -> `answering` / `reflection_needed`), persists session logs and key metrics strictly in browser `localStorage`, and supports direct study or guided initiation via local Ollama (`http://localhost:11434`), Ollama Cloud, or OpenAI-compatible APIs.
2. **Loopback Enclave Daemon (`server.py` · `127.0.0.1:8135`)**: Serves compiled static assets (`dist/`) with SPA fallback routing, strict loopback `Origin` verification (`Access-Control-Allow-Origin` limited to `127.0.0.1`/`localhost`), and `GET /health` JSON telemetry.
3. **Zoth Studio v2 God-Mode Integration**: Synchronizes the same 22-key Hermetic correspondence matrix inside Zoth Studio (`https://zoth.nullai.tech/tools/adytum-alchemist-ai-workflow`) alongside pre-flight architectural invariant auditing.

---

## ZothOS CLI & MCP Commands

```bash
# Inspect CLI flags and local ZothOS status
adytum-alchemist-ai-workflow --help
adytum-alchemist-ai-workflow --status
adytum-alchemist-ai-workflow --json
adytum-alchemist-ai-workflow --ui

# Start the standalone loopback workstation daemon (:8135)
python3 server.py --port 8135
curl -s http://127.0.0.1:8135/health
```

---

## Quick Start & Verification

```bash
git clone https://github.com/NullAITech/adytum-alchemist-ai-workflow.git
cd adytum-alchemist-ai-workflow
npm install
npm run dev      # Local Vite development server
npm run lint     # TypeScript strict check (tsc --noEmit)
npm test         # Node test runner: 22 Arcana assets, hygiene, and server.py checks
npm run build    # Production Vite bundle -> dist/
gitleaks detect --source . --no-banner --redact
```

---

## Repository Layout

- `src/App.tsx` — 22-key initiation progression, correspondence matrix, reflection gate, meditation timer, and provider client
- `public/tarot/` — 22 Major Arcana card illustrations, `Hebrewt.TTF`, and canonical reference text (`info.txt`)
- `server.py` — Loopback HTTP server (`127.0.0.1:8135`) with `/health` probe and SPA fallback
- `electron/main.cjs` — Desktop Electron shell entry point
- `tests/test_adytum.mjs` — Deterministic asset, hygiene, and HTTP server test suite

---

## 100% Open-Access & Community Support

- **Open Access**: 100% free and unlocked by default with zero paywalls, subscriptions, or locked curriculum keys.
- **☕ Buy Us a Coffee (Stripe)**: [https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- **Solana Tip Address**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` (`solana:GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`)

Engineered by **1nc0gn30** ([@1nc0gn30](https://github.com/1nc0gn30) · [1nc0gn30.si](https://1nc0gn30.si)) · [NullAI Platform](https://nullai.tech) · [Zoth Studio](https://zoth.nullai.tech)
