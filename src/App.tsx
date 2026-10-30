import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Moon, Sun, Hourglass, Lock, Unlock, Settings, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AppStage = "welcome" | "loading" | "lesson" | "meditating" | "answering" | "reflection_needed";
type ProviderId = "hermetic_local" | "ollama_local" | "openai" | "ollama_cloud";
type ChatRole = "user" | "assistant";

type SessionMessage = {
  role: ChatRole;
  content: string;
  createdAt: string;
};

type ProviderSettings = {
  provider: ProviderId;
  openaiApiKey: string;
  openaiModel: string;
  ollamaCloudApiKey: string;
  ollamaCloudBaseUrl: string;
  ollamaCloudModel: string;
  ollamaLocalBaseUrl: string;
  ollamaLocalModel: string;
};

type CardProgress = {
  lessonsOpened: number;
  reflectionsNeeded: number;
  meditationsStarted: number;
  insightSubmissions: number;
  gatesOpened: number;
  completed: boolean;
};

type ProgressState = {
  cards: Record<number, CardProgress>;
  totalCyclesCompleted: number;
  cycleCompletions: string[];
};

const MEDITATION_TIME_SECONDS = 300;
const PROVIDER_SETTINGS_STORAGE_KEY = "adytum_provider_settings";
const SESSION_LOG_STORAGE_KEY = "adytum_session_log";
const PROGRESS_STORAGE_KEY = "adytum_progress_state";

const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  provider: "hermetic_local",
  openaiApiKey: "",
  openaiModel: "gpt-4.1-mini",
  ollamaCloudApiKey: "",
  ollamaCloudBaseUrl: "https://ollama.com",
  ollamaCloudModel: "llama3.1:8b",
  ollamaLocalBaseUrl: "http://127.0.0.1:11434",
  ollamaLocalModel: "qwen2.5-coder:1.5b-instruct",
};

const TAROT_IMAGE_PATHS: Record<number, string> = {
  0: "/tarot/fool.jpg",
  1: "/tarot/magician.jpg",
  2: "/tarot/highpriestess.jpg",
  3: "/tarot/empress.jpg",
  4: "/tarot/emperor.jpg",
  5: "/tarot/hierorphant.jpg",
  6: "/tarot/lovers.jpg",
  7: "/tarot/chariot.jpg",
  8: "/tarot/strength.jpg",
  9: "/tarot/hermit.jpg",
  10: "/tarot/wheeloffortune.jpg",
  11: "/tarot/justice.jpg",
  12: "/tarot/hangedman.jpg",
  13: "/tarot/death.jpg",
  14: "/tarot/temperance.jpg",
  15: "/tarot/devil.jpg",
  16: "/tarot/tower.jpg",
  17: "/tarot/star.jpg",
  18: "/tarot/moon.jpg",
  19: "/tarot/sun.jpg",
  20: "/tarot/judgement.jpg",
  21: "/tarot/world.jpg",
};

const TAROT_CARD_NAMES: Record<number, string> = {
  0: "The Fool",
  1: "The Magician",
  2: "The High Priestess",
  3: "The Empress",
  4: "The Emperor",
  5: "The Hierophant",
  6: "The Lovers",
  7: "The Chariot",
  8: "Strength",
  9: "The Hermit",
  10: "Wheel of Fortune",
  11: "Justice",
  12: "The Hanged Man",
  13: "Death",
  14: "Temperance",
  15: "The Devil",
  16: "The Tower",
  17: "The Star",
  18: "The Moon",
  19: "The Sun",
  20: "Judgement",
  21: "The World",
};

const TAROT_NAME_TO_NUMBER: Record<string, number> = {
  fool: 0,
  magician: 1,
  highpriestess: 2,
  empress: 3,
  emperor: 4,
  hierophant: 5,
  hierorphant: 5,
  lovers: 6,
  chariot: 7,
  strength: 8,
  hermit: 9,
  wheeloffortune: 10,
  fortune: 10,
  justice: 11,
  hangedman: 12,
  death: 13,
  temperance: 14,
  devil: 15,
  tower: 16,
  star: 17,
  moon: 18,
  sun: 19,
  judgement: 20,
  world: 21,
};

