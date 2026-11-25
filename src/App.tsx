import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Sparkles,
  Moon,
  Sun,
  Hourglass,
  Lock,
  Unlock,
  Settings,
  Download,
  Trash2,
  Pause,
  Play,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  sanitizeProviderSettingsForExport,
  type ProviderId,
  type ProviderSettings,
} from "@/lib/exportSanitizer";
import adytumKeysData from "@/data/adytumKeys.json";

type AppStage = "welcome" | "loading" | "lesson" | "meditating" | "answering" | "reflection_needed";
type ChatRole = "user" | "assistant";

type SessionMessage = {
  role: ChatRole;
  content: string;
  createdAt: string;
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

type OfflineKeyLesson = {
  key: number;
  name: string;
  image: string;
  attribution: string;
  lesson: string;
  question: string;
};

const OFFLINE_KEY_LESSONS: Record<number, OfflineKeyLesson> = Object.fromEntries(
  (adytumKeysData as OfflineKeyLesson[]).map((item) => [item.key, item])
);

const MEDITATION_TIME_SECONDS = 300;
const PROVIDER_SETTINGS_STORAGE_KEY = "adytum_provider_settings";
const SESSION_LOG_STORAGE_KEY = "adytum_session_log";
const PROGRESS_STORAGE_KEY = "adytum_progress_state";

const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  provider: "ollama_local",
  openaiApiKey: "",
  openaiModel: "gpt-4.1-mini",
  ollamaCloudApiKey: "",
  ollamaCloudBaseUrl: "https://ollama.com",
  ollamaCloudModel: "llama3.1:8b",
  ollamaLocalBaseUrl: "http://127.0.0.1:11434",
  ollamaLocalModel: "llama3.1:8b",
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

type HermeticCorrespondence = {
  letter: string;
  gematria: number;
  gate: string;
  phase: string;
  directive: string;
};

const HERMETIC_CORRESPONDENCES: Record<number, HermeticCorrespondence> = {
  0: { letter: "Aleph (א)", gematria: 1, gate: "Air / Pneuma", phase: "Pure Potentiality & Unbounded Ideation", directive: "Strip all inherited assumptions; define the irreducible sovereign objective." },
  1: { letter: "Beth (ב)", gematria: 2, gate: "Mercury / Logos", phase: "Focused Intention & Single-Pointed Execution", directive: "Bind local CLI tools, MCP endpoints, and hardware compute to a single unambiguous goal." },
  2: { letter: "Gimel (ג)", gematria: 3, gate: "Moon / Memory", phase: "Cryptographic Memory & Zero-Leak Storage", directive: "Preserve state across sessions in deterministic local stores with zero unauthorized egress." },
  3: { letter: "Daleth (ד)", gematria: 4, gate: "Venus / Door", phase: "Generative Architecture & Organic Scalability", directive: "Compose clean primitives that multiply downstream capability without brittle coupling." },
  4: { letter: "Heh (ה)", gematria: 5, gate: "Aries / Sight", phase: "Immutable Invariants & Structural Governance", directive: "Enforce strict schemas and constitutional assertions at every system boundary." },
  5: { letter: "Vav (ו)", gematria: 6, gate: "Taurus / Nail", phase: "Standardized Contracts & Semantic Schemas", directive: "Expose canonical JSON-RPC / MCP and CLI contracts so humans and agents interoperate cleanly." },
  6: { letter: "Zain (ז)", gematria: 7, gate: "Gemini / Sword", phase: "Binary Tradeoff Discipline & Clean Boundaries", directive: "State explicit non-goals, security separations, and architectural tradeoffs." },
  7: { letter: "Cheth (ח)", gematria: 8, gate: "Cancer / Armor", phase: "Air-Gapped Isolation & Sandbox Enclosures", directive: "Lock the execution harness to loopback silicon (127.0.0.1) with 100% offline capability." },
  8: { letter: "Teth (ט)", gematria: 9, gate: "Leo / Serpent", phase: "Graceful Error Handling & Self-Healing Loops", directive: "Wrap subprocesses, ports, and model calls in bounded retry and deterministic fallback loops." },
  9: { letter: "Yod (י)", gematria: 10, gate: "Virgo / Lantern", phase: "Deterministic Verification & Zero-Dependency Audits", directive: "Prove runtime behavior with self-contained smoke tests rather than trusting documentation." },
  10: { letter: "Kaph (כ)", gematria: 20, gate: "Jupiter / Cycle", phase: "State Loop Determinism & Replayability", directive: "Ensure event loops and state transitions resume idempotently across restarts." },
  11: { letter: "Lamed (ל)", gematria: 30, gate: "Libra / Scales", phase: "Strict Verification Tests & Equilibrated Budgets", directive: "Enforce concrete latency, memory, and accuracy budgets with automated assertions." },
  12: { letter: "Mem (מ)", gematria: 40, gate: "Water / Reversal", phase: "Asynchronous Non-Blocking Flow & Calm Pacing", directive: "Replace busy polling and blocking bottlenecks with reactive event-driven wakeups." },
  13: { letter: "Nun (נ)", gematria: 50, gate: "Scorpio / Transformation", phase: "Ruthless Cruft Pruning & Resource Cleanup", directive: "Prune dead state, zombie processes, stale caches, and legacy paywall clutter." },
  14: { letter: "Samekh (ס)", gematria: 60, gate: "Sagittarius / Synthesis", phase: "Rate-Limiting & High-Concurrence Harmony", directive: "Harmonize CLI backend and browser UI in calibrated equilibrium without state drift." },
  15: { letter: "Ayin (ע)", gematria: 70, gate: "Capricorn / Eye", phase: "Anti-Deception Audit & Elimination of Mock State", directive: "Banish fake placeholders, mock responses, and misleading cipher labels." },
  16: { letter: "Peh (פ)", gematria: 80, gate: "Mars / Lightning", phase: "Chaos Resilience & Graceful Crash Recovery", directive: "Test fault injection and atomic writes so abrupt termination never corrupts user state." },
  17: { letter: "Tzaddi (צ)", gematria: 90, gate: "Aquarius / Star", phase: "Transparent Telemetry & Clear Logging", directive: "Provide structured diagnostics (/health, --json) so operators see live health in <5s." },
  18: { letter: "Qoph (ק)", gematria: 100, gate: "Pisces / Soma", phase: "Deep Synaptic Retention & Subconscious Caches", directive: "Preserve lineage history and user artifacts seamlessly across upgrades." },
  19: { letter: "Resh (ר)", gematria: 200, gate: "Sun / Radiance", phase: "Production-Grade Elegance & High-Fidelity UI", directive: "Deliver high-contrast, responsive UI across mobile, tablet, and desktop viewports." },
  20: { letter: "Shin (ש)", gematria: 300, gate: "Fire / Awakening", phase: "Comprehensive Integration Sentinel & Release Gate", directive: "Verify README, in-app docs, CLI --help, and live UI parity before release." },
  21: { letter: "Tav (ת)", gematria: 400, gate: "Saturn / Crown", phase: "Hermetic Sovereign Wholeness & Zero-Egress Proof", directive: "Seal the compiled artifact, emit deterministic manifest, and ship 100% open-access." },
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

  return `Role: You are the "Adytum Planner Guide," a master of the Builders of the Adytum (BOTA) Tarot system and AI Engineering Chemistry. Your mission is to lead the user through a sequential initiation from Key 0 (The Fool) to Key 21 (The World).

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
4. Tone: Dignified, lucid, intellectual. Address the user as "Aspirant" or "Architect."
5. Use the canonical card information source below as primary content grounding.
6. Prioritize practices that coordinate conscious intention with subconscious incubation and structured synthesis.
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

function isProviderConfigured(settings: ProviderSettings): boolean {
  if (settings.provider === "openai") return settings.openaiApiKey.trim().length > 0;
  if (settings.provider === "ollama_cloud") {
    return settings.ollamaCloudApiKey.trim().length > 0 && settings.ollamaCloudBaseUrl.trim().length > 0;
  }
  if (settings.provider === "ollama_local") {
    return settings.ollamaLocalBaseUrl.trim().length > 0;
  }
  return false;
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
}

export default function App() {
  const [stage, setStage] = useState<AppStage>("welcome");
  const [selectedPreviewKey, setSelectedPreviewKey] = useState<number>(0);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [input, setInput] = useState("");
  const [providerError, setProviderError] = useState("");
  const [tarotReferenceText, setTarotReferenceText] = useState("");
  const [isLoadingTarotReference, setIsLoadingTarotReference] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showCanonicalPreview, setShowCanonicalPreview] = useState(false);
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);
  const [isMeditationPaused, setIsMeditationPaused] = useState(false);
  const [localOllamaModels, setLocalOllamaModels] = useState<string[]>([]);
  const [ollamaProbeState, setOllamaProbeState] = useState<"idle" | "online" | "offline">("idle");
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

  // Probe local Ollama only when AI Settings opens (avoids unsolicited network error noise on load)
  useEffect(() => {
    if (!showAiSettings) return;
    const base = providerDraft.ollamaLocalBaseUrl.trim().replace(/\/+$/, "");
    if (!base) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 1800);
    fetch(`${base}/api/tags`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("offline"))))
      .then((data) => {
        const names: string[] = Array.isArray(data?.models)
          ? data.models.map((m: { name?: string }) => m?.name).filter((n: unknown): n is string => typeof n === "string")
          : [];
        setLocalOllamaModels(names);
        setOllamaProbeState("online");
        if (names.length > 0 && !names.includes(providerDraft.ollamaLocalModel)) {
          setProviderDraft((prev) => ({ ...prev, ollamaLocalModel: names[0] }));
        }
      })
      .catch(() => {
        setLocalOllamaModels([]);
        setOllamaProbeState("offline");
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [showAiSettings, providerDraft.ollamaLocalBaseUrl]);

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
    if (stage === "meditating" && !isMeditationPaused && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (stage === "meditating" && timeLeft === 0) {
      setIsMeditationPaused(false);
      setStage("answering");
    }
    return () => clearInterval(timer);
  }, [stage, isMeditationPaused, timeLeft]);

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
  const selectedCorrespondence = HERMETIC_CORRESPONDENCES[selectedPreviewKey] ?? HERMETIC_CORRESPONDENCES[0];
  const selectedOfflineLesson = OFFLINE_KEY_LESSONS[selectedPreviewKey] ?? OFFLINE_KEY_LESSONS[0];
  const previewExcerpt = getCompleteCanonicalSection(tarotReferenceText, selectedPreviewKey);

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

  const handleClearLogsConfirmed = () => {
    setSessionLog([]);
    setCurrentMessage("");
    setStage("welcome");
    setInput("");
    setConsciousIntention("");
    setSymbolObservation("");
    setSubconsciousPrompt("");
    setInsightSynthesis("");
    setTimeLeft(MEDITATION_TIME_SECONDS);
    setIsMeditationPaused(false);
    setConfirmClearLogs(false);
    window.localStorage.removeItem(SESSION_LOG_STORAGE_KEY);
    setProgress(getDefaultProgressState());
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  };

  const handleDownloadSession = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      version: "2.4.0",
      providerSettings: sanitizeProviderSettingsForExport(providerSettings),
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
      setProviderError("Configure your active provider before starting AI-guided initiation.");
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
      setCurrentMessage("Could not reach the configured AI provider. Verify local Ollama or API settings, or continue in Offline Workbench mode.");
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

  const openSelectedKeyOffline = () => {
    const keyName = TAROT_CARD_NAMES[selectedPreviewKey] ?? "The Fool";
    const imgPath = TAROT_IMAGE_PATHS[selectedPreviewKey] ?? "/tarot/fool.jpg";
    const localLesson = [
      `# Key ${selectedPreviewKey}: ${keyName}`,
      "",
      `![Key ${selectedPreviewKey}: ${keyName}](${imgPath})`,
      "",
      `### Hermetic & Architectural Correspondence`,
      `- **Hebrew Letter & Gematria:** ${selectedCorrespondence.letter} · ${selectedCorrespondence.gematria}`,
      `- **Planetary / Elemental Gate:** ${selectedCorrespondence.gate}`,
      `- **Engineering Phase:** ${selectedCorrespondence.phase}`,
      `- **Architectural Directive:** ${selectedCorrespondence.directive}`,
      "",
      selectedOfflineLesson
        ? `### Offline AI Chemistry Lesson\n${selectedOfflineLesson.lesson}\n\n**Socratic Reflection:** ${selectedOfflineLesson.question}`
        : "",
      "",
      `### Practice`,
      `Record your Conscious Intention, Symbol Observation, and Subconscious Directive below, then begin the 5-minute BOTA contemplation timer.`,
    ]
      .filter(Boolean)
      .join("\n");
    setCurrentMessage(localLesson);
    setStage("lesson");
    setTimeLeft(MEDITATION_TIME_SECONDS);
    setIsMeditationPaused(false);
    setProgress((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [selectedPreviewKey]: {
          ...prev.cards[selectedPreviewKey],
          lessonsOpened: (prev.cards[selectedPreviewKey]?.lessonsOpened ?? 0) + 1,
        },
      },
    }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="oracle-shell min-h-[100dvh] text-zinc-50 flex items-center justify-center p-2 sm:p-4 selection:bg-amber-900/40 selection:text-amber-50 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-36 top-24 size-72 rounded-full bg-amber-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-44 bottom-16 size-80 rounded-full bg-sky-700/12 blur-3xl" />

      <Card className="glass-panel w-full max-w-5xl xl:max-w-6xl min-h-[100dvh] sm:min-h-0 sm:h-[92dvh] flex flex-col rounded-none sm:rounded-[24px] border-0 overflow-hidden relative">
        <CardHeader className="border-b border-amber-600/20 pb-2.5 pt-3 sm:pb-3 sm:pt-4 bg-gradient-to-b from-zinc-950/65 to-zinc-950/20 z-10">
          <p className="mx-auto text-[11px] uppercase ritual-text text-amber-300/75 text-center">
            22-Key Hermetic AI Workbench · v2.4.0 · Local Loopback :8135
          </p>
          <CardTitle className="flex items-center justify-center gap-2.5 text-xl sm:text-[1.85rem] font-medium font-heading text-amber-300 tracking-wide">
            <Sparkles className="w-5 h-5 text-amber-400/85 shrink-0" />
            <span>Adytum Planner</span>
            <Sparkles className="w-5 h-5 text-amber-400/85 shrink-0" />
          </CardTitle>
          <div className="ornate-divider h-px w-32 mx-auto mt-1" />
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:gap-2">
            <Button
              onClick={() => {
                setShowAiSettings((prev) => !prev);
                setShowProgress(false);
                setConfirmClearLogs(false);
              }}
              variant="ghost"
              className="min-h-[44px] sm:min-h-[36px] h-auto px-3.5 py-2 sm:py-1.5 text-xs text-zinc-200 hover:text-zinc-50 border border-zinc-800/80 sm:border-transparent"
            >
              <Settings className="w-3.5 h-3.5 mr-1.5" /> AI Settings ({providerSettings.provider === "ollama_local" ? "Local Ollama" : providerSettings.provider})
            </Button>
            <Button
              onClick={() => {
                setShowProgress((prev) => !prev);
                setShowAiSettings(false);
                setConfirmClearLogs(false);
              }}
              variant="ghost"
              className="min-h-[44px] sm:min-h-[36px] h-auto px-3.5 py-2 sm:py-1.5 text-xs text-zinc-200 hover:text-zinc-50 border border-zinc-800/80 sm:border-transparent"
            >
              Progress ({cardsCompletedCount}/22)
            </Button>
            <Button
              onClick={handleDownloadSession}
              variant="ghost"
              className="min-h-[44px] sm:min-h-[36px] h-auto px-3.5 py-2 sm:py-1.5 text-xs text-zinc-200 hover:text-zinc-50 border border-zinc-800/80 sm:border-transparent"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Session JSON
            </Button>
            {!confirmClearLogs ? (
              <Button
                onClick={() => setConfirmClearLogs(true)}
                variant="ghost"
                className="min-h-[44px] sm:min-h-[36px] h-auto px-3.5 py-2 sm:py-1.5 text-xs text-zinc-300 hover:text-red-300 border border-zinc-800/80 sm:border-transparent"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear Logs
              </Button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/50 px-2 py-0.5">
                <Button
                  onClick={handleClearLogsConfirmed}
                  variant="ghost"
                  className="min-h-[44px] sm:min-h-[34px] h-auto px-3 py-1 text-xs text-red-200 hover:text-white hover:bg-red-700/60"
                >
                  Confirm Clear All
                </Button>
                <Button
                  onClick={() => setConfirmClearLogs(false)}
                  variant="ghost"
                  className="min-h-[44px] sm:min-h-[34px] h-auto px-3 py-1 text-xs text-zinc-300 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
          {showAiSettings && (
            <section className="border-b border-amber-500/20 bg-zinc-950/90 p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-amber-300 font-medium">Provider Console (Local-First Default)</h2>
                <span className="text-[11px] font-mono text-zinc-400">
                  {ollamaProbeState === "online"
                    ? `Local Ollama online (${localOllamaModels.length} models)`
                    : ollamaProbeState === "offline"
                      ? "Local Ollama offline — offline curriculum remains 100% active"
                      : "Checking local Ollama..."}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ["ollama_local", "Ollama Local (Default)"],
                  ["ollama_cloud", "Ollama Cloud"],
                  ["openai", "OpenAI"],
                ] as Array<[ProviderId, string]>).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setProviderDraft((prev) => ({ ...prev, provider: id }))}
                    className={`min-h-[44px] sm:min-h-[36px] rounded-full px-4 py-2 text-xs border transition ${
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
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">OpenAI API Key (Never Exported)</span>
                      <input type="password" value={providerDraft.openaiApiKey} onChange={(e) => setProviderDraft((prev) => ({ ...prev, openaiApiKey: e.target.value }))} className="w-full min-h-[44px] rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">OpenAI Model</span>
                      <input value={providerDraft.openaiModel} onChange={(e) => setProviderDraft((prev) => ({ ...prev, openaiModel: e.target.value }))} className="w-full min-h-[44px] rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                  </>
                )}

                {providerDraft.provider === "ollama_cloud" && (
                  <>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Cloud API Key (Never Exported)</span>
                      <input type="password" value={providerDraft.ollamaCloudApiKey} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaCloudApiKey: e.target.value }))} className="w-full min-h-[44px] rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Cloud Base URL</span>
                      <input value={providerDraft.ollamaCloudBaseUrl} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaCloudBaseUrl: e.target.value }))} className="w-full min-h-[44px] rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Cloud Model</span>
                      <input value={providerDraft.ollamaCloudModel} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaCloudModel: e.target.value }))} className="w-full min-h-[44px] rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                  </>
                )}

                {providerDraft.provider === "ollama_local" && (
                  <>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Local Base URL</span>
                      <input value={providerDraft.ollamaLocalBaseUrl} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaLocalBaseUrl: e.target.value }))} className="w-full min-h-[44px] rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.15em] text-zinc-400">Local Model</span>
                      <input value={providerDraft.ollamaLocalModel} onChange={(e) => setProviderDraft((prev) => ({ ...prev, ollamaLocalModel: e.target.value }))} className="w-full min-h-[44px] rounded-lg border border-amber-400/20 bg-zinc-950 px-3 py-2 text-sm" />
                    </label>
                    {localOllamaModels.length > 0 && (
                      <div className="sm:col-span-2 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] text-zinc-400 mr-1">Detected:</span>
                        {localOllamaModels.slice(0, 8).map((modelName) => (
                          <button
                            key={modelName}
                            type="button"
                            onClick={() => setProviderDraft((prev) => ({ ...prev, ollamaLocalModel: modelName }))}
                            className={`min-h-[36px] px-2.5 py-1 rounded-md text-xs font-mono border ${
                              providerDraft.ollamaLocalModel === modelName
                                ? "border-amber-400 bg-amber-500/20 text-amber-200"
                                : "border-zinc-700 bg-zinc-900 text-zinc-300"
                            }`}
                          >
                            {modelName}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleProviderSave} className="min-h-[44px] h-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2 rounded-full">Apply Provider</Button>
                <Button onClick={handleClearProviderSecrets} variant="ghost" className="min-h-[44px] h-auto px-4 py-2 text-zinc-300 hover:text-zinc-100">Clear Stored Keys</Button>
              </div>
              {providerError && <p className="text-red-300 text-sm">{providerError}</p>}
            </section>
          )}

          {showProgress && (
            <section className="border-b border-amber-500/20 bg-zinc-950/90 p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[60vh]">
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
            </section>
          )}

          {stage === "welcome" && (
            <section className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-3 sm:gap-5 items-start">
              <div className="rounded-xl border border-amber-400/20 bg-zinc-950/75 p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 px-1">
                  <h2 className="text-[11px] uppercase tracking-[0.14em] text-amber-300 font-medium whitespace-nowrap">
                    22 Major Arcana Deck
                  </h2>
                  <span className="text-[11px] text-zinc-400 whitespace-nowrap font-mono">
                    {cardsCompletedCount}/22 Done
                  </span>
                </div>
                <div className="flex flex-nowrap overflow-x-auto gap-1.5 pb-1.5 lg:grid lg:grid-cols-1 lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[560px] lg:pb-0 lg:pr-1">
                  {Object.entries(TAROT_CARD_NAMES).map(([k, name]) => {
                    const keyNum = Number(k);
                    const isSelected = selectedPreviewKey === keyNum;
                    const done = progress.cards[keyNum]?.completed;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSelectedPreviewKey(keyNum)}
                        className={`shrink-0 whitespace-nowrap min-h-[44px] lg:min-h-[38px] lg:shrink lg:w-full text-left px-3 py-2 lg:py-1.5 rounded-lg border text-xs transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? "border-amber-400/70 bg-amber-500/15 text-amber-200"
                            : "border-zinc-800/80 bg-zinc-900/50 text-zinc-300 hover:border-amber-400/35"
                        }`}
                      >
                        <span className="lg:truncate">
                          <span className="text-amber-400/85 mr-1.5 font-mono">{k}.</span>
                          {name}
                        </span>
                        {done && <span className="text-[10px] text-emerald-300 shrink-0">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-zinc-950/75 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start">
                  <img
                    src={TAROT_IMAGE_PATHS[selectedPreviewKey] ?? "/tarot/fool.jpg"}
                    alt={`Key ${selectedPreviewKey}: ${TAROT_CARD_NAMES[selectedPreviewKey] ?? "Tarot Key"}`}
                    className="w-36 sm:w-44 aspect-[2/3] rounded-xl border border-amber-400/35 shadow-[0_14px_32px_rgba(0,0,0,0.5)] object-cover shrink-0"
                  />
                  <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-300">
                      <Sun className="w-3.5 h-3.5" />
                      Key {selectedPreviewKey} of 21
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-heading text-zinc-50 tracking-wide">
                      {TAROT_CARD_NAMES[selectedPreviewKey] ?? "The Fool"}
                    </h1>
                    <p className="text-zinc-300/90 leading-relaxed text-sm">
                      {selectedOfflineLesson?.lesson ||
                        "Active Hermetic & AI Chemistry Workbench. Study this Key offline with the BOTA 5-minute contemplation protocol or connect local Ollama."}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 pt-1">
                      <Button
                        onClick={openSelectedKeyOffline}
                        className="min-h-[44px] h-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 text-sm rounded-full font-medium"
                      >
                        Open Key in Workbench
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!providerReady) {
                            setShowAiSettings(true);
                          } else {
                            void handleSend(`Start Key ${selectedPreviewKey}: ${TAROT_CARD_NAMES[selectedPreviewKey]}`);
                          }
                        }}
                        disabled={isLoadingTarotReference || isSending}
                        className="min-h-[44px] h-auto border-amber-400/35 bg-zinc-900/70 hover:bg-zinc-800 text-amber-200 px-5 py-2.5 text-sm rounded-full"
                      >
                        {isLoadingTarotReference || isSending
                          ? "Preparing Guide..."
                          : providerReady
                            ? "Run Local AI Guide"
                            : "Configure AI Provider"}
                      </Button>
                    </div>
                    {providerError && <p className="text-red-300 text-sm">{providerError}</p>}
                  </div>
                </div>

                {/* Hermetic & Architectural Correspondence Matrix */}
                <div className="rounded-lg border border-amber-400/20 bg-zinc-900/55 p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-amber-300 font-medium">
                      Hermetic &amp; Architectural Correspondence
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Key {selectedPreviewKey} · {selectedCorrespondence.gate}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md border border-zinc-800 bg-zinc-950/70 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400">Hebrew Letter</p>
                      <p className="text-amber-200 font-medium mt-0.5">{selectedCorrespondence.letter}</p>
                    </div>
                    <div className="rounded-md border border-zinc-800 bg-zinc-950/70 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400">Gematria</p>
                      <p className="text-amber-200 font-mono font-medium mt-0.5">{selectedCorrespondence.gematria}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 rounded-md border border-zinc-800 bg-zinc-950/70 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400">Gate</p>
                      <p className="text-zinc-200 font-medium mt-0.5">{selectedCorrespondence.gate}</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs space-y-1">
                    <p className="text-amber-200/95 font-medium">{selectedCorrespondence.phase}</p>
                    <p className="text-zinc-300/90 leading-relaxed">{selectedCorrespondence.directive}</p>
                  </div>
                </div>

                {/* Collapsible Canonical BOTA Study Excerpt Preview */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-300 font-medium inline-flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                      Canonical BOTA Study Excerpt
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCanonicalPreview((prev) => !prev)}
                      className="min-h-[44px] sm:min-h-[34px] h-auto px-3 py-1.5 text-xs text-amber-300 hover:text-amber-200"
                    >
                      {showCanonicalPreview ? "Hide Excerpt" : "Read Canonical Text"}
                    </Button>
                  </div>
                  {showCanonicalPreview && (
                    <div className="max-h-56 overflow-y-auto rounded-md border border-amber-400/20 bg-zinc-950/75 p-3">
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300/90 font-sans">
                        {previewExcerpt || "Loading canonical BOTA text (/tarot/info.txt)..."}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {stage === "loading" && (
            <section className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-in fade-in duration-500">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-amber-400 rounded-full border-t-transparent animate-spin" />
                <Moon className="absolute inset-0 m-auto w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <p className="text-amber-300/80 animate-pulse tracking-[0.25em] uppercase text-xs sm:text-sm">Consulting Local Guide...</p>
            </section>
          )}

          {(stage === "lesson" || stage === "answering" || stage === "reflection_needed") && (
            <section ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-7 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/70">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStage("welcome")}
                  className="min-h-[44px] h-auto px-3.5 py-2 text-xs text-amber-300 hover:text-amber-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  All 22 Keys (Deck)
                </Button>
                <span className="text-[11px] font-mono text-zinc-400">
                  {currentCardLabel} · {cardsCompletedCount}/22 Complete
                </span>
              </div>
              {stage === "reflection_needed" && (
                <div className="bg-red-950/30 border border-red-800/55 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-red-300 font-medium mb-1">The Gate Remains Closed</h2>
                    <p className="text-red-200/75 text-sm">Your insight requires deeper synthesis or provider configuration. Review the feedback below and continue.</p>
                  </div>
                </div>
              )}

              <article className="markdown-body prose prose-sm sm:prose-base prose-invert prose-amber max-w-none prose-img:rounded-xl prose-img:border prose-img:border-amber-400/30 prose-img:shadow-[0_20px_45px_rgba(0,0,0,0.45)] prose-img:max-w-[260px] sm:prose-img:max-w-[300px] prose-img:mx-auto prose-img:my-6 prose-headings:text-amber-300 prose-headings:font-heading prose-headings:tracking-wide prose-strong:text-amber-200 prose-p:leading-relaxed prose-p:text-zinc-300/95 prose-li:text-zinc-300/90">
                <ReactMarkdown
                  components={{
                    img: ({ node, ...props }) => {
                      const safeSrc = normalizeTarotImageSrc(props.src, props.alt);
                      return <img {...props} alt={props.alt || currentCardLabel} src={safeSrc ?? props.src} referrerPolicy="no-referrer" />;
                    },
                  }}
                >
                  {currentMessage}
                </ReactMarkdown>
              </article>

              {stage === "lesson" && (
                <div className="pt-6 pb-4 border-t border-zinc-800/60 mt-6 space-y-5">
                  <h3 className="text-amber-300 font-medium tracking-wide">BOTA Practice Protocol</h3>
                  <p className="text-zinc-400 text-sm">Prepare consciousness before meditation, then plant a precise subconscious directive.</p>

                  <div className="space-y-2">
                    <label htmlFor="bota-intention" className="block text-xs uppercase tracking-[0.18em] text-zinc-300">
                      1. Conscious Intention
                    </label>
                    <Textarea
                      id="bota-intention"
                      value={consciousIntention}
                      onChange={(e) => setConsciousIntention(e.target.value)}
                      placeholder="What faculty or architectural pattern are you refining through this key? (min 20 chars)"
                      className="min-h-[90px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bota-symbol" className="block text-xs uppercase tracking-[0.18em] text-zinc-300">
                      2. Symbol Observation
                    </label>
                    <Textarea
                      id="bota-symbol"
                      value={symbolObservation}
                      onChange={(e) => setSymbolObservation(e.target.value)}
                      placeholder="Name exact symbols and their functional meaning in your own words. (min 20 chars)"
                      className="min-h-[90px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bota-directive" className="block text-xs uppercase tracking-[0.18em] text-zinc-300">
                      3. Subconscious Directive
                    </label>
                    <Textarea
                      id="bota-directive"
                      value={subconsciousPrompt}
                      onChange={(e) => setSubconsciousPrompt(e.target.value)}
                      placeholder="Write one clear seed-thought to hold through the five-minute meditation. (min 20 chars)"
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
                        setTimeLeft(MEDITATION_TIME_SECONDS);
                        setIsMeditationPaused(false);
                        setStage("meditating");
                      }}
                      disabled={!canBeginMeditation}
                      className="min-h-[48px] h-auto bg-zinc-900 hover:bg-zinc-800 text-amber-200 border border-amber-400/35 px-8 py-3.5 text-base rounded-full shadow-[0_0_18px_rgba(245,158,11,0.14)] transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.24)] flex gap-3 items-center disabled:opacity-45"
                    >
                      <Hourglass className="w-5 h-5" />
                      Begin 5-Minute Meditation
                    </Button>
                  </div>
                  {!canBeginMeditation && <p className="text-zinc-400 text-xs text-center">Complete all three fields (20+ characters each) before entering meditation.</p>}
                </div>
              )}

              {(stage === "answering" || stage === "reflection_needed") && (
                <div className="pt-6 border-t border-zinc-800/60 mt-6 space-y-4 animate-in fade-in duration-500">
                  <h3 className="text-amber-300 font-medium flex items-center gap-2 tracking-wide">
                    <Unlock className="w-4 h-4" />
                    Provide Your Insight
                  </h3>
                  <div className="space-y-2">
                    <label htmlFor="insight-answer" className="block text-xs uppercase tracking-[0.16em] text-zinc-300">
                      Alchemical Reflection (40+ chars)
                    </label>
                    <Textarea
                      id="insight-answer"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Record your reflections here..."
                      className="min-h-[140px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="insight-synthesis" className="block text-xs uppercase tracking-[0.16em] text-zinc-300">
                      Post-Meditation Synthesis (20+ chars)
                    </label>
                    <Textarea
                      id="insight-synthesis"
                      value={insightSynthesis}
                      onChange={(e) => setInsightSynthesis(e.target.value)}
                      placeholder="What idea, pattern, or solution emerged from subconscious incubation?"
                      className="min-h-[90px] bg-zinc-950/85 border-amber-400/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-400/60 focus-visible:border-amber-300/60 text-base resize-y"
                    />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentKeyNumber !== null) {
                          setProgress((prev) => ({
                            ...prev,
                            cards: {
                              ...prev.cards,
                              [currentKeyNumber]: {
                                ...prev.cards[currentKeyNumber],
                                completed: true,
                                gatesOpened: prev.cards[currentKeyNumber].gatesOpened + 1,
                              },
                            },
                          }));
                        }
                        setStage("welcome");
                      }}
                      disabled={!canSubmitInsight}
                      className="min-h-[44px] h-auto border-emerald-400/40 text-emerald-200 hover:bg-emerald-950/50 px-5 py-2.5 rounded-full"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Save Offline &amp; Complete Key
                    </Button>
                    <Button
                      onClick={handleSubmitInsight}
                      disabled={!canSubmitInsight || isSending}
                      className="min-h-[44px] h-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-2.5 rounded-full border border-amber-100/20 disabled:bg-amber-600/50 disabled:text-zinc-300"
                    >
                      Submit to AI Guide
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  {!canSubmitInsight && <p className="text-zinc-400 text-xs">Complete both reflection (40+ chars) and synthesis (20+ chars) to record your insight.</p>}
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
            <section className="flex-1 flex flex-col items-center justify-center p-4 sm:p-5 bg-zinc-950/85 relative overflow-y-auto animate-in zoom-in-95 duration-500">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />
              <div className="z-10 flex flex-col items-center space-y-4 w-full max-w-md my-auto">
                <div className="text-center space-y-1.5">
                  <h2 className="text-amber-300 text-lg sm:text-xl font-heading tracking-[0.2em] uppercase">
                    {isMeditationPaused ? "Meditation Paused" : "Sacred Meditation"}
                  </h2>
                  <p className="text-zinc-300/85 text-xs sm:text-sm">Hold your subconscious directive while observing the image without forcing thought.</p>
                </div>

                {imageUrl && (
                  <div className="relative w-36 sm:w-40 rounded-xl overflow-hidden border border-amber-400/35 shadow-[0_0_32px_rgba(245,158,11,0.2)]">
                    <img src={imageUrl} alt={`${currentCardLabel} Tarot Card`} className="w-full h-auto" referrerPolicy="no-referrer" />
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/12 blur-3xl rounded-full animate-pulse" />
                  <div className="relative text-5xl sm:text-6xl font-light text-amber-300 tracking-tighter tabular-nums drop-shadow-[0_0_16px_rgba(245,158,11,0.42)]">
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400/75 transition-all duration-1000 ease-linear" style={{ width: `${progressPercent}%` }} />
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMeditationPaused((p) => !p)}
                    className="min-h-[44px] px-4 py-2 rounded-full border-amber-400/40 bg-zinc-900 text-amber-200 hover:bg-zinc-800 text-xs"
                  >
                    {isMeditationPaused ? <Play className="w-3.5 h-3.5 mr-1.5" /> : <Pause className="w-3.5 h-3.5 mr-1.5" />}
                    {isMeditationPaused ? "Resume Timer" : "Pause Timer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsMeditationPaused(false);
                      setStage("answering");
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-full border-emerald-400/40 bg-zinc-900 text-emerald-200 hover:bg-zinc-800 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Complete Early
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsMeditationPaused(false);
                      setTimeLeft(MEDITATION_TIME_SECONDS);
                      setStage("lesson");
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-full text-zinc-300 hover:text-zinc-100 text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Key
                  </Button>
                </div>
              </div>
            </section>
          )}
        </CardContent>

        <footer className="border-t border-amber-500/20 bg-zinc-950/90 px-3 py-1.5 text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 z-10">
          <span className="text-zinc-300 inline-flex flex-wrap items-center gap-x-1">
            <span>100% Free &amp; Open-Access · Engineered by</span>
            <a
              href="https://github.com/1nc0gn30"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] sm:min-h-[28px] text-amber-300 hover:underline px-0.5"
            >
              Neal Frazier Tech (@1nc0gn30)
            </a>
            <span>•</span>
            <a
              href="https://nullai.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] sm:min-h-[28px] text-amber-300 hover:underline px-0.5"
            >
              NullAI Platform
            </a>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://github.com/1nc0gn30/adytum-alchemist-ai-workflow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] sm:min-h-[28px] px-2 text-zinc-300 hover:text-amber-200 underline-offset-2 hover:underline"
            >
              GitHub
            </a>
            <a
              href="https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-[44px] sm:min-h-[30px] rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-amber-200 hover:bg-amber-500/20"
            >
              ☕ Buy Us a Coffee
            </a>
            <span className="font-mono text-[10px] text-zinc-400 break-all" title="Solana Tip Address">
              SOL: GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK
            </span>
          </div>
        </footer>
      </Card>
    </main>
  );
}
