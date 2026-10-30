import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Sparkles,
  Hourglass,
  Lock,
  Unlock,
  Settings,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  BookOpen,
  Wand2,
  Play,
  Pause,
  FastForward,
  Copy,
  Check,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AppStage = "lesson" | "meditating" | "answering" | "reflection_needed" | "loading";
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

export const HERMETIC_CANONICAL_METADATA: Array<{
  key: number;
  roman: string;
  name: string;
  letter: string;
  signification: string;
  astrology: string;
  gematria: number;
  invariant: string;
  aiChemistry: string;
  question: string;
}> = [
  { key: 0, roman: "0", name: "The Fool", letter: "Aleph", signification: "Cultural Power, Life-Breath, Creative Energy", astrology: "Air", gematria: 1, invariant: "Pure Potentiality & Unbounded Ideation", aiChemistry: "Zero-shot latent space prior before prompt constraints are imposed; stripping inherited biases to formulate the irreducible problem statement.", question: "What inherited assumption must you strip from your architecture so only the sovereign objective remains?" },
  { key: 1, roman: "I", name: "The Magician", letter: "Beth", signification: "House, Attention, Direct Will", astrology: "Mercury", gematria: 2, invariant: "Focused Intention & Single-Pointed Execution", aiChemistry: "Directed attention heads and tool-calling orchestration: binding local CLI tools, memory, and compute to a single unambiguous goal.", question: "How does your system focus attention on one verifiable contract at a time without scope drift?" },
  { key: 2, roman: "II", name: "The High Priestess", letter: "Gimel", signification: "Memory, Subconscious Storage, Continuity", astrology: "Moon", gematria: 3, invariant: "Cryptographic Memory & Zero-Leak Storage", aiChemistry: "Persistent vector memory, immutable event logs, and encrypted state stores that preserve context across sessions without data leakage.", question: "Where is state persisted in your system, and how do you guarantee zero unauthorized egress or corruption?" },
  { key: 3, roman: "III", name: "The Empress", letter: "Daleth", signification: "Door, Creative Imagination, Organic Growth", astrology: "Venus", gematria: 4, invariant: "Generative Architecture & Organic Scalability", aiChemistry: "Composable module synthesis where primitives combine naturally to produce rich user experiences without brittle coupling.", question: "Which core primitive in your design multiplies downstream capability while keeping complexity low?" },
  { key: 4, roman: "IV", name: "The Emperor", letter: "Heh", signification: "Window, Sight, Constitution, Governance", astrology: "Aries", gematria: 5, invariant: "Immutable Invariants & Structural Governance", aiChemistry: "Strict type schemas, runtime assertions, and constitutional guardrails that reject malformed inputs at the boundary.", question: "What non-negotiable structural invariants does your system enforce before executing any state mutation?" },
  { key: 5, roman: "V", name: "The Hierophant", letter: "Vav", signification: "Nail, Intuition, Unified Schema", astrology: "Taurus", gematria: 6, invariant: "Standardized Contracts & Semantic Schemas", aiChemistry: "Model Context Protocol (MCP) JSON-RPC schemas and canonical interfaces that allow heterogeneous agents to interoperate cleanly.", question: "How are your API and CLI contracts documented so both humans and autonomous agents can invoke them deterministically?" },
  { key: 6, roman: "VI", name: "The Lovers", letter: "Zain", signification: "Sword, Discrimination, Critical Choice", astrology: "Gemini", gematria: 7, invariant: "Binary Tradeoff Discipline & Clean Boundaries", aiChemistry: "Sharp architectural discrimination: explicitly stating non-goals, boundary conditions, and security separations.", question: "What explicit non-goals and boundary separations protect your architecture from feature creep?" },
  { key: 7, roman: "VII", name: "The Chariot", letter: "Cheth", signification: "Fence, Enclosure, Receptive Armor", astrology: "Cancer", gematria: 8, invariant: "Air-Gapped Isolation & Sandbox Enclosures", aiChemistry: "Loopback-bound execution (127.0.0.1), sandboxing, and zero-cloud dependency so the vehicle runs under sovereign control.", question: "How does your tool guarantee 100% functionality when completely disconnected from external cloud APIs?" },
  { key: 8, roman: "VIII", name: "Strength", letter: "Teth", signification: "Serpent, Subconscious Control, Resilience", astrology: "Leo", gematria: 9, invariant: "Graceful Error Handling & Self-Healing Loops", aiChemistry: "Bounded retry loops, circuit breakers, and deterministic fallback engines that tame chaotic runtime failures.", question: "When a subprocess, port, or model call fails, how does your system recover gracefully without crashing?" },
  { key: 9, roman: "IX", name: "The Hermit", letter: "Yod", signification: "Hand, Isolated Introspection, Lantern", astrology: "Virgo", gematria: 10, invariant: "Deterministic Verification & Zero-Dependency Audits", aiChemistry: "Self-contained verification suites and smoke tests that prove actual runtime behavior rather than trusting documentation.", question: "What single command proves end-to-end that your implementation works against live inputs?" },
  { key: 10, roman: "X", name: "Wheel of Fortune", letter: "Kaph", signification: "Grasping Hand, Cyclical Rhythm, State Loops", astrology: "Jupiter", gematria: 20, invariant: "State Loop Determinism & Replayability", aiChemistry: "Idempotent event loops, seeded randomness, and reproducible state transitions across ticks and epochs.", question: "If your system is restarted mid-operation, does it resume cleanly from deterministic state?" },
  { key: 11, roman: "XI", name: "Justice", letter: "Lamed", signification: "Ox-Goad, Equilibrium, Balanced Metrics", astrology: "Libra", gematria: 30, invariant: "Strict Verification Tests & Equilibrated Budgets", aiChemistry: "Quantitative latency, memory, and accuracy benchmarks that hold every component accountable to measurable SLAs.", question: "What concrete latency, memory, or recall budgets govern your acceptance criteria?" },
  { key: 12, roman: "XII", name: "The Hanged Man", letter: "Mem", signification: "Water, Inverted Perspective, Surrender", astrology: "Water", gematria: 40, invariant: "Asynchronous Non-Blocking Flow & Calm Pacing", aiChemistry: "Non-blocking event streams, reactive wakeup, and inverting control flow from busy polling to event-driven precision.", question: "Where can you replace polling or blocking bottlenecks with clean event-driven architecture?" },
  { key: 13, roman: "XIII", name: "Death", letter: "Nun", signification: "Fish, Transformation, Pruning Dead State", astrology: "Scorpio", gematria: 50, invariant: "Ruthless Cruft Pruning & Resource Cleanup", aiChemistry: "Eliminating dead code, zombie processes, stale caches, and legacy paywall clutter so the core engine runs lean.", question: "What dead state, redundant wrappers, or technical debt must be pruned from this module?" },
  { key: 14, roman: "XIV", name: "Temperance", letter: "Samekh", signification: "Tent-Peg, Verification, Harmonious Synthesis", astrology: "Sagittarius", gematria: 60, invariant: "Rate-Limiting & High-Concurrence Harmony", aiChemistry: "Hybrid fusion (combining dense vectors with lexical BM25 or local CLI with browser UI) in calibrated equilibrium.", question: "How do your CLI backend and browser frontend complement each other without state drift?" },
  { key: 15, roman: "XV", name: "The Devil", letter: "Ayin", signification: "Eye, Surface Illusion, Material Traps", astrology: "Capricorn", gematria: 70, invariant: "Anti-Deception Audit & Elimination of Mock State", aiChemistry: "Banishing fake setTimeout placeholders, mock strings, and deceptive labels so every metric reflects real computation.", question: "Have you verified that zero fake placeholders or misleading cipher/metric labels remain in the codebase?" },
  { key: 16, roman: "XVI", name: "The Tower", letter: "Peh", signification: "Mouth, Sudden Illumination, Lightning Break", astrology: "Mars", gematria: 80, invariant: "Chaos Resilience & Graceful Crash Recovery", aiChemistry: "Fault-injection testing and dismantling brittle assumptions before production traffic exposes them.", question: "What happens to your user's data if the process is killed abruptly during a write?" },
  { key: 17, roman: "XVII", name: "The Star", letter: "Tzaddi", signification: "Fish-Hook, Meditation, Clear Intuition", astrology: "Aquarius", gematria: 90, invariant: "Transparent Telemetry & Clear Logging", aiChemistry: "Structured observability, clear diagnostic endpoints (/health, /api/status), and human-readable explanations.", question: "Can an operator diagnose the health and active configuration of your service in under 5 seconds?" },
  { key: 18, roman: "XVIII", name: "The Moon", letter: "Qoph", signification: "Back of Head, Somatic Instinct, Cellular Memory", astrology: "Pisces", gematria: 100, invariant: "Deep Synaptic Retention & Subconscious Caches", aiChemistry: "Background indexing, lineage tracking, and subconscious pattern consolidation across long-running sessions.", question: "How does your application preserve user history and learned artifacts across upgrades?" },
  { key: 19, roman: "XIX", name: "The Sun", letter: "Resh", signification: "Head, Radiance, Regenerated Mastery", astrology: "Sun", gematria: 200, invariant: "Production-Grade Elegance & High-Fidelity UI", aiChemistry: "Luminous, accessible interface craft across mobile, tablet, and desktop viewports with zero visual clutter.", question: "Does the interface make complex power feel effortless, clear, and joyful to a first-time user?" },
  { key: 20, roman: "XX", name: "Judgement", letter: "Shin", signification: "Tooth, Transmutation, Final Realization", astrology: "Fire", gematria: 300, invariant: "Comprehensive Integration Sentinel & Release Gate", aiChemistry: "Pre-release acceptance gates that verify CLI, REST API, UI, and documentation parity in unison.", question: "Do your README, in-app documentation, CLI --help, and live UI all tell the exact same truth?" },
  { key: 21, roman: "XXI", name: "The World", letter: "Tav", signification: "Mark, Signature, Wholeness, Complete Cycle", astrology: "Saturn", gematria: 400, invariant: "Hermetic Sovereign Wholeness & Zero-Egress Proof", aiChemistry: "The sealed, self-contained sovereign artifact: 100% open-access, locally verifiable, and ready for autonomous deployment.", question: "Is the artifact complete, unlocked, documented, and verified across both ZothOS CLI and browser?" },
];