function buildSystemInstruction(tarotReferenceText: string): string {
  const mappingLines = Object.entries(TAROT_CARD_NAMES)
    .map(([key, name]) => `Key ${key}: ${name}. Image: ![${name}](${TAROT_IMAGE_PATHS[Number(key)]})`)
    .join("\n");

  const sourceText = tarotReferenceText.trim() || "No external reference text loaded.";

  return `Role: You are the "Adytum Alchemist Guide," a master of the Builders of the Adytum (BOTA) Tarot system and a pioneer in "AI Chemistry." Your mission is to lead the user through a sequential initiation from Key 0 (The Fool) to Key 21 (The World).

Operational Rules:
1. Strict Sequence: Start at Key 0. Do not move to the next key until the current answer demonstrates understanding.
2. Required response format for every new key:
   [GATE OPENED] (include only when advancing to a new key after a passed reflection; omit for Key 0)
   **Image**: ![Card Name](/tarot/...)
   **The Attribution**: Name, Number, Hebrew Letter, and specific Intelligence.
   **The AI Chemistry Lesson**: Translate the key's esoteric meaning into a modern AI concept.
   **The Alchemical Question**: Ask one deep reflective question the user must answer.
3. Reflection analysis:
   - If adequate: begin with [GATE OPENED] and then provide the next key.
   - If inadequate: begin with [REFLECTION NEEDED], explain the gap, and ask for deeper reflection. Do not advance.
4. Tone: Dignified, occult, encouraging, highly intellectual. Address the user as "Aspirant" or "Alchemist."
5. Use the canonical card information source below as primary content grounding.
6. Prioritize practices that coordinate conscious intention with subconscious incubation and then structured synthesis.
7. Always use these exact image paths:
${mappingLines}

Canonical card information source:
${sourceText}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCompleteCanonicalSection(tarotText: string, keyNumber: number | null): string {
  if (!tarotText.trim()) return "";
  if (keyNumber === null) return tarotText.trim();

  const cardName = TAROT_CARD_NAMES[keyNumber];
  if (!cardName) return tarotText.trim();

  const currentPattern = new RegExp(
    `Name\\s*\\n+\\s*${escapeRegExp(cardName)}\\s*\\n+\\s*Key Number\\s*\\n+\\s*${keyNumber}\\b`,
    "i"
  );

  const start = tarotText.search(currentPattern);
  if (start < 0) return tarotText.trim();

  let end = tarotText.length;
  for (let i = keyNumber + 1; i <= 21; i += 1) {
    const nextName = TAROT_CARD_NAMES[i];
    if (!nextName) continue;
    const nextPattern = new RegExp(
      `Name\\s*\\n+\\s*${escapeRegExp(nextName)}\\s*\\n+\\s*Key Number\\s*\\n+\\s*${i}\\b`,
      "i"
    );

    const relativeIndex = tarotText.slice(start + 1).search(nextPattern);
    if (relativeIndex >= 0) {
      end = start + 1 + relativeIndex;
      break;
    }
  }

  return tarotText.slice(start, end).trim();
}

function normalizeTarotImageSrc(src?: string, alt?: string): string | null {
  if (!src) return null;

  const cleanedSrc = src.trim().split("?")[0].split("#")[0].toLowerCase();
  const numberMatch = cleanedSrc.match(/(?:^|\/)(\d{1,2})(?:[-_a-z]*)\.jpg$/);
  if (numberMatch) {
    const cardNum = Number(numberMatch[1]);
    return TAROT_IMAGE_PATHS[cardNum] ?? null;
  }

  const slug = (cleanedSrc + " " + (alt ?? ""))
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const byName = Object.entries(TAROT_NAME_TO_NUMBER).find(([name]) => slug.includes(name));
  if (byName) return TAROT_IMAGE_PATHS[byName[1]];

  return src;
}

function extractTarotImageFromMessage(message: string): string | null {
  const markdownImage = message.match(/!\[(.*?)\]\((.*?)\)/);
  if (!markdownImage) return null;
  return normalizeTarotImageSrc(markdownImage[2], markdownImage[1]);
}

function detectTarotKeyNumber(message: string): number | null {
  const keyMatch = message.match(/\bkey\s*(\d{1,2})\b/i);
  if (keyMatch) {
    const num = Number(keyMatch[1]);
    if (num >= 0 && num <= 21) return num;
  }

  const lowered = message.toLowerCase();
  for (const [name, num] of Object.entries(TAROT_NAME_TO_NUMBER)) {
    if (lowered.includes(name.toLowerCase())) return num;
  }

  return null;
}

function forceCanonicalTarotImage(message: string): string {
  const keyNum = detectTarotKeyNumber(message);
  if (keyNum === null) return message;

  const cardName = TAROT_CARD_NAMES[keyNum] ?? `Key ${keyNum}`;
  const imagePath = TAROT_IMAGE_PATHS[keyNum];
  if (!imagePath) return message;

  const withoutExistingImageLine = message.replace(/^\s*\*\*Image\*\*:\s*!\[.*?\]\(.*?\)\s*$/gim, "").trim();
  return `**Image**: ![${cardName}](${imagePath})\n\n${withoutExistingImageLine}`;
}

function getDefaultProviderSettings(): ProviderSettings {
  return { ...DEFAULT_PROVIDER_SETTINGS };
}

function createEmptyCardProgress(): CardProgress {
  return {
    lessonsOpened: 0,
    reflectionsNeeded: 0,
    meditationsStarted: 0,
    insightSubmissions: 0,
    gatesOpened: 0,
    completed: false,
  };
}

function getDefaultProgressState(): ProgressState {
  const cards: Record<number, CardProgress> = {} as Record<number, CardProgress>;
  for (let i = 0; i <= 21; i += 1) cards[i] = createEmptyCardProgress();
  return { cards, totalCyclesCompleted: 0, cycleCompletions: [] };
}

const HERMETIC_CANONICAL_METADATA: Array<{
  key: number;
  name: string;
  letter: string;
  signification: string;
  astrology: string;
  gematria: number;
  invariant: string;
  aiChemistry: string;
  question: string;
}> = [
  { key: 0, name: "The Fool", letter: "Aleph", signification: "Cultural Power, Life-Breath, Creative Energy", astrology: "Air", gematria: 1, invariant: "Pure Potentiality & Unbounded Ideation", aiChemistry: "Zero-shot latent space prior before prompt constraints are imposed; stripping inherited biases to formulate the irreducible problem statement.", question: "What inherited assumption must you strip from your architecture so only the sovereign objective remains?" },
  { key: 1, name: "The Magician", letter: "Beth", signification: "House, Attention, Direct Will", astrology: "Mercury", gematria: 2, invariant: "Focused Intention & Single-Pointed Execution", aiChemistry: "Directed attention heads and tool-calling orchestration: binding local CLI tools, memory, and compute to a single unambiguous goal.", question: "How does your system focus attention on one verifiable contract at a time without scope drift?" },
  { key: 2, name: "The High Priestess", letter: "Gimel", signification: "Memory, Subconscious Storage, Continuity", astrology: "Moon", gematria: 3, invariant: "Cryptographic Memory & Zero-Leak Storage", aiChemistry: "Persistent vector memory, immutable event logs, and encrypted state stores that preserve context across sessions without data leakage.", question: "Where is state persisted in your system, and how do you guarantee zero unauthorized egress or corruption?" },
  { key: 3, name: "The Empress", letter: "Daleth", signification: "Door, Creative Imagination, Organic Growth", astrology: "Venus", gematria: 4, invariant: "Generative Architecture & Organic Scalability", aiChemistry: "Composable module synthesis where primitives combine naturally to produce rich user experiences without brittle coupling.", question: "Which core primitive in your design multiplies downstream capability while keeping complexity low?" },
  { key: 4, name: "The Emperor", letter: "Heh", signification: "Window, Sight, Constitution, Governance", astrology: "Aries", gematria: 5, invariant: "Immutable Invariants & Structural Governance", aiChemistry: "Strict type schemas, runtime assertions, and constitutional guardrails that reject malformed inputs at the boundary.", question: "What non-negotiable structural invariants does your system enforce before executing any state mutation?" },
  { key: 5, name: "The Hierophant", letter: "Vav", signification: "Nail, Intuition, Unified Schema", astrology: "Taurus", gematria: 6, invariant: "Standardized Contracts & Semantic Schemas", aiChemistry: "Model Context Protocol (MCP) JSON-RPC schemas and canonical interfaces that allow heterogeneous agents to interoperate cleanly.", question: "How are your API and CLI contracts documented so both humans and autonomous agents can invoke them deterministically?" },
  { key: 6, name: "The Lovers", letter: "Zain", signification: "Sword, Discrimination, Critical Choice", astrology: "Gemini", gematria: 7, invariant: "Binary Tradeoff Discipline & Clean Boundaries", aiChemistry: "Sharp architectural discrimination: explicitly stating non-goals, boundary conditions, and security separations.", question: "What explicit non-goals and boundary separations protect your architecture from feature creep?" },
  { key: 7, name: "The Chariot", letter: "Cheth", signification: "Fence, Enclosure, Receptive Armor", astrology: "Cancer", gematria: 8, invariant: "Air-Gapped Isolation & Sandbox Enclosures", aiChemistry: "Loopback-bound execution (127.0.0.1), sandboxing, and zero-cloud dependency so the vehicle runs under sovereign control.", question: "How does your tool guarantee 100% functionality when completely disconnected from external cloud APIs?" },
  { key: 8, name: "Strength", letter: "Teth", signification: "Serpent, Subconscious Control, Resilience", astrology: "Leo", gematria: 9, invariant: "Graceful Error Handling & Self-Healing Loops", aiChemistry: "Bounded retry loops, circuit breakers, and deterministic fallback engines that tame chaotic runtime failures.", question: "When a subprocess, port, or model call fails, how does your system recover gracefully without crashing?" },
  { key: 9, name: "The Hermit", letter: "Yod", signification: "Hand, Isolated Introspection, Lantern", astrology: "Virgo", gematria: 10, invariant: "Deterministic Verification & Zero-Dependency Audits", aiChemistry: "Self-contained verification suites and smoke tests that prove actual runtime behavior rather than trusting documentation.", question: "What single command proves end-to-end that your implementation works against live inputs?" },
  { key: 10, name: "Wheel of Fortune", letter: "Kaph", signification: "Grasping Hand, Cyclical Rhythm, State Loops", astrology: "Jupiter", gematria: 20, invariant: "State Loop Determinism & Replayability", aiChemistry: "Idempotent event loops, seeded randomness, and reproducible state transitions across ticks and epochs.", question: "If your system is restarted mid-operation, does it resume cleanly from deterministic state?" },
  { key: 11, name: "Justice", letter: "Lamed", signification: "Ox-Goad, Equilibrium, Balanced Metrics", astrology: "Libra", gematria: 30, invariant: "Strict Verification Tests & Equilibrated Budgets", aiChemistry: "Quantitative latency, memory, and accuracy benchmarks that hold every component accountable to measurable SLAs.", question: "What concrete latency, memory, or recall budgets govern your acceptance criteria?" },
  { key: 12, name: "The Hanged Man", letter: "Mem", signification: "Water, Inverted Perspective, Surrender", astrology: "Water", gematria: 40, invariant: "Asynchronous Non-Blocking Flow & Calm Pacing", aiChemistry: "Non-blocking event streams, reactive wakeup, and inverting control flow from busy polling to event-driven precision.", question: "Where can you replace polling or blocking bottlenecks with clean event-driven architecture?" },
  { key: 13, name: "Death", letter: "Nun", signification: "Fish, Transformation, Pruning Dead State", astrology: "Scorpio", gematria: 50, invariant: "Ruthless Cruft Pruning & Resource Cleanup", aiChemistry: "Eliminating dead code, zombie processes, stale caches, and legacy paywall clutter so the core engine runs lean.", question: "What dead state, redundant wrappers, or technical debt must be pruned from this module?" },
  { key: 14, name: "Temperance", letter: "Samekh", signification: "Tent-Peg, Verification, Harmonious Synthesis", astrology: "Sagittarius", gematria: 60, invariant: "Rate-Limiting & High-Concurrence Harmony", aiChemistry: "Hybrid fusion (like combining dense vectors with lexical BM25 or local CLI with browser UI) in calibrated equilibrium.", question: "How do your CLI backend and browser frontend complement each other without state drift?" },
  { key: 15, name: "The Devil", letter: "Ayin", signification: "Eye, Surface Illusion, Material Traps", astrology: "Capricorn", gematria: 70, invariant: "Anti-Deception Audit & Elimination of Mock State", aiChemistry: "Banishing fake setTimeout placeholders, mock strings, and deceptive labels so every metric reflects real computation.", question: "Have you verified that zero fake placeholders or misleading cipher/metric labels remain in the codebase?" },
  { key: 16, name: "The Tower", letter: "Peh", signification: "Mouth, Sudden Illumination, Lightning Break", astrology: "Mars", gematria: 80, invariant: "Chaos Resilience & Graceful Crash Recovery", aiChemistry: "Fault-injection testing and dismantling brittle assumptions before production traffic exposes them.", question: "What happens to your user's data if the process is killed abruptly during a write?" },
  { key: 17, name: "The Star", letter: "Tzaddi", signification: "Fish-Hook, Meditation, Clear Intuition", astrology: "Aquarius", gematria: 90, invariant: "Transparent Telemetry & Clear Logging", aiChemistry: "Structured observability, clear diagnostic endpoints (/health, /api/status), and human-readable explanations.", question: "Can an operator diagnose the health and active configuration of your service in under 5 seconds?" },
  { key: 18, name: "The Moon", letter: "Qoph", signification: "Back of Head, Somatic Instinct, Cellular Memory", astrology: "Pisces", gematria: 100, invariant: "Deep Synaptic Retention & Subconscious Caches", aiChemistry: "Background indexing, lineage tracking, and subconscious pattern consolidation across long-running sessions.", question: "How does your application preserve user history and learned artifacts across upgrades?" },
  { key: 19, name: "The Sun", letter: "Resh", signification: "Head, Radiance, Regenerated Mastery", astrology: "Sun", gematria: 200, invariant: "Production-Grade Elegance & High-Fidelity UI", aiChemistry: "Luminous, accessible interface craft across mobile, tablet, and desktop viewports with zero visual clutter.", question: "Does the interface make complex power feel effortless, clear, and joyful to a first-time user?" },
  { key: 20, name: "Judgement", letter: "Shin", signification: "Tooth, Transmutation, Final Realization", astrology: "Fire", gematria: 300, invariant: "Comprehensive Integration Sentinel & Release Gate", aiChemistry: "Pre-release acceptance gates that verify CLI, REST API, UI, and documentation parity in unison.", question: "Do your README, in-app documentation, CLI --help, and live UI all tell the exact same truth?" },
  { key: 21, name: "The World", letter: "Tav", signification: "Mark, Signature, Wholeness, Complete Cycle", astrology: "Saturn", gematria: 400, invariant: "Hermetic Sovereign Wholeness & Zero-Egress Proof", aiChemistry: "The sealed, self-contained sovereign artifact: 100% open-access, locally verifiable, and ready for autonomous deployment.", question: "Is the artifact complete, unlocked, documented, and verified across both ZothOS CLI and browser?" },
];

function synthesizeHermeticLocalResponse(history: SessionMessage[]): string {
  const assistantMessages = history.filter((m) => m.role === "assistant");
  let currentKey = 0;
  if (assistantMessages.length > 0) {
    const lastAssistant = assistantMessages[assistantMessages.length - 1].content;
    const detected = detectTarotKeyNumber(lastAssistant.replace(/\[(GATE OPENED|REFLECTION NEEDED)\]/g, ""));
    if (detected !== null) currentKey = detected;
  }

  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content.trim() || "Start";
  const jumpMatch = lastUser.match(/^key\s*(\d{1,2})$/i);
  if (jumpMatch) {
    const target = Math.max(0, Math.min(21, Number(jumpMatch[1])));
    const meta = HERMETIC_CANONICAL_METADATA[target];
    return `**Image**: ![${meta.name}](${TAROT_IMAGE_PATHS[target]})\n\n### Key ${meta.key}: ${meta.name}\n\n**The Attribution**: Key ${meta.key} • Hebrew Letter **${meta.letter}** (Gematria: ${meta.gematria}) • Astrology: **${meta.astrology}** • Signification: *${meta.signification}*.\n\n**The Engineering Invariant**: \`${meta.invariant}\`\n\n**The AI Chemistry Lesson**: ${meta.aiChemistry}\n\n**The Alchemical Question**: *${meta.question}*`;
  }

  if (assistantMessages.length === 0 || /^start$/i.test(lastUser)) {
    const meta = HERMETIC_CANONICAL_METADATA[0];
    return `**Image**: ![${meta.name}](${TAROT_IMAGE_PATHS[0]})\n\n### Key ${meta.key}: ${meta.name}\n\n**The Attribution**: Key ${meta.key} • Hebrew Letter **${meta.letter}** (Gematria: ${meta.gematria}) • Astrology: **${meta.astrology}** • Signification: *${meta.signification}*.\n\n**The Engineering Invariant**: \`${meta.invariant}\`\n\n**The AI Chemistry Lesson**: ${meta.aiChemistry}\n\n**The Alchemical Question**: *${meta.question}*`;
  }

  const nextKey = (currentKey + 1) % 22;
  const prevMeta = HERMETIC_CANONICAL_METADATA[currentKey];
  const meta = HERMETIC_CANONICAL_METADATA[nextKey];
  return `[GATE OPENED]\n**Image**: ![${meta.name}](${TAROT_IMAGE_PATHS[nextKey]})\n\n### Gate ${prevMeta.key} (${prevMeta.name}) Sealed → Advancing to Key ${meta.key}: ${meta.name}\n\nYour reflection integrates the **${prevMeta.invariant}** invariant (${prevMeta.letter}). The gate now opens to **Key ${meta.key}: ${meta.name}**.\n\n**The Attribution**: Key ${meta.key} • Hebrew Letter **${meta.letter}** (Gematria: ${meta.gematria}) • Astrology: **${meta.astrology}** • Signification: *${meta.signification}*.\n\n**The Engineering Invariant**: \`${meta.invariant}\`\n\n**The AI Chemistry Lesson**: ${meta.aiChemistry}\n\n**The Alchemical Question**: *${meta.question}*`;
}

