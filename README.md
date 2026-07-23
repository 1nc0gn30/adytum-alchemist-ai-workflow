# adytum-alchemist-ai-workflow

A BOTA Tarot-inspired AI guide for progressing through the 22 Major Arcana keys.

## Overview
A BOTA Tarot-inspired AI guide for progressing through the 22 Major Arcana keys.

## Tech Stack
- React
- Vite
- Express
- Netlify (deployed)

## Project Structure
```
adytum-alchemist-ai-workflow/
  - public
  - src
  (47 files total)
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
git clone https://github.com/1nc0gn30/adytum-alchemist-ai-workflow.git
cd adytum-alchemist-ai-workflow
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Available Scripts
  npm run dev - vite --port=3000 --host=0.0.0.0
  npm run build - vite build
  npm run preview - vite preview
  npm run clean - rm -rf dist
  npm run lint - tsc --noEmit

## Original README
<details>
<summary>Click to expand original README</summary>

# Adytum Alchemist Guide

A dark UI tarot initiation app that guides the user from Key 0 to Key 21 with staged ritual prompts, timed meditation, and reflective progression tracking.

## What This Project Does

- Delivers a sequential BOTA-inspired study flow across all 22 major keys
- Uses in-app selectable providers: OpenAI, Ollama Cloud, and Ollama Local
- Enforces a reflection gate before advancing to the next key
- Stores provider config and session progress in local browser storage
- Loads canonical tarot reference data from `public/tarot/info.txt`

## Tech Stack

- Vite + React + TypeScript
- Tailwind-based component styling
- Netlify-ready static deployment (`dist/`)

## Local Development

1. Install dependencies:
   `npm install`
2. Copy environment defaults:
   `cp .env.example .env.local`
3. Run the app:
   `npm run dev`

## Build and Validation

- Type check:
  `npm run lint`
- Production build:
  `npm run build`

## Deployment Notes (Netlify)

- Netlify build command: `npm run build`
- Publish directory: `dist`
- Canonical production domain is configured for:
  `https://adytum-alchemist-guide.nealfrazier.tech/`
- SEO files are included in `public/`:
- `robots.txt` and `sitemap.xml`

## Environment Variables

See `.env.example` for optional variables used by providers.

## Project Structure

- `src/App.tsx`: main UI, provider requests, initiation workflow
- `public/tarot/`: tarot card images and canonical text source
- `index.html`: page metadata, canonical, OG/Twitter tags
- `netlify.toml`: Netlify build + processing configuration

## Author

Neal Frazier

</details>

## TODO / Roadmap
- [ ] Add unit tests
- [ ] Add LICENSE file
- [ ] Add Dockerfile for containerized deployment
- [ ] Consider adding Tailwind CSS
- [ ] Add CI/CD pipeline
- [ ] Add contribution guidelines (CONTRIBUTING.md)
- [ ] Improve error handling and edge cases
- [ ] Add environment variable documentation
- [ ] Update dependencies to latest versions
- [ ] Add code comments and inline documentation

## Deployment
This project is deployed on Netlify. See netlify.toml for configuration.

## Author
**Neal Frazier** - [@AshAmplifies](https://github.com/1nc0gn30)

## Links
- GitHub: https://github.com/1nc0gn30/adytum-alchemist-ai-workflow

---
*This README was enhanced as part of the neals-projects-2026 batch update.*