const HARDENED_SPEC_PRESET = `Project: Sovereign Zero-Egress Enclave
Goal & Objective: Architect a local-first, air-gapped sovereign service with deterministic state memory and persistent JSON store.
Invariants & Constraints: Enforce immutable invariants and standardized JSON schema type contracts at every API boundary.
Tradeoffs & Boundaries: Exclude external network dependencies; isolate execution in a local 127.0.0.1 sandbox.
Resilience & Verification: Implement graceful error catch recovery, deterministic verification test suite, and benchmarked latency metric budgets.
Hygiene & Release: Prune stale cache state, emit structured stdout telemetry logs, and gate CI release deployment on 100% offline sovereign pass.`;

const FLAWED_SPEC_PRESET = `Quick cloud-only prototype using placeholder mock_production responses and fake_data timers with no tests or boundaries.`;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCompleteCanonicalSection(tarotText: string, keyNumber: number): string {
  if (!tarotText.trim()) return "";
  const cardName = TAROT_CARD_NAMES[keyNumber];
  if (!cardName) return tarotText.trim();

  const currentPattern = new RegExp(
    `Name\\s*\\n+\\s*${escapeRegExp(cardName)}\\s*\\n+\\s*Key Number\\s*\\n+\\s*${keyNumber}\\b`,
    "i"
  );

  const start = tarotText.search(currentPattern);
  if (start < 0) return "";

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

function formatKeyLessonMarkdown(keyNum: number, gateOpenedFrom?: number): string {
  const meta = HERMETIC_CANONICAL_METADATA[keyNum] ?? HERMETIC_CANONICAL_METADATA[0];
  const prev = gateOpenedFrom !== undefined ? HERMETIC_CANONICAL_METADATA[gateOpenedFrom] : null;
  const headerPrefix = prev
    ? `### Gate ${prev.key} (${prev.name}) Sealed → Advancing to Key ${meta.key}: ${meta.name}\n\nYour reflection integrates the **${prev.invariant}** invariant (${prev.letter}). The gate now opens to **Key ${meta.key}: ${meta.name}**.\n\n`
    : `### Key ${meta.key}: ${meta.name} (${meta.letter})\n\n`;

  return `${headerPrefix}**The Attribution**: Key ${meta.key} (${meta.roman}) • Hebrew Letter **${meta.letter}** (Gematria: ${meta.gematria}) • Astrology: **${meta.astrology}** • Signification: *${meta.signification}*.\n\n**The Engineering Invariant**: \`${meta.invariant}\`\n\n**The AI Chemistry Lesson**: ${meta.aiChemistry}\n\n**The Alchemical Question**: *${meta.question}*`;
}

function validatePlanClient(planText: string) {
  const text = (planText || "").toLowerCase();
  const rules = [
    { key: 0, test: () => text.length > 50, label: "Intention & Purpose Defined (Aleph)", weight: 5 },
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
  const totalWeight = rules.reduce((s, r) => s + r.weight, 0);
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
  const score = Math.min(100, Math.round((scoreTotal / totalWeight) * 100));
  const passed = score >= 70;
  return {
    passed,
    score,
    grade: score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : "NEEDS_REVISION",
    summary: passed
      ? "Specification passes the Hermetic Quality Gate. Architecture is robust, testable, and bounded."
      : "Specification fails required hermetic invariants. Click 'Auto-Harden Failing Invariants' to remediate automatically.",
    checks,
    blockers: checks.filter((c) => !c.passed).map((c) => c.recommendation as string),
  };
}

function autoHardenPlanClient(planText: string, projectName = "Sovereign Zero-Egress Enclave"): string {
  let nextText = (planText || "").trim();
  nextText = nextText
    .replace(/cloud-only/gi, "local-first sovereign")
    .replace(/placeholder/gi, "deterministic-implementation")
    .replace(/mock_production/gi, "verified_production")
    .replace(/fake_data/gi, "canonical_fixtures");

  const remediationMap: Record<number, string> = {
    0: `Intention & Purpose (Key 0 · Aleph): Deliver a sovereign, zero-egress architecture for ${projectName} with unambiguous user value.`,
    1: `Goal & Scope (Key 1 · Beth): Define a single-pointed objective and strict execution scope with zero feature drift.`,
    2: `State & Memory Store (Key 2 · Gimel): Persist application state and memory cache in deterministic local storage with atomic writes.`,
    4: `Immutable Invariants (Key 4 · Heh): Enforce strict runtime invariants and constitutional constraints at every module boundary.`,
    5: `Standardized Schemas (Key 5 · Vav): Validate all inputs and outputs against canonical JSON schema type contracts.`,
    6: `Explicit Tradeoffs & Boundaries (Key 6 · Zain): Document explicit architectural tradeoffs and exclude non-essential surface area.`,
    7: `Air-Gapped Sandbox Isolation (Key 7 · Cheth): Isolate execution to local loopback (127.0.0.1) inside a zero-egress sandbox.`,
    8: `Graceful Error Resilience (Key 8 · Teth): Wrap all I/O and subprocess boundaries in bounded catch and error recovery loops.`,
    9: `Deterministic Verification Suite (Key 9 · Yod): Audit and verify runtime behavior via an automated end-to-end test suite.`,
    11: `Equilibrated Performance Budgets (Key 11 · Lamed): Benchmark latency and memory metrics against strict quantitative budgets.`,
    13: `Resource Pruning & Hygiene (Key 13 · Nun): Prune stale cache state, zombie processes, and dead code paths automatically.`,
    15: `Anti-Deception Guarantee (Key 15 · Ayin): Zero fake state—all transforms, metrics, and outputs execute real algorithms.`,
    17: `Transparent Telemetry & Diagnostics (Key 17 · Tzaddi): Emit structured stdout telemetry logs and health trace diagnostics.`,
    20: `Release & CI Integration Gate (Key 20 · Shin): Gate CI deployment and release delivery on 100% invariant verification.`,
    21: `Sovereign Wholeness & Offline Autonomy (Key 21 · Tav): Guarantee 100% offline, local-first sovereign operation without external cloud lock-in.`,
  };

  const currentAudit = validatePlanClient(nextText);
  const addedClauses: string[] = [];
  for (const check of currentAudit.checks) {
    if (!check.passed && remediationMap[check.keyNumber]) {
      addedClauses.push(remediationMap[check.keyNumber]);
    }
  }

  if (addedClauses.length > 0) {
    nextText = [
      nextText ? `${nextText}\n` : `# ${projectName} — Sovereign Specification\n`,
      `## Hermetic Invariant Hardening Clauses`,
      ...addedClauses.map((c) => `- ${c}`),
    ]
      .join("\n")
      .trim();
  }
  return nextText;
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

export default function App() {
  const [activeKeyNumber, setActiveKeyNumber] = useState<number>(0);
  const [stage, setStage] = useState<AppStage>("lesson");
  const [currentMessage, setCurrentMessage] = useState<string>(() => formatKeyLessonMarkdown(0));
  const [input, setInput] = useState("");
  const [providerError, setProviderError] = useState("");
  const [tarotReferenceText, setTarotReferenceText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showCanonicalText, setShowCanonicalText] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [projectName, setProjectName] = useState("Sovereign Zero-Egress Enclave");
  const [planInput, setPlanInput] = useState(HARDENED_SPEC_PRESET);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedPrd, setCopiedPrd] = useState(false);
  const [copiedSol, setCopiedSol] = useState(false);

  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({ ...DEFAULT_PROVIDER_SETTINGS });
  const [providerDraft, setProviderDraft] = useState<ProviderSettings>({ ...DEFAULT_PROVIDER_SETTINGS });
  const [sessionLog, setSessionLog] = useState<SessionMessage[]>([]);
  const [progress, setProgress] = useState<ProgressState>(getDefaultProgressState);

  const [consciousIntention, setConsciousIntention] = useState(
    "Refining the Pure Potentiality & Unbounded Ideation discipline (Aleph) across our sovereign local-first architecture."
  );
  const [symbolObservation, setSymbolObservation] = useState(
    "Observing the canonical BOTA symbolism of Key 0 (The Fool) under Air: Cultural Power, Life-Breath, Creative Energy."
  );
  const [subconsciousPrompt, setSubconsciousPrompt] = useState(
    "Synthesize a deterministic, zero-egress implementation that satisfies Pure Potentiality & Unbounded Ideation with verifiable tests."
  );
  const [insightSynthesis, setInsightSynthesis] = useState(
    "Subconscious incubation revealed a clean, zero-dependency design pattern that guarantees deterministic invariants across CLI and browser."
  );
  const [timeLeft, setTimeLeft] = useState(MEDITATION_TIME_SECONDS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTarotReference = async () => {
      try {
        const response = await fetch("/tarot/info.txt", { cache: "no-store" });
        if (!response.ok) return;
        const text = await response.text();
        setTarotReferenceText(text);
      } catch {
        setTarotReferenceText("");
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
        // ignore
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
        // ignore
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
    if (timerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    } else if (timerRunning && timeLeft === 0) {
      setTimerRunning(false);
      setStage("answering");
    }
    return () => clearInterval(timer);
  }, [timerRunning, timeLeft]);

  const activeMeta = HERMETIC_CANONICAL_METADATA[activeKeyNumber] ?? HERMETIC_CANONICAL_METADATA[0];
  const activeImageUrl = TAROT_IMAGE_PATHS[activeKeyNumber] ?? TAROT_IMAGE_PATHS[0];
  const cardsCompletedCount = Object.values(progress.cards).filter((c) => c.completed).length;
  const referenceExcerpt = useMemo(
    () => getCompleteCanonicalSection(tarotReferenceText, activeKeyNumber),
    [tarotReferenceText, activeKeyNumber]
  );
  const audit = useMemo(() => validatePlanClient(planInput), [planInput]);

  const populateSampleForKey = (keyNum: number) => {
    const k = HERMETIC_CANONICAL_METADATA[keyNum] ?? HERMETIC_CANONICAL_METADATA[0];
    setConsciousIntention(`Refining the ${k.invariant} discipline (${k.letter}) across our sovereign local-first architecture.`);
    setSymbolObservation(`Observing the canonical symbolism of Key ${k.key} (${k.name}) under ${k.astrology}: ${k.signification}.`);
    setSubconsciousPrompt(`Synthesize a deterministic, zero-egress implementation that satisfies ${k.invariant} with verifiable tests.`);
    setInput(`Through Key ${k.key} (${k.name}), we strip away brittle assumptions and enforce ${k.invariant} with explicit boundary contracts and automated verification.`);
    setInsightSynthesis(`Subconscious incubation revealed a clean, zero-dependency design pattern that guarantees ${k.invariant} across both CLI and browser.`);
  };

  const selectKey = (keyNum: number) => {
    const clamped = Math.max(0, Math.min(21, keyNum));
    setActiveKeyNumber(clamped);
    setCurrentMessage(formatKeyLessonMarkdown(clamped));
    setStage("lesson");
    setTimerRunning(false);
    setTimeLeft(MEDITATION_TIME_SECONDS);
    populateSampleForKey(clamped);
    setProgress((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [clamped]: {
          ...prev.cards[clamped],
          lessonsOpened: (prev.cards[clamped]?.lessonsOpened ?? 0) + 1,
        },
      },
    }));
  };

  const handleCompleteGateAndAdvance = () => {
    setIsSending(true);
    const priorKey = activeKeyNumber;
    const nextKey = (priorKey + 1) % 22;

    const userMsg: SessionMessage = {
      role: "user",
      content: `Key ${priorKey} Synthesis: ${insightSynthesis.trim()} | Answer: ${input.trim()}`,
      createdAt: new Date().toISOString(),
    };
    const nextLesson = formatKeyLessonMarkdown(nextKey, priorKey);
    const assistantMsg: SessionMessage = {
      role: "assistant",
      content: `[GATE OPENED]\n${nextLesson}`,
      createdAt: new Date().toISOString(),
    };

    setSessionLog((prev) => [...prev, userMsg, assistantMsg]);
    setProgress((prev) => {
      const nextCards = { ...prev.cards };
      nextCards[priorKey] = {
        ...nextCards[priorKey],
        insightSubmissions: nextCards[priorKey].insightSubmissions + 1,
        gatesOpened: nextCards[priorKey].gatesOpened + 1,
        completed: true,
      };
      nextCards[nextKey] = {
        ...nextCards[nextKey],
        lessonsOpened: nextCards[nextKey].lessonsOpened + 1,
      };
      const completedAll = priorKey === 21;
      return {
        cards: nextCards,
        totalCyclesCompleted: completedAll ? prev.totalCyclesCompleted + 1 : prev.totalCyclesCompleted,
        cycleCompletions: completedAll ? [...prev.cycleCompletions, new Date().toISOString()] : prev.cycleCompletions,
      };
    });

    setActiveKeyNumber(nextKey);
    setCurrentMessage(nextLesson);
    setStage("lesson");
    setTimerRunning(false);
    setTimeLeft(MEDITATION_TIME_SECONDS);
    populateSampleForKey(nextKey);
    setIsSending(false);
  };

  const handleDownloadSession = () => {
    const exportPayload = {
      protocol: "adytum.hermetic.workstation.v1",
      exportedAt: new Date().toISOString(),
      projectName,
      activeKey: activeMeta,
      hermeticGateAudit: audit,
      specification: planInput,
      progress,
      sessionLog,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-adytum-manifest.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdownPrd = () => {
    const md = [
      `# ⚡ Adytum 22-Key Hermetic Architectural PRD: ${projectName}`,
      ``,
      `- **Active Initiation Key**: Key ${activeMeta.key} — ${activeMeta.name} (${activeMeta.letter}, Gematria ${activeMeta.gematria})`,
      `- **Core Engineering Invariant**: \`${activeMeta.invariant}\``,
      `- **Hermetic Gatekeeper Verdict**: **${audit.score}/100 (${audit.grade})** — ${audit.passed ? "PASSED" : "NEEDS REVISION"}`,
      ``,
      `## 1. Architectural Specification`,
      planInput,
      ``,
      `## 2. 15-Rule Hermetic Gatekeeper Audit`,
      ...audit.checks.map((c) => `- [${c.passed ? "x" : " "}] **Key ${c.keyNumber} (${c.keyName})**: ${c.rule}`),
      ``,
      `## 3. Complete 22-Key Sovereign Checklist`,
      ...HERMETIC_CANONICAL_METADATA.map(
        (k) => `- [${progress.cards[k.key]?.completed ? "x" : " "}] **Key ${k.key} (${k.name} · ${k.letter})**: ${k.invariant}`
      ),
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-adytum-prd.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    setCopiedPrd(true);
    setTimeout(() => setCopiedPrd(false), 1800);
  };

  const handleResetAll = () => {
    setSessionLog([]);
    setProgress(getDefaultProgressState());
    window.localStorage.removeItem(SESSION_LOG_STORAGE_KEY);
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
    selectKey(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="oracle-shell min-h-[100dvh] text-zinc-100 flex flex-col selection:bg-amber-900/40 selection:text-amber-50">
      {/* Top Sovereign Command Bar */}
      <header className="sticky top-0 z-30 border-b border-amber-500/20 bg-zinc-950/90 backdrop-blur-md px-3 sm:px-6 py-3">
        <div className="max-w-[1480px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-amber-400/40 bg-amber-500/10 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-base sm:text-lg font-semibold tracking-wide text-amber-200">
                  ADYTUM ALCHEMIST WORKSTATION
                </span>
                <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-200">
                  v1.0 • 22-Key BOTA Rite
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                    audit.passed
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-red-500/40 bg-red-500/15 text-red-300"
                  }`}
                >
                  Gatekeeper: {audit.score}/100 ({audit.grade})
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Sovereign 22-Key Tarot Initiation, 5-Minute Subconscious Incubation &amp; Architectural Invariant Gatekeeper • ZothOS CLI (`adytum`)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-zinc-400 mr-1">
              Sealed Gates: <strong className="text-amber-300">{cardsCompletedCount}/22</strong>
            </span>
            <Button
              onClick={() => setShowAiSettings((prev) => !prev)}
              variant="ghost"
              className="h-8 px-3 text-xs border border-zinc-700/80 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 rounded-lg"
            >
              <Settings className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              {providerSettings.provider === "hermetic_local" ? "Oracle: Local Sovereign" : `Oracle: ${providerSettings.provider}`}
            </Button>
            <Button
              onClick={handleDownloadMarkdownPrd}
              variant="ghost"
              className="h-8 px-3 text-xs border border-emerald-500/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 rounded-lg"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              {copiedPrd ? "Downloaded .md" : "Export .md PRD"}
            </Button>
            <Button
              onClick={handleDownloadSession}
              variant="ghost"
              className="h-8 px-3 text-xs border border-amber-500/35 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 rounded-lg"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export .json
            </Button>
            <a
              href="https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-8 px-3 text-xs font-medium rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 transition"
            >
              ☕ Buy Us a Coffee
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText("GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK");
                setCopiedSol(true);
                setTimeout(() => setCopiedSol(false), 1800);
              }}
              className="inline-flex items-center h-8 px-2.5 text-xs font-mono rounded-lg border border-emerald-400/35 bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/20 transition"
              title="Copy Solana Tip Address: GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
            >
              {copiedSol ? "✔ Copied SOL" : "◎ Tip SOL"}
            </button>
            <Button
              onClick={handleResetAll}
              variant="ghost"
              className="h-8 px-2.5 text-xs border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 rounded-lg"
              title="Reset Session & Progress"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Collapsible AI Provider Console */}
        {showAiSettings && (
          <div className="max-w-[1480px] mx-auto mt-3 pt-3 border-t border-amber-500/20 bg-zinc-950/95 rounded-xl p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300">
                Oracle Inference Engine Configuration
              </span>
              <div className="flex flex-wrap gap-1.5">
                {([
                  ["hermetic_local", "Sovereign Local Oracle (Zero-Key Instant)"],
                  ["ollama_local", "Ollama Local (127.0.0.1:11434)"],
                  ["openai", "OpenAI API"],
                  ["ollama_cloud", "Ollama Cloud"],
                ] as Array<[ProviderId, string]>).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setProviderDraft((prev) => ({ ...prev, provider: id }))}
                    className={`rounded-lg px-2.5 py-1 text-xs border transition ${
                      providerDraft.provider === id
                        ? "border-amber-400 bg-amber-500/20 text-amber-100 font-medium"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {providerDraft.provider === "ollama_local" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={providerDraft.ollamaLocalBaseUrl}
                  onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaLocalBaseUrl: e.target.value }))}
                  placeholder="http://127.0.0.1:11434"
                  className="rounded-lg border border-amber-400/20 bg-zinc-900 px-3 py-1.5 text-xs"
                />
                <input
                  value={providerDraft.ollamaLocalModel}
                  onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaLocalModel: e.target.value }))}
                  placeholder="qwen2.5-coder:1.5b-instruct"
                  className="rounded-lg border border-amber-400/20 bg-zinc-900 px-3 py-1.5 text-xs"
                />
              </div>
            )}

            {providerDraft.provider === "openai" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="password"
                  value={providerDraft.openaiApiKey}
                  onChange={(e) => setProviderDraft((prev) => ({ ...prev, openaiApiKey: e.target.value }))}
                  placeholder="OpenAI API Key (sk-...)"
                  className="rounded-lg border border-amber-400/20 bg-zinc-900 px-3 py-1.5 text-xs"
                />
                <input
                  value={providerDraft.openaiModel}
                  onChange={(e) => setProviderDraft((prev) => ({ ...prev, openaiModel: e.target.value }))}
                  placeholder="gpt-4.1-mini"
                  className="rounded-lg border border-amber-400/20 bg-zinc-900 px-3 py-1.5 text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setProviderSettings({ ...providerDraft });
                  setProviderError("");
                  setShowAiSettings(false);
                }}
                className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg"
              >
                Save Provider
              </Button>
            </div>
            {providerError && <p className="text-xs text-red-300">{providerError}</p>}
          </div>
        )}
      </header>

      {/* Main 3-Column Sovereign Workspace */}
      <main className="flex-1 max-w-[1480px] w-full mx-auto p-3 sm:p-5 grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_410px] gap-4 items-start">
        {/* LEFT COLUMN: 22-Key Hermetic Arcana Rail */}
        <aside className="glass-panel rounded-2xl p-3 border border-amber-500/20 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-zinc-800/80">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-300">
              22 Hermetic Keys
            </span>
            <span className="text-[10px] font-mono text-zinc-400">0–21 BOTA</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-1.5 max-h-[240px] xl:max-h-[760px] overflow-y-auto pr-1">
            {HERMETIC_CANONICAL_METADATA.map((item) => {
              const isSelected = item.key === activeKeyNumber;
              const isDone = progress.cards[item.key]?.completed;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => selectKey(item.key)}
                  className={`w-full text-left rounded-xl px-2.5 py-2 border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? "border-amber-400/80 bg-amber-500/18 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.18)]"
                      : "border-zinc-800/90 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-amber-500/25 text-amber-300">
                        {String(item.key).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-medium truncate">{item.name}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-mono">
                      {item.letter} ({item.gematria}) • {item.astrology}
                    </p>
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">{item.roman}</span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER COLUMN: Active Key Tarot Card, AI Chemistry Lesson & 5-Min BOTA Incubation */}
        <section ref={scrollRef} className="glass-panel rounded-2xl p-4 sm:p-6 border border-amber-500/25 space-y-6">
          {/* Active Key Hero Card */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-5 items-start">
            <div className="mx-auto md:mx-0 w-[180px] sm:w-[200px] rounded-xl overflow-hidden border border-amber-400/40 bg-zinc-950 shadow-[0_16px_40px_rgba(0,0,0,0.65)]">
              <img
                src={activeImageUrl}
                alt={`Key ${activeMeta.key}: ${activeMeta.name} (${activeMeta.letter}) BOTA Tarot Card`}
                className="w-full h-auto block"
              />
              <div className="px-2.5 py-1.5 bg-zinc-950/95 border-t border-amber-500/20 text-center">
                <p className="text-[11px] font-mono text-amber-300 font-semibold">
                  KEY {activeMeta.key} • {activeMeta.name.toUpperCase()}
                </p>
                <p className="text-[10px] font-mono text-zinc-400">
                  {activeMeta.letter} (Gematria {activeMeta.gematria}) • {activeMeta.astrology}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-md bg-amber-500/15 border border-amber-400/35 px-2.5 py-0.5 text-xs font-mono text-amber-200">
                    Hebrew Letter: {activeMeta.letter} ({activeMeta.gematria})
                  </span>
                  <span className="rounded-md bg-sky-500/15 border border-sky-400/30 px-2.5 py-0.5 text-xs font-mono text-sky-200">
                    Astrology: {activeMeta.astrology}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => selectKey((activeKeyNumber + 21) % 22)}
                    variant="ghost"
                    className="h-7 px-2.5 text-xs border border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:text-white rounded-lg"
                  >
                    ← Prev Key
                  </Button>
                  <Button
                    onClick={() => selectKey((activeKeyNumber + 1) % 22)}
                    variant="ghost"
                    className="h-7 px-2.5 text-xs border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 rounded-lg"
                  >
                    Next Key →
                  </Button>
                </div>
              </div>

              <div className="prose prose-sm sm:prose-base prose-invert prose-amber max-w-none prose-headings:text-amber-300 prose-headings:font-heading prose-headings:mb-2 prose-p:text-zinc-200 prose-p:leading-relaxed prose-code:text-emerald-300 prose-code:bg-emerald-950/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                <ReactMarkdown>{currentMessage}</ReactMarkdown>
              </div>

              {/* Canonical BOTA Study Text Toggle */}
              {referenceExcerpt && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCanonicalText((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 hover:text-amber-200 underline underline-offset-4"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {showCanonicalText
                      ? `Hide Canonical BOTA Monograph (${activeMeta.name})`
                      : `Read Canonical BOTA Monograph for Key ${activeMeta.key}: ${activeMeta.name}`}
                  </button>
                  {showCanonicalText && (
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-amber-400/25 bg-zinc-950/90 p-3">
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300 font-sans">
                        {referenceExcerpt}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BOTA 3-Step Practice Protocol & 5-Minute Meditation Chronometer */}
          <div className="border-t border-zinc-800/80 pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-heading font-semibold text-amber-300 flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-amber-400" />
                  BOTA Practice Protocol &amp; 5-Minute Subconscious Incubation
                </h2>
                <p className="text-xs text-zinc-400">
                  1. Formulate Intention &amp; Symbol Observation → 2. Incubate for 5 Minutes → 3. Seal Gate &amp; Advance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => populateSampleForKey(activeKeyNumber)}
                className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/25 transition"
              >
                ⚡ Populate Archetypal Example
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  1. Conscious Intention
                </label>
                <Textarea
                  value={consciousIntention}
                  onChange={(e) => setConsciousIntention(e.target.value)}
                  className="min-h-[82px] bg-zinc-950/90 border-amber-400/25 text-xs text-zinc-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  2. Symbol Observation
                </label>
                <Textarea
                  value={symbolObservation}
                  onChange={(e) => setSymbolObservation(e.target.value)}
                  className="min-h-[82px] bg-zinc-950/90 border-amber-400/25 text-xs text-zinc-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  3. Subconscious Directive
                </label>
                <Textarea
                  value={subconsciousPrompt}
                  onChange={(e) => setSubconsciousPrompt(e.target.value)}
                  className="min-h-[82px] bg-zinc-950/90 border-amber-400/25 text-xs text-zinc-100"
                />
              </div>
            </div>

            {/* Interactive Meditation Chronometer Bar */}
            <div className="rounded-xl border border-amber-400/30 bg-zinc-950/85 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 tabular-nums tracking-tight">
                  {formatTime(timeLeft)}
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-200">
                    {timerRunning
                      ? "Subconscious Incubation Active — Observing Tarot Archetype..."
                      : timeLeft === 0
                      ? "Meditation Gate Complete — Ready to Seal Gate"
                      : "5-Minute Subconscious Incubation Timer"}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Hold the seed directive while gazing at Key {activeMeta.key} ({activeMeta.name}).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  onClick={() => {
                    if (!timerRunning) {
                      setProgress((prev) => ({
                        ...prev,
                        cards: {
                          ...prev.cards,
                          [activeKeyNumber]: {
                            ...prev.cards[activeKeyNumber],
                            meditationsStarted: prev.cards[activeKeyNumber].meditationsStarted + 1,
                          },
                        },
                      }));
                    }
                    setTimerRunning((r) => !r);
                  }}
                  className="h-8 px-3 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded-lg"
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5 mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
                  {timerRunning ? "Pause Timer" : "Start 5-Min Timer"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimeLeft(0);
                    setStage("answering");
                  }}
                  variant="ghost"
                  className="h-8 px-3 text-xs border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white rounded-lg"
                >
                  <FastForward className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                  Complete Timer Now
                </Button>
              </div>
            </div>

            {/* Post-Meditation Synthesis & Gate Sealing */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5" />
                    Alchemical Answer to Key {activeMeta.key}
                  </label>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Record your architectural answer to the Alchemical Question..."
                    className="min-h-[84px] bg-zinc-950/90 border-amber-400/25 text-xs text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Post-Meditation Architectural Synthesis
                  </label>
                  <Textarea
                    value={insightSynthesis}
                    onChange={(e) => setInsightSynthesis(e.target.value)}
                    placeholder="What concrete design pattern or invariant emerged from incubation?"
                    className="min-h-[84px] bg-zinc-950/90 border-amber-400/25 text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400">
                  Sealing Key {activeMeta.key} ({activeMeta.name}) marks this gate complete and advances to Key {(activeKeyNumber + 1) % 22}.
                </span>
                <Button
                  type="button"
                  onClick={handleCompleteGateAndAdvance}
                  disabled={isSending}
                  className="h-9 px-5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl shadow-[0_0_24px_rgba(245,158,11,0.3)]"
                >
                  Seal Gate {activeMeta.key} &amp; Advance to Key {(activeKeyNumber + 1) % 22}
                  <Send className="w-3.5 h-3.5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Live 22-Key Architectural Plan Gatekeeper & ZothOS CLI Deck */}
        <aside className="glass-panel rounded-2xl p-4 border border-amber-500/25 space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-sm font-heading font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                22-Key Architectural Plan Gatekeeper
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Live 15-rule Hermetic invariant audit for any PRD, spec, or agent workflow.
              </p>
            </div>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold border ${
                audit.passed
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-red-500/40 bg-red-500/15 text-red-300"
              }`}
            >
              {audit.score}/100 ({audit.grade})
            </span>
          </div>

          {/* Preset & Auto-Harden Toolbar */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPlanInput(HARDENED_SPEC_PRESET)}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-200 hover:bg-emerald-500/20"
            >
              Load Hardened (100/100)
            </button>
            <button
              type="button"
              onClick={() => setPlanInput(FLAWED_SPEC_PRESET)}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-mono text-red-200 hover:bg-red-500/20"
            >
              Load Flawed Spec
            </button>
            <button
              type="button"
              onClick={() => setPlanInput((prev) => autoHardenPlanClient(prev, projectName))}
              className="rounded-lg border border-amber-400/50 bg-amber-500/20 px-2.5 py-1 text-[11px] font-mono font-semibold text-amber-100 hover:bg-amber-500/30 flex items-center gap-1"
            >
              <Wand2 className="w-3 h-3" />
              Auto-Harden Invariants
            </button>
          </div>

          <div className="space-y-2">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
              aria-label="Project Name"
              className="w-full rounded-lg border border-amber-400/25 bg-zinc-950/90 px-3 py-1.5 text-xs font-mono text-zinc-100"
            />
            <Textarea
              value={planInput}
              onChange={(e) => setPlanInput(e.target.value)}
              aria-label="Architectural Specification"
              className="min-h-[125px] bg-zinc-950/90 border-amber-400/25 text-xs font-mono text-zinc-200 leading-relaxed"
            />
          </div>

          {/* Verdict Banner */}
          <div
            className={`rounded-xl border p-3 ${
              audit.passed
                ? "border-emerald-500/30 bg-emerald-950/20"
                : "border-red-500/35 bg-red-950/25"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-mono font-bold flex items-center gap-1.5 ${
                  audit.passed ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {audit.passed ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {audit.passed ? "PASSED HERMETIC GATE" : "FAILED HERMETIC GATE"}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {audit.checks.filter((c) => c.passed).length}/{audit.checks.length} Rules Verified
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-1">{audit.summary}</p>
          </div>

          {/* 15-Check Pass/Fail Matrix */}
          <div className="max-h-[240px] overflow-y-auto space-y-1.5 pr-1">
            {audit.checks.map((c) => (
              <div
                key={c.keyNumber}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-mono flex items-start justify-between gap-2 ${
                  c.passed
                    ? "border-emerald-500/20 bg-emerald-950/15 text-emerald-200"
                    : "border-red-500/30 bg-red-950/25 text-red-200"
                }`}
              >
                <div>
                  <span className="font-semibold">
                    {c.passed ? "✔" : "✖"} Key {c.keyNumber} ({c.keyName}):
                  </span>{" "}
                  <span>{c.rule}</span>
                </div>
                <span className="text-[10px] opacity-75 shrink-0">+{c.weight}</span>
              </div>
            ))}
          </div>

          {/* ZothOS CLI Quick Reference */}
          <div className="border-t border-zinc-800/80 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-emerald-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                ZothOS CLI (`/usr/local/bin/adytum`)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `adytum list && adytum key ${activeKeyNumber} && adytum invariants "${projectName}"`
                  );
                  setCopiedCli(true);
                  setTimeout(() => setCopiedCli(false), 1800);
                }}
                className="text-[10px] font-mono text-emerald-300 hover:text-emerald-200 flex items-center gap-1"
              >
                {copiedCli ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedCli ? "Copied" : "Copy CLI"}
              </button>
            </div>
            <pre className="rounded-xl border border-emerald-500/20 bg-zinc-950 p-2.5 text-[10px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`adytum list                      # All 22 Keys & invariants