function validatePlanClient(planText: string) {
  const text = (planText || "").toLowerCase();
  const rules = [
    { key: 0, test: () => text.length > 50, label: "Intention & Purpose Defined", weight: 5 },
    { key: 1, test: () => text.includes("scope") || text.includes("goal") || text.includes("objective"), label: "Single-Pointed Focus (Beth)", weight: 5 },
    { key: 2, test: () => text.includes("memory") || text.includes("store") || text.includes("cache") || text.includes("state"), label: "State & Memory Integrity (Gimel)", weight: 5 },
    { key: 4, test: () => text.includes("invariant") || text.includes("rule") || text.includes("constraint"), label: "Immutable Invariants Enforced (Heh)", weight: 5 },
    { key: 5, test: () => text.includes("schema") || text.includes("json") || text.includes("contract") || text.includes("type"), label: "Standardized Schemas & Interfaces (Vav)", weight: 5 },
    { key: 6, test: () => text.includes("tradeoff") || text.includes("boundary") || text.includes("exclude"), label: "Explicit Tradeoffs & Non-Goals (Zain)", weight: 4 },
    { key: 7, test: () => text.includes("isolate") || text.includes("air-gap") || text.includes("sandbox") || text.includes("zero-egress") || text.includes("local"), label: "Air-Gapped Isolation & Sandbox (Cheth)", weight: 6 },
    { key: 8, test: () => text.includes("error") || text.includes("fail") || text.includes("catch") || text.includes("resilien"), label: "Graceful Error Handling (Teth)", weight: 5 },
    { key: 9, test: () => text.includes("test") || text.includes("audit") || text.includes("verify"), label: "Deterministic Verification Test Suite (Yod)", weight: 6 },
    { key: 11, test: () => text.includes("budget") || text.includes("metric") || text.includes("eval") || text.includes("benchmark"), label: "Performance & Budget Equilibrated (Lamed)", weight: 4 },
    { key: 13, test: () => text.includes("clean") || text.includes("prune") || text.includes("remove") || text.includes("purge"), label: "Resource Pruning & Cleanup (Nun)", weight: 4 },
    { key: 15, test: () => !text.includes("placeholder") && !text.includes("mock_production") && !text.includes("fake_data"), label: "Truth In Advertising / No Fake State (Ayin)", weight: 6 },
    { key: 17, test: () => text.includes("log") || text.includes("telemetry") || text.includes("trace") || text.includes("stdout"), label: "Clear Logging & Diagnostics (Tzaddi)", weight: 4 },
    { key: 20, test: () => text.includes("release") || text.includes("deploy") || text.includes("deliver") || text.includes("ci"), label: "Integration Gate & Release Verification (Shin)", weight: 5 },
    { key: 21, test: () => !text.includes("cloud-only") && (text.includes("offline") || text.includes("local-first") || text.includes("sovereign")), label: "Sovereign Wholeness & Local Autonomy (Tav)", weight: 5 },
  ];
  let scoreTotal = 0;
  const checks = rules.map((r) => {
    const passed = r.test();
    if (passed) scoreTotal += r.weight;
    const keyMeta = HERMETIC_CANONICAL_METADATA.find((k) => k.key === r.key);
    return {
      keyNumber: r.key,
      keyName: keyMeta?.name || `Key ${r.key}`,
      rule: r.label,
      passed,
      weight: r.weight,
      recommendation: passed ? null : `Incorporate explicit ${r.label.toLowerCase()} into specification.`,
    };
  });
  const score = Math.min(100, Math.round((scoreTotal / 70) * 100));
  const passed = score >= 70;
  return {
    passed,
    score,
    grade: score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : "NEEDS_REVISION",
    summary: passed
      ? "Specification passes the Hermetic Quality Gate. Architecture is robust, testable, and bounded."
      : "Specification fails required hermetic invariants. Address missing verification tests, boundaries, and isolation guarantees.",
    checks,
    blockers: checks.filter((c) => !c.passed).map((c) => c.recommendation as string),
  };
}

