# Adytum Planner — 22-Key Hermetic AI Workbench (`adytum-alchemist-ai-workflow`)

Local-first 22 Major Arcana symbolic study workbench, offline AI-Chemistry curriculum, 5-minute BOTA contemplation timer, and negation-aware 15-rule architectural invariant gatekeeper running on `127.0.0.1:8135`, ZothOS CLI (`adytum` / `adytum-alchemist-ai-workflow`), and Zoth Studio v2.

---

## What It Does

`adytum-alchemist-ai-workflow` (`v2.4.0`) unifies three verified surfaces under one identity (**Adytum Planner — 22-Key Hermetic AI Workbench**):
- **Standalone Web Workbench (`127.0.0.1:8135`)**: Browse all 22 Major Arcana (**Key 0 `The Fool`** → **Key 21 `The World`**) with HD card art (`/tarot/*.jpg`), Hebrew letters, gematria values, offline AI-Chemistry lessons (`src/data/adytumKeys.json`), canonical BOTA study excerpts (`public/tarot/info.txt`), and a pausable 5-minute contemplation timer with optional local Ollama (`127.0.0.1:11434`) Socratic guidance.
- **Deterministic CLI & Loopback API (`adytum`, `server.py`)**: Query the 22 Hermetic keys (`GET /api/keys`), run negation-aware 15-rule architectural plan audits (`POST /api/validate`, `adytum validate`), and coherently auto-harden specs (`POST /api/harden`, `adytum harden`).
- **Zoth Studio v2 God-Mode Deck (`/tools/adytum-alchemist-ai-workflow`)**: Adds the interactive Tree of Life lattice, 3D `.glb` Arcana dioramas, LTX-Video 2B loops, and live browser PRD gatekeeper alongside the embedded `:8135` workbench.

---

## How It Works

1. **Client-Side 22-Key State Machine (`src/App.tsx`)**: Persists session logs and 22-key progress locally in `localStorage`, defaults to local Ollama (`http://127.0.0.1:11434`), works 100% offline via bundled AI-Chemistry lessons, and strips all API credentials via `sanitizeProviderSettingsForExport()` before exporting session JSON.
2. **Hardened Loopback Enclave Daemon (`server.py` · `127.0.0.1:8135`)**: Serves `dist/` with strict realpath containment (eliminating path-traversal oracles), `urllib.parse` loopback-only `Origin` checks, `OPTIONS` CORS preflight (`204`), `GET /health`, `GET /api/keys`, `POST /api/validate`, and `POST /api/harden`.
3. **ZothOS CLI (`adytum` & `adytum-alchemist-ai-workflow`)**: Provides real deterministic subcommands synced byte-for-byte across `/usr/local/bin/`, `~/.local/bin/`, and `zoth-os` chroot.

---

## ZothOS CLI & HTTP API Commands

```bash
# Inspect status, version, and local workbench URL
adytum --help
adytum --version
adytum --status
adytum --json
adytum --ui

# Real 22-Key Hermetic Planning CLI subcommands
adytum list                                  # List all 22 Hermetic Keys & directives
adytum key 7 --json                          # Inspect Key 7 (The Chariot / Cheth)
adytum invariants "Sovereign Enclave" --json # Generate 22-key project invariant checklist
adytum validate ./plan.md --json             # Run negation-aware 15-rule audit (exit 0 if >=70)
adytum harden ./plan.md --json               # Auto-harden a draft spec to 100/100 (A+)
adytum serve --port 8135                     # Run loopback HTTP daemon on 127.0.0.1:8135

# Loopback HTTP API (:8135)
curl -s http://127.0.0.1:8135/health
curl -s http://127.0.0.1:8135/api/keys
curl -s -X POST http://127.0.0.1:8135/api/validate \
  -H 'Content-Type: application/json' \
  -d '{"text":"Quick cloud-only prototype with no tests or boundaries."}'
```

---

## Quick Start & Verification

```bash
git clone https://github.com/1nc0gn30/adytum-alchemist-ai-workflow.git
cd adytum-alchemist-ai-workflow
npm install
npm run lint     # TypeScript strict check (tsc --noEmit)
npm test         # Node test runner: assets, secret export redaction, hygiene, HTTP API
pytest -v        # Python server.py test suite: CORS, OPTIONS, traversal, /api/keys, /api/validate
npm run build    # Production Vite bundle -> dist/
```

---

## 100% Open-Access & Community Support

- **Open Access**: 100% free and unlocked by default with zero paywalls, blur locks, or subscriptions.
- **☕ Buy Us a Coffee (Stripe)**: [https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- **Solana Tip Address**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` (`solana:GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`)

Engineered by **Neal Frazier Tech** ([@1nc0gn30](https://github.com/1nc0gn30)) • [NullAI Platform](https://nullai.tech) • [Zoth Studio](https://zoth.nullai.tech)