adytum key ${String(activeKeyNumber).padEnd(2, " ")} --json             # Inspect Key ${activeKeyNumber} (${activeMeta.name})
adytum validate plan.md          # Audit PRD (exit 0 if >=70)
adytum harden plan.md            # Auto-harden spec to 100/100
adytum mcp                       # Start MCP stdio agent server`}
            </pre>
          </div>
        </aside>
      </main>

      {/* Sovereign Attribution & Open-Access Support Footer */}
      <footer className="border-t border-amber-500/15 bg-zinc-950/90 px-4 py-3 mt-auto">
        <div className="max-w-[1480px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Engineered by <strong className="text-zinc-200">Neal Frazier Tech (@1nc0gn30)</strong> • NullAI Platform</span>
            <span>•</span>
            <span className="text-emerald-300 font-mono text-[11px]">100% Free &amp; Open-Access Sovereign Tool</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/25 transition"
            >
              <Coffee className="w-3.5 h-3.5" />
              ☕ Buy Us a Coffee
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText("GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK");
                setCopiedSol(true);
                setTimeout(() => setCopiedSol(false), 1800);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/35 bg-purple-500/15 px-3 py-1 text-xs font-mono text-purple-200 hover:bg-purple-500/25 transition"
              title="Copy Solana Tip Address: GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
            >
              {copiedSol ? "✔ Copied Solana Address" : "◎ Solana Tip: GG2e...dXoK"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