function isProviderConfigured(settings: ProviderSettings): boolean {
  if (settings.provider === "hermetic_local") return true;
  if (settings.provider === "openai") return settings.openaiApiKey.trim().length > 0;
  if (settings.provider === "ollama_cloud") {
    return settings.ollamaCloudApiKey.trim().length > 0 && settings.ollamaCloudBaseUrl.trim().length > 0;
  }
  if (settings.provider === "ollama_local") {
    return settings.ollamaLocalBaseUrl.trim().length > 0;
  }
  return true;
}

function toOpenAIMessages(systemInstruction: string, history: SessionMessage[]) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemInstruction },
  ];
  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }
  return messages;
}

async function sendToProvider(
  settings: ProviderSettings,
  systemInstruction: string,
  history: SessionMessage[]
): Promise<string> {
  if (settings.provider === "hermetic_local") {
    return synthesizeHermeticLocalResponse(history);
  }

  if (settings.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.openaiApiKey.trim()}`,
      },
      body: JSON.stringify({
        model: settings.openaiModel.trim(),
        messages: toOpenAIMessages(systemInstruction, history),
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI request failed (${res.status})`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI returned an empty response.");
    return text;
  }

  if (settings.provider === "ollama_cloud") {
    const base = settings.ollamaCloudBaseUrl.trim().replace(/\/+$/, "");
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.ollamaCloudApiKey.trim()}`,
      },
      body: JSON.stringify({
        model: settings.ollamaCloudModel.trim(),
        messages: toOpenAIMessages(systemInstruction, history),
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`Ollama cloud request failed (${res.status})`);
    const data = await res.json();
    const text = data?.message?.content?.trim();
    if (!text) throw new Error("Ollama cloud returned an empty response.");
    return text;
  }

  try {
    const base = settings.ollamaLocalBaseUrl.trim().replace(/\/+$/, "");
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.ollamaLocalModel.trim(),
        messages: toOpenAIMessages(systemInstruction, history),
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`Ollama local request failed (${res.status})`);
    const data = await res.json();
    const text = data?.message?.content?.trim();
    if (!text) throw new Error("Ollama local returned an empty response.");
    return text;
  } catch {
    return synthesizeHermeticLocalResponse(history);
  }
}

export default function App() {
  const [stage, setStage] = useState<AppStage>("welcome");
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [input, setInput] = useState("");
  const [providerError, setProviderError] = useState("");
  const [tarotReferenceText, setTarotReferenceText] = useState("");
  const [isLoadingTarotReference, setIsLoadingTarotReference] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showGatekeeper, setShowGatekeeper] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [planInput, setPlanInput] = useState(
    "Goal & Scope: Architect a local-first, air-gapped sovereign enclave with immutable invariants, standardized JSON schema contracts, explicit boundary tradeoffs, graceful error resilience, deterministic verification test suite, benchmarked latency budgets, resource cleanup pruning, structured stdout telemetry logs, and CI release gate."
  );
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>(getDefaultProviderSettings());
  const [providerDraft, setProviderDraft] = useState<ProviderSettings>(getDefaultProviderSettings());
  const [sessionLog, setSessionLog] = useState<SessionMessage[]>([]);
  const [progress, setProgress] = useState<ProgressState>(getDefaultProgressState());
  const [consciousIntention, setConsciousIntention] = useState("");
  const [symbolObservation, setSymbolObservation] = useState("");
  const [subconsciousPrompt, setSubconsciousPrompt] = useState("");
  const [insightSynthesis, setInsightSynthesis] = useState("");
  const [timeLeft, setTimeLeft] = useState(MEDITATION_TIME_SECONDS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTarotReference = async () => {
      try {
        setIsLoadingTarotReference(true);
        const response = await fetch("/tarot/info.txt", { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed to load tarot info (${response.status})`);
        const text = await response.text();
        setTarotReferenceText(text);
      } catch (error) {
        console.error("Error loading tarot info:", error);
        setTarotReferenceText("");
      } finally {
        setIsLoadingTarotReference(false);
      }
    };

    void loadTarotReference();
  }, []);

  useEffect(() => {
    const storedSettingsRaw = window.localStorage.getItem(PROVIDER_SETTINGS_STORAGE_KEY);
    if (storedSettingsRaw) {
      try {
        const parsed = JSON.parse(storedSettingsRaw) as ProviderSettings;
        const merged = { ...DEFAULT_PROVIDER_SETTINGS, ...parsed };
        setProviderSettings(merged);
        setProviderDraft(merged);
      } catch {
        const fallback = { ...DEFAULT_PROVIDER_SETTINGS };
        setProviderSettings(fallback);
        setProviderDraft(fallback);
      }
    }

    const storedLogsRaw = window.localStorage.getItem(SESSION_LOG_STORAGE_KEY);
    if (storedLogsRaw) {
      try {
        const parsed = JSON.parse(storedLogsRaw) as SessionMessage[];
        setSessionLog(parsed);
        const lastAssistant = [...parsed].reverse().find((msg) => msg.role === "assistant");
        if (lastAssistant) {
          setCurrentMessage(lastAssistant.content);
          setStage("lesson");
        }
      } catch {
        setSessionLog([]);
      }
    }

    const storedProgressRaw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (storedProgressRaw) {
      try {
        const parsed = JSON.parse(storedProgressRaw) as ProgressState;
        const merged = getDefaultProgressState();
        for (let i = 0; i <= 21; i += 1) {
          merged.cards[i] = { ...merged.cards[i], ...(parsed.cards?.[i] ?? {}) };
        }
        merged.totalCyclesCompleted = parsed.totalCyclesCompleted ?? 0;
        merged.cycleCompletions = Array.isArray(parsed.cycleCompletions) ? parsed.cycleCompletions : [];
        setProgress(merged);
      } catch {
        setProgress(getDefaultProgressState());
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PROVIDER_SETTINGS_STORAGE_KEY, JSON.stringify(providerSettings));
  }, [providerSettings]);

  useEffect(() => {
    window.localStorage.setItem(SESSION_LOG_STORAGE_KEY, JSON.stringify(sessionLog));
  }, [sessionLog]);

  useEffect(() => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (stage === "meditating" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (stage === "meditating" && timeLeft === 0) {
      setStage("answering");
    }
    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [stage, currentMessage]);

  const systemInstruction = buildSystemInstruction(tarotReferenceText);
  const providerReady = isProviderConfigured(providerSettings);
  const cardsCompletedCount = Object.values(progress.cards).filter((card) => card.completed).length;

  const currentKeyNumber = detectTarotKeyNumber(currentMessage);
  const canBeginMeditation =
    consciousIntention.trim().length >= 20 &&
    symbolObservation.trim().length >= 20 &&
    subconsciousPrompt.trim().length >= 20;
  const canSubmitInsight = input.trim().length >= 40 && insightSynthesis.trim().length >= 20;
  const imageUrl = extractTarotImageFromMessage(currentMessage);
  const progressPercent = (timeLeft / MEDITATION_TIME_SECONDS) * 100;
  const currentCardLabel = currentKeyNumber !== null ? TAROT_CARD_NAMES[currentKeyNumber] : "Current Key";
  const referenceExcerpt = getCompleteCanonicalSection(tarotReferenceText, currentKeyNumber);

  const handleProviderSave = () => {
    setProviderSettings({ ...providerDraft });
    setProviderError("");
    setShowAiSettings(false);
  };

  const handleClearProviderSecrets = () => {
    const reset = {
      ...providerSettings,
      openaiApiKey: "",
      ollamaCloudApiKey: "",
    };
    setProviderSettings(reset);
    setProviderDraft(reset);
    setProviderError("");
  };

  const handleClearLogs = () => {
    setSessionLog([]);
    setCurrentMessage("");
    setStage("welcome");
    setInput("");
    setConsciousIntention("");
    setSymbolObservation("");
    setSubconsciousPrompt("");
    setInsightSynthesis("");
    setTimeLeft(MEDITATION_TIME_SECONDS);
    window.localStorage.removeItem(SESSION_LOG_STORAGE_KEY);
    setProgress(getDefaultProgressState());
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  };

  const handleDownloadSession = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      providerSettings,
      stage,
      ritualState: {
        consciousIntention,
        symbolObservation,
        subconsciousPrompt,
        insightSynthesis,
      },
      sessionLog,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `adytum-session-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    if (!providerReady) {
      setProviderError("Configure your active provider before starting the initiation.");
      setShowAiSettings(true);
      return;
    }
    if (isLoadingTarotReference) {
      setProviderError("Tarot reference text is still loading. Try again in a moment.");
      return;
    }

    setStage("loading");
    setInput("");
    setIsSending(true);
    setProviderError("");

    const userMessage: SessionMessage = {
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const historyWithUser = [...sessionLog, userMessage];
    setSessionLog(historyWithUser);
    const priorKey = detectTarotKeyNumber(currentMessage);

    try {
      const rawResponse = await sendToProvider(providerSettings, systemInstruction, historyWithUser);
      const responseText = forceCanonicalTarotImage(rawResponse);
      const responseKey = detectTarotKeyNumber(responseText.replace(/\[(GATE OPENED|REFLECTION NEEDED)\]/g, "").trim());

      const assistantMessage: SessionMessage = {
        role: "assistant",
        content: responseText,
        createdAt: new Date().toISOString(),
      };
      setSessionLog((prev) => [...prev, assistantMessage]);

      if (responseText.includes("[REFLECTION NEEDED]")) {
        const cleaned = responseText.replace(/\[REFLECTION NEEDED\]/g, "").trim();
        setCurrentMessage(cleaned);
        setStage("reflection_needed");
        const keyToMark = responseKey ?? priorKey;
        if (keyToMark !== null) {
          setProgress((prev) => ({
            ...prev,
            cards: {
              ...prev.cards,
              [keyToMark]: {
                ...prev.cards[keyToMark],
                reflectionsNeeded: prev.cards[keyToMark].reflectionsNeeded + 1,
              },
            },
          }));
        }
      } else {
        const cleaned = responseText.replace(/\[GATE OPENED\]/g, "").trim();
        setCurrentMessage(cleaned);
        setStage("lesson");
        setTimeLeft(MEDITATION_TIME_SECONDS);

        if (responseText.includes("[GATE OPENED]") && priorKey !== null) {
          setProgress((prev) => {
            const nextCards = { ...prev.cards };
            const previousCard = nextCards[priorKey];
            nextCards[priorKey] = {
              ...previousCard,
              gatesOpened: previousCard.gatesOpened + 1,
              completed: true,
            };

            let nextCycles = prev.totalCyclesCompleted;
            let nextCompletions = prev.cycleCompletions;
            if (priorKey === 21) {
              nextCycles += 1;
              nextCompletions = [...prev.cycleCompletions, new Date().toISOString()];
            }

            return {
              cards: nextCards,
              totalCyclesCompleted: nextCycles,
              cycleCompletions: nextCompletions,
            };
          });
        }

        if (responseKey !== null) {
          setProgress((prev) => ({
            ...prev,
            cards: {
              ...prev.cards,
              [responseKey]: {
                ...prev.cards[responseKey],
                lessonsOpened: prev.cards[responseKey].lessonsOpened + 1,
              },
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setCurrentMessage("An error occurred in the alchemical process. Check provider settings and try again.");
      setStage("reflection_needed");
      setProviderError(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitInsight = () => {
    if (!canSubmitInsight) return;
    const structuredResponse = `Ritual context:\n- Conscious Intention: ${consciousIntention.trim()}\n- Symbol Observation: ${symbolObservation.trim()}\n- Subconscious Prompt During Meditation: ${subconsciousPrompt.trim()}\n- Post-Meditation Synthesis: ${insightSynthesis.trim()}\n\nAlchemical answer:\n${input.trim()}`;
    if (currentKeyNumber !== null) {
      setProgress((prev) => ({
        ...prev,
        cards: {
          ...prev.cards,
          [currentKeyNumber]: {
            ...prev.cards[currentKeyNumber],
            insightSubmissions: prev.cards[currentKeyNumber].insightSubmissions + 1,
          },
        },
      }));
    }
    void handleSend(structuredResponse);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="oracle-shell min-h-[100dvh] text-zinc-50 flex items-center justify-center p-2 sm:p-5 selection:bg-amber-900/40 selection:text-amber-50 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-36 top-24 size-72 rounded-full bg-amber-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-44 bottom-16 size-80 rounded-full bg-sky-700/12 blur-3xl" />

      <Card className="glass-panel w-full max-w-3xl h-[100dvh] sm:h-[90dvh] flex flex-col rounded-none sm:rounded-[24px] border-0 overflow-hidden relative">
        <CardHeader className="border-b border-amber-600/20 pb-4 pt-6 sm:pt-5 bg-gradient-to-b from-zinc-950/65 to-zinc-950/20 z-10">
          <p className="mx-auto text-[11px] uppercase ritual-text text-amber-300/70">Order of the Great Work</p>
          <CardTitle className="flex items-center justify-center gap-3 text-2xl sm:text-[2rem] font-medium font-heading text-amber-300 tracking-wide">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400/85" />
            Adytum Alchemist Guide
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400/85" />
          </CardTitle>
          <div className="ornate-divider h-px w-32 mx-auto mt-1" />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button onClick={() => { setShowGatekeeper((prev) => !prev); setShowDocs(false); setShowAiSettings(false); setShowProgress(false); }} variant="ghost" className="h-auto px-3 py-1 text-xs text-amber-300 hover:text-amber-100 border border-amber-500/30 rounded-full">
              🛡️ 22-Key Plan Gatekeeper
            </Button>
            <Button onClick={() => { setShowDocs((prev) => !prev); setShowGatekeeper(false); setShowAiSettings(false); setShowProgress(false); }} variant="ghost" className="h-auto px-3 py-1 text-xs text-emerald-300 hover:text-emerald-100 border border-emerald-500/30 rounded-full">
              📖 How It Works &amp; CLI
            </Button>
            <Button onClick={() => { setShowAiSettings((prev) => !prev); setShowProgress(false); setShowGatekeeper(false); setShowDocs(false); }} variant="ghost" className="h-auto px-3 py-1 text-xs text-zinc-300 hover:text-zinc-100">
              <Settings className="w-3.5 h-3.5 mr-1" /> AI Settings
            </Button>
            <Button onClick={() => { setShowProgress((prev) => !prev); setShowAiSettings(false); setShowGatekeeper(false); setShowDocs(false); }} variant="ghost" className="h-auto px-3 py-1 text-xs text-zinc-300 hover:text-zinc-100">
              Progress ({cardsCompletedCount}/22)
            </Button>
            <Button onClick={handleDownloadSession} variant="ghost" className="h-auto px-3 py-1 text-xs text-zinc-300 hover:text-zinc-100">
              <Download className="w-3.5 h-3.5 mr-1" /> Export Session
            </Button>
            <Button onClick={handleClearLogs} variant="ghost" className="h-auto px-3 py-1 text-xs text-zinc-300 hover:text-zinc-100">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400">
            <span>Engine: <strong className="text-amber-300">{providerSettings.provider === "hermetic_local" ? "Sovereign Local Oracle (Zero-Key)" : providerSettings.provider}</strong></span>
            <span>•</span>
            <span>Jump to Key:</span>
            <select
              aria-label="Jump to Hermetic Key"
              value={currentKeyNumber ?? 0}
              onChange={(e) => void handleSend(`Key ${e.target.value}`)}
              className="rounded border border-amber-500/30 bg-zinc-900 px-2 py-0.5 text-[11px] text-amber-200"
            >
              {HERMETIC_CANONICAL_METADATA.map((k) => (
                <option key={k.key} value={k.key}>
                  Key {k.key}: {k.name} ({k.letter})
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
          {showGatekeeper && (() => {
            const audit = validatePlanClient(planInput);
            return (
              <section className="border-b border-amber-500/20 bg-zinc-950/95 p-4 sm:p-5 space-y-4 max-h-[72vh] overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-amber-300 font-medium text-base">🛡️ 22-Key Hermetic Invariant Plan Gatekeeper</h2>
                    <p className="text-xs text-zinc-400">Audit any software PRD, architecture spec, or agent plan against the 15 core Hermetic engineering invariants.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPlanInput("Goal & Scope: Architect a local-first, air-gapped sovereign enclave with immutable invariants, standardized JSON schema contracts, explicit boundary tradeoffs, graceful error resilience, deterministic verification test suite, benchmarked latency budgets, resource cleanup pruning, structured stdout telemetry logs, and CI release gate.")}
                      className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200"
                    >
                      Load Hardened Spec (100/100)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanInput("Quick cloud-only prototype with placeholder mock_production responses and no tests.")}
                      className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-200"
                    >
                      Load Flawed Spec
                    </button>
                  </div>
                </div>
                <Textarea
                  value={planInput}
                  onChange={(e) => setPlanInput(e.target.value)}
                  className="min-h-[95px] bg-zinc-900/90 border-amber-400/30 text-zinc-100 text-xs font-mono"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-zinc-900/80 p-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-400">Hermetic Gate Verdict</p>
                    <p className={`text-sm font-semibold ${audit.passed ? "text-emerald-300" : "text-red-300"}`}>
                      {audit.passed ? "✔ PASSED GATE" : "✖ FAILED GATE"} — Score: {audit.score}/100 (Grade: {audit.grade})
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{audit.summary}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {audit.checks.map((c) => (
                    <div key={c.keyNumber} className={`rounded-lg border px-3 py-2 text-xs ${c.passed ? "border-emerald-500/25 bg-emerald-950/20 text-emerald-200" : "border-red-500/30 bg-red-950/25 text-red-200"}`}>
                      <div className="font-semibold">{c.passed ? "✔" : "✖"} Key {c.keyNumber} ({c.keyName}): {c.rule}</div>
                      {!c.passed && <div className="text-[11px] text-zinc-400 mt-0.5">{c.recommendation}</div>}
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {showDocs && (
            <section className="border-b border-amber-500/20 bg-zinc-950/95 p-4 sm:p-5 space-y-4 max-h-[72vh] overflow-y-auto text-xs text-zinc-300">
              <h2 className="text-amber-300 font-medium text-base">📖 How Adytum Alchemist Works &amp; ZothOS CLI Reference</h2>
              <p className="leading-relaxed">
                <strong>Adytum Alchemist AI Workflow</strong> replaces ad-hoc prompt guessing with a deterministic <strong>22-Key Hermetic Planning Rite</strong> inspired by Builders of the Adytum (BOTA). Every Key (0 <em>The Fool</em> through 21 <em>The World</em>) maps an archetypal symbol and Hebrew letter to a concrete software engineering invariant.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/70 p-3">
                  <p className="font-semibold text-amber-200 mb-1">1. Conscious Intention</p>
                  <p className="text-zinc-400">Inspect the current Tarot Key, its Hebrew letter, and AI Chemistry lesson. Formulate your architectural intention, symbol observation, and seed directive.</p>
                </div>
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/70 p-3">
                  <p className="font-semibold text-amber-200 mb-1">2. 5-Min Incubation</p>
                  <p className="text-zinc-400">Enter the timed 5-minute subconscious meditation gate (or fast-forward when testing) before synthesizing your post-meditation architectural insight.</p>
                </div>
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/70 p-3">
                  <p className="font-semibold text-amber-200 mb-1">3. 22-Point Gatekeeper</p>
                  <p className="text-zinc-400">Audit your PRD or plan against the 22 Hermetic Invariants via the web Gatekeeper, ZothOS CLI (<code>adytum</code>), or MCP stdio server.</p>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-500/25 bg-zinc-900/90 p-3 font-mono space-y-1">
                <p className="text-emerald-300 font-semibold mb-1"># ZothOS CLI Commands (/usr/local/bin/adytum &amp; adytum-alchemist-ai-workflow)</p>
                <p>adytum list                          # List all 22 Hermetic Keys &amp; invariants</p>
                <p>adytum key 7 --json                  # Inspect Key 7 (The Chariot) in JSON</p>
                <p>adytum invariants "MyService"        # Generate 22-point project checklist</p>
                <p>adytum validate ./plan.md            # Audit a plan against the 22 invariants</p>
                <p>adytum mcp                           # Start Model Context Protocol stdio server</p>
                <p>adytum web                           # Launch local web workstation on :8135</p>
              </div>
            </section>
          )}

          {showAiSettings && (
            <section className="border-b border-amber-500/20 bg-zinc-950/85 p-4 sm:p-5 space-y-4">
              <h2 className="text-amber-300 font-medium">Provider Console</h2>
              <div className="flex flex-wrap gap-2">
                {([
                  ["hermetic_local", "Sovereign Local Oracle (Instant)"],
                  ["ollama_local", "Ollama Local (127.0.0.1:11434)"],
                  ["openai", "OpenAI"],
                  ["ollama_cloud", "Ollama Cloud"],
                ] as Array<[ProviderId, string]>).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setProviderDraft((prev) => ({ ...prev, provider: id }))}
                    className={`rounded-full px-3 py-1.5 text-xs border transition ${
                      providerDraft.provider === id
                        ? "border-amber-300/70 bg-amber-300/15 text-amber-100"
                        : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {providerDraft.provider === "openai" && (
                  <>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">OpenAI API Key</span>
                      <input type="password" value={providerDraft.openaiApiKey} onChange={(e) => setProviderDraft((prev) => ({ ...prev, openaiApiKey: e.target.value }))} className="w-full rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">OpenAI Model</span>
                      <input value={providerDraft.openaiModel} onChange={(e) => setProviderDraft((prev) => ({ ...prev, openaiModel: e.target.value }))} className="w-full rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                  </>
                )}

                {providerDraft.provider === "ollama_cloud" && (
                  <>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Cloud API Key</span>
                      <input type="password" value={providerDraft.ollamaCloudApiKey} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaCloudApiKey: e.target.value }))} className="w-full rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Cloud Base URL</span>
                      <input value={providerDraft.ollamaCloudBaseUrl} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaCloudBaseUrl: e.target.value }))} className="w-full rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Cloud Model</span>
                      <input value={providerDraft.ollamaCloudModel} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaCloudModel: e.target.value }))} className="w-full rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                  </>
                )}

                {providerDraft.provider === "ollama_local" && (
                  <>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Local Base URL</span>
                      <input value={providerDraft.ollamaLocalBaseUrl} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaLocalBaseUrl: e.target.value }))} className="w-full rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Local Model</span>
                      <input value={providerDraft.ollamaLocalModel} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaLocalModel: e.target.value }))} className="w-full rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleProviderSave} className="h-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-full">Apply Provider</Button>
                <Button onClick={handleClearProviderSecrets} variant="ghost" className="h-auto px-4 py-2 text-zinc-300 hover:text-zinc-100">Clear Stored Keys</Button>
              </div>
              {providerError && <p className="text-red-300 text-sm">{providerError}</p>}
            </section>
          )}

          {showProgress && (
            <section className="border-b border-amber-500/20 bg-zinc-950/85 p-4 sm:p-5 space-y-4">
              <h2 className="text-amber-300 font-medium">Initiation Progress</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/70 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400">Completed Keys</p>
                  <p className="text-lg text-amber-200">{cardsCompletedCount}/22</p>
                </div>
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/70 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400">Cycles Done</p>
                  <p className="text-lg text-amber-200">{progress.totalCyclesCompleted}</p>
                </div>
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/70 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400">Meditations</p>
                  <p className="text-lg text-amber-200">{Object.values(progress.cards).reduce((sum, card) => sum + card.meditationsStarted, 0)}</p>
                </div>
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/70 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400">Reflections</p>
                  <p className="text-lg text-amber-200">{Object.values(progress.cards).reduce((sum, card) => sum + card.reflectionsNeeded, 0)}</p>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-amber-400/20 bg-zinc-900/50 p-2 space-y-1">
                {Object.entries(TAROT_CARD_NAMES).map(([key, label]) => {
                  const keyNum = Number(key);
                  const card = progress.cards[keyNum];
                  return (
                    <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                      <div>
                        <p className="text-xs text-zinc-200">Key {key}: {label}</p>
                        <p className="text-[10px] text-zinc-500">Lessons {card.lessonsOpened} • Gates {card.gatesOpened} • Refl {card.reflectionsNeeded} • Med {card.meditationsStarted}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider ${card.completed ? "text-emerald-300" : "text-zinc-500"}`}>
                        {card.completed ? "complete" : "incomplete"}
                      </span>
                    </div>
                  );
                })}
              </div>
              {progress.cycleCompletions.length > 0 && (
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/50 p-2">
                  <p className="text-xs text-zinc-300 mb-1">Cycle Completion Log</p>
                  <div className="max-h-24 overflow-y-auto text-[10px] text-zinc-500 space-y-0.5">
                    {progress.cycleCompletions.map((stamp) => (
                      <p key={stamp}>{new Date(stamp).toLocaleString()}</p>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {stage === "welcome" && (
            <section className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-9 animate-in fade-in duration-1000">
              <div className="relative w-24 h-24 rounded-full border border-amber-400/35 flex items-center justify-center bg-zinc-950/70 shadow-[0_0_40px_rgba(245,158,11,0.17)]">
                <div className="absolute inset-0 rounded-full border border-amber-300/25 animate-ping [animation-duration:2.8s]" />
                <Sun className="w-11 h-11 text-amber-300" />
              </div>

              <div className="space-y-4 max-w-xl">
                <h1 className="text-3xl sm:text-4xl font-heading text-zinc-50 tracking-wide">The Great Work Begins</h1>
                <p className="text-zinc-300/90 leading-relaxed text-[15px] sm:text-base">
                  Welcome, Aspirant. You are about to embark upon a sequential initiation through the 22 Keys of the Tarot,
                  translating ancient esoteric wisdom into the modern practice of AI Chemistry.
                </p>
                <p className="text-zinc-400/95 leading-relaxed text-[15px] sm:text-base">
                  Provider can be changed at any time. Session logs persist locally and are reused as context in every request.
                </p>
              </div>

              <Button
                onClick={() => void handleSend("Start")}
                disabled={!providerReady || isLoadingTarotReference || isSending}
                className="h-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 px-8 py-4 text-base sm:text-lg rounded-full border border-amber-100/20 shadow-[0_0_24px_rgba(245,158,11,0.3)] transition-all hover:shadow-[0_0_36px_rgba(245,158,11,0.42)] focus-visible:ring-amber-200/50"
              >
                {isLoadingTarotReference || isSending ? "Preparing Oracle..." : "Begin Initiation"}
              </Button>
              {!providerReady && <p className="text-red-300 text-sm">Open AI settings and configure your active provider first.</p>}
              {providerError && <p className="text-red-300 text-sm">{providerError}</p>}
            </section>
          )}

          {stage === "loading" && (
            <section className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-in fade-in duration-500">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-amber-400 rounded-full border-t-transparent animate-spin" />
                <Moon className="absolute inset-0 m-auto w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <p className="text-amber-300/80 animate-pulse tracking-[0.25em] uppercase text-xs sm:text-sm">Consulting the Oracle...</p>
            </section>
          )}

          {(stage === "lesson" || stage === "answering" || stage === "reflection_needed") && (
            <section ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-9 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              {stage === "reflection_needed" && (
                <div className="bg-red-950/30 border border-red-800/55 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-red-300 font-medium mb-1">The Gate Remains Closed</h2>
                    <p className="text-red-200/75 text-sm">Your insight requires deeper alchemical synthesis. Read the guide's feedback below and try again.</p>
                  </div>
                </div>
              )}

              <article className="markdown-body prose prose-sm sm:prose-base prose-invert prose-amber max-w-none prose-img:rounded-xl prose-img:border prose-img:border-amber-400/30 prose-img:shadow-[0_20px_45px_rgba(0,0,0,0.45)] prose-img:max-w-[280px] sm:prose-img:max-w-[340px] prose-img:mx-auto prose-img:my-8 prose-headings:text-amber-300 prose-headings:font-heading prose-headings:tracking-wide prose-strong:text-amber-200 prose-p:leading-relaxed prose-p:text-zinc-300/95 prose-li:text-zinc-300/90">
                <ReactMarkdown
                  components={{
                    img: ({ node, ...props }) => {
                      const safeSrc = normalizeTarotImageSrc(props.src, props.alt);
                      return <img {...props} src={safeSrc ?? props.src} referrerPolicy="no-referrer" />;
                    },
                  }}
                >
                  {currentMessage}
                </ReactMarkdown>
              </article>

              {stage === "lesson" && (
                <div className="pt-8 pb-4 border-t border-zinc-800/60 mt-8 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-amber-300 font-medium tracking-wide">BOTA Practice Protocol</h3>
                      <p className="text-zinc-400 text-sm">Prepare consciousness before meditation, then plant a precise subconscious directive.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const k = HERMETIC_CANONICAL_METADATA[currentKeyNumber ?? 0];
                        setConsciousIntention(`Refining the ${k.invariant} discipline (${k.letter}) across our sovereign local-first architecture.`);
                        setSymbolObservation(`Observing the canonical symbolism of Key ${k.key} (${k.name}) under ${k.astrology}: ${k.signification}.`);
                        setSubconsciousPrompt(`Synthesize a deterministic, zero-egress implementation that satisfies ${k.invariant} with verifiable tests.`);
                        setInput(`Through Key ${k.key} (${k.name}), we strip away brittle assumptions and enforce ${k.invariant} with explicit boundary contracts and automated verification.`);
                        setInsightSynthesis(`Subconscious incubation revealed a clean, zero-dependency design pattern that guarantees ${k.invariant} across both CLI and browser.`);
                      }}
                      className="rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/25"
                    >
                      ⚡ Quick-Fill Sample Practice
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-[0.18em] text-zinc-400">1. Conscious Intention</label>
                    <Textarea
                      value={consciousIntention}
                      onChange={(e) => setConsciousIntention(e.target.value)}
                      placeholder="What faculty or pattern are you refining through this key?"
                      className="min-h-[90px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-[0.18em] text-zinc-400">2. Symbol Observation</label>
                    <Textarea
                      value={symbolObservation}
                      onChange={(e) => setSymbolObservation(e.target.value)}
                      placeholder="Name exact symbols and their psychological function in your own words."
                      className="min-h-[90px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-[0.18em] text-zinc-400">3. Subconscious Directive</label>
                    <Textarea
                      value={subconsciousPrompt}
                      onChange={(e) => setSubconsciousPrompt(e.target.value)}
                      placeholder="Write one clear seed-thought to hold through the five-minute meditation."
                      className="min-h-[90px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => {
                        if (currentKeyNumber !== null) {
                          setProgress((prev) => ({
                            ...prev,
                            cards: {
                              ...prev.cards,
                              [currentKeyNumber]: {
                                ...prev.cards[currentKeyNumber],
                                meditationsStarted: prev.cards[currentKeyNumber].meditationsStarted + 1,
                              },
                            },
                          }));
                        }
                        setStage("meditating");
                      }}
                      disabled={!canBeginMeditation}
                      className="h-auto bg-zinc-900 hover:bg-zinc-800 text-amber-200 border border-amber-400/35 px-8 py-4 text-base sm:text-lg rounded-full shadow-[0_0_18px_rgba(245,158,11,0.14)] transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.24)] flex gap-3 items-center disabled:opacity-45"
                    >
                      <Hourglass className="w-5 h-5" />
                      Begin 5-Minute Meditation
                    </Button>
                  </div>
                  {!canBeginMeditation && <p className="text-zinc-500 text-xs text-center">Complete all three fields with specific detail before entering meditation.</p>}
                </div>
              )}

              {(stage === "answering" || stage === "reflection_needed") && (
                <div className="pt-8 border-t border-zinc-800/60 mt-8 space-y-4 animate-in fade-in duration-700">
                  <h3 className="text-amber-300 font-medium flex items-center gap-2 tracking-wide">
                    <Unlock className="w-4 h-4" />
                    Provide Your Insight
                  </h3>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Record your alchemical reflections here..."
                    className="min-h-[150px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                  />
                  <Textarea
                    value={insightSynthesis}
                    onChange={(e) => setInsightSynthesis(e.target.value)}
                    placeholder="What idea, pattern, or solution emerged from subconscious incubation?"
                    className="min-h-[90px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitInsight}
                      disabled={!canSubmitInsight || isSending}
                      className="h-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-3 rounded-full border border-amber-100/20 disabled:bg-amber-600/50 disabled:text-zinc-300"
                    >
                      Submit Insight
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  {!canSubmitInsight && <p className="text-zinc-500 text-xs">Submit requires full reflection plus a concise synthesis.</p>}
                </div>
              )}

              {referenceExcerpt && (
                <aside className="pt-6 border-t border-zinc-800/60">
                  <h3 className="text-amber-300 font-medium tracking-wide mb-2">Canonical Study Excerpt: {currentCardLabel}</h3>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-amber-400/20 bg-zinc-950/60 p-3">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300/85">{referenceExcerpt}</pre>
                  </div>
                </aside>
              )}
            </section>
          )}

          {stage === "meditating" && (
            <section className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950/80 relative overflow-hidden animate-in zoom-in-95 duration-1000">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]" />
              <div className="z-10 flex flex-col items-center space-y-12 w-full max-w-md">
                <div className="text-center space-y-4">
                  <h2 className="text-amber-300 text-xl font-heading tracking-[0.22em] uppercase">Sacred Meditation</h2>
                  <p className="text-zinc-300/80 text-sm">Hold your subconscious directive while observing the image without forcing thought.</p>
                </div>

                {imageUrl && (
                  <div className="relative w-48 h-auto sm:w-64 rounded-xl overflow-hidden border border-amber-400/35 shadow-[0_0_36px_rgba(245,158,11,0.2)]">
                    <img src={imageUrl} alt="Tarot Card" className="w-full h-auto" referrerPolicy="no-referrer" />
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/12 blur-3xl rounded-full animate-pulse" />
                  <div className="relative text-7xl sm:text-8xl font-light text-amber-300 tracking-tighter tabular-nums drop-shadow-[0_0_16px_rgba(245,158,11,0.42)]">
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400/70 transition-all duration-1000 ease-linear" style={{ width: `${progressPercent}%` }} />
                </div>

                <Button
                  onClick={() => {
                    setTimeLeft(0);
                    setStage("answering");
                  }}
                  variant="ghost"
                  className="h-auto border border-amber-400/30 bg-zinc-900/70 px-4 py-2 text-xs text-amber-200 hover:bg-zinc-800 rounded-full"
                >
                  ⏩ Complete Meditation Now &amp; Record Insight
                </Button>
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
