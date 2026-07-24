<!-- xonettn -->
<div align="center">

# 🤖 Adytum Alchemist Guide

A dark UI tarot initiation app that guides the user from Key 0 to Key 21 with staged ritual prompts, timed meditation, and reflective progression tracking.


![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)

![Deploy](https://img.shields.io/badge/Deployed-Netlify-00C7B7?logo=netlify&logoColor=white)

</div>

---

## What This Project Does

- Delivers a sequential BOTA-inspired study flow across all 22 major keys
- Uses in-app selectable providers: OpenAI, Ollama Cloud, and Ollama Local
- Enforces a reflection gate before advancing to the next key
- Stores provider config and session progress in local browser storage
- Loads canonical tarot reference data from `public/tarot/info.txt`

## 📦 Tech Stack

- Vite + React + TypeScript
- Tailwind-based component styling
- Netlify-ready static deployment (`dist/`)

## 💻 Local Development

1. Install dependencies:
   `npm install`
2. Copy environment defaults:
   `cp .env.example .env.local`
3. Run the app:
   `npm run dev`

## 🔨 Build and Validation

- Type check:
  `npm run lint`
- Production build:
  `npm run build`

## 🚀 Deployment Notes (Netlify)

- Netlify build command: `npm run build`
- Publish directory: `dist`
- Canonical production domain is configured for:
  `https://adytum-alchemist-guide.nealfrazier.tech/`
- SEO files are included in `public/`:
- `robots.txt` and `sitemap.xml`

## Environment Variables

See `.env.example` for optional variables used by providers.

## 🗂️ Project Structure

- `src/App.tsx`: main UI, provider requests, initiation workflow
- `public/tarot/`: tarot card images and canonical text source
- `index.html`: page metadata, canonical, OG/Twitter tags
- `netlify.toml`: Netlify build + processing configuration

## 👤 Author

Neal Frazier

---

<div align="center">

**[xonettn]** · Built by [Neal Frazier](https://github.com/1nc0gn30) · [@AshAmplifies](https://twitter.com/AshAmplifies)

</div>
