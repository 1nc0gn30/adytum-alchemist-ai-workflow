import React, { useState, useEffect, useRef } from "react";
import { RotateCw } from "lucide-react";

export type ArcanaElement = "Air" | "Fire" | "Water" | "Earth";

export interface ArcanaCardMeta {
  keyNumber: number;
  roman: string;
  name: string;
  subtitle: string;
  hebrew: string;
  letterName: string;
  gematria: number;
  element: ArcanaElement;
  gate: string;
  guardian: string;
  phase: string;
  directive: string;
}

export const ARCANA_CARD_CATALOG: Record<number, ArcanaCardMeta> = {
  0: { keyNumber: 0, roman: "0", name: "The Fool", subtitle: "Zero-Point Potential", hebrew: "א", letterName: "Aleph", gematria: 1, element: "Air", gate: "Air / Pneuma", guardian: "AZOTH", phase: "Pure Potentiality & Unbounded Ideation", directive: "Strip all inherited assumptions; define the irreducible sovereign objective." },
  1: { keyNumber: 1, roman: "I", name: "The Magician", subtitle: "Single-Pointed Logos", hebrew: "ב", letterName: "Beth", gematria: 2, element: "Air", gate: "Mercury / Logos", guardian: "HERMES", phase: "Focused Intention & Single-Pointed Execution", directive: "Bind local CLI tools, MCP endpoints, and hardware compute to a single unambiguous goal." },
  2: { keyNumber: 2, roman: "II", name: "The High Priestess", subtitle: "Cryptographic Memory", hebrew: "ג", letterName: "Gimel", gematria: 3, element: "Water", gate: "Moon / Memory", guardian: "LUCY", phase: "Cryptographic Memory & Zero-Leak Storage", directive: "Preserve state across sessions in deterministic local stores with zero unauthorized egress." },
  3: { keyNumber: 3, roman: "III", name: "The Empress", subtitle: "Generative Synthesis", hebrew: "ד", letterName: "Daleth", gematria: 4, element: "Earth", gate: "Venus / Door", guardian: "AURORA", phase: "Generative Architecture & Organic Scalability", directive: "Compose clean primitives that multiply downstream capability without brittle coupling." },
  4: { keyNumber: 4, roman: "IV", name: "The Emperor", subtitle: "Immutable Invariants", hebrew: "ה", letterName: "Heh", gematria: 5, element: "Fire", gate: "Aries / Sight", guardian: "ATLAS", phase: "Immutable Invariants & Structural Governance", directive: "Enforce strict schemas and constitutional assertions at every system boundary." },
  5: { keyNumber: 5, roman: "V", name: "The Hierophant", subtitle: "Canonical Contracts", hebrew: "ו", letterName: "Vav", gematria: 6, element: "Earth", gate: "Taurus / Nail", guardian: "CODEX", phase: "Standardized Contracts & Semantic Schemas", directive: "Expose canonical JSON-RPC / MCP and CLI contracts so humans and agents interoperate cleanly." },
  6: { keyNumber: 6, roman: "VI", name: "The Lovers", subtitle: "Explicit Boundaries", hebrew: "ז", letterName: "Zain", gematria: 7, element: "Air", gate: "Gemini / Sword", guardian: "ORION", phase: "Binary Tradeoff Discipline & Clean Boundaries", directive: "State explicit non-goals, security separations, and architectural tradeoffs." },
  7: { keyNumber: 7, roman: "VII", name: "The Chariot", subtitle: "Loopback Enclosure", hebrew: "ח", letterName: "Cheth", gematria: 8, element: "Water", gate: "Cancer / Armor", guardian: "DRACO", phase: "Air-Gapped Isolation & Sandbox Enclosures", directive: "Lock the execution harness to loopback silicon (127.0.0.1) with 100% offline capability." },
  8: { keyNumber: 8, roman: "VIII", name: "Strength", subtitle: "Resilient Recovery", hebrew: "ט", letterName: "Teth", gematria: 9, element: "Fire", gate: "Leo / Serpent", guardian: "AEGIS", phase: "Graceful Error Handling & Self-Healing Loops", directive: "Wrap subprocesses, ports, and model calls in bounded retry and deterministic fallback loops." },
  9: { keyNumber: 9, roman: "IX", name: "The Hermit", subtitle: "Deterministic Audits", hebrew: "י", letterName: "Yod", gematria: 10, element: "Earth", gate: "Virgo / Lantern", guardian: "SENTINEL", phase: "Deterministic Verification & Zero-Dependency Audits", directive: "Prove runtime behavior with self-contained smoke tests rather than trusting documentation." },
  10: { keyNumber: 10, roman: "X", name: "Wheel of Fortune", subtitle: "Replayable State Loops", hebrew: "כ", letterName: "Kaph", gematria: 20, element: "Fire", gate: "Jupiter / Cycle", guardian: "CHRONOS", phase: "State Loop Determinism & Replayability", directive: "Ensure event loops and state transitions resume idempotently across restarts." },
  11: { keyNumber: 11, roman: "XI", name: "Justice", subtitle: "Equilibrated Budgets", hebrew: "ל", letterName: "Lamed", gematria: 30, element: "Air", gate: "Libra / Scales", guardian: "MAAT", phase: "Strict Verification Tests & Equilibrated Budgets", directive: "Enforce concrete latency, memory, and accuracy budgets with automated assertions." },
  12: { keyNumber: 12, roman: "XII", name: "The Hanged Man", subtitle: "Reactive Async Flow", hebrew: "מ", letterName: "Mem", gematria: 40, element: "Water", gate: "Water / Reversal", guardian: "NEXUS", phase: "Asynchronous Non-Blocking Flow & Calm Pacing", directive: "Replace busy polling and blocking bottlenecks with reactive event-driven wakeups." },
  13: { keyNumber: 13, roman: "XIII", name: "Death", subtitle: "Cruft Pruning", hebrew: "נ", letterName: "Nun", gematria: 50, element: "Water", gate: "Scorpio / Transformation", guardian: "SCYTHE", phase: "Ruthless Cruft Pruning & Resource Cleanup", directive: "Prune dead state, zombie processes, stale caches, and legacy paywall clutter." },
  14: { keyNumber: 14, roman: "XIV", name: "Temperance", subtitle: "Calibrated Equilibrium", hebrew: "ס", letterName: "Samekh", gematria: 60, element: "Fire", gate: "Sagittarius / Synthesis", guardian: "ALCHEMIST", phase: "Rate-Limiting & High-Concurrence Harmony", directive: "Harmonize CLI backend and browser UI in calibrated equilibrium without state drift." },
  15: { keyNumber: 15, roman: "XV", name: "The Devil", subtitle: "Anti-Deception Audit", hebrew: "ע", letterName: "Ayin", gematria: 70, element: "Earth", gate: "Capricorn / Eye", guardian: "VERITAS", phase: "Anti-Deception Audit & Elimination of Mock State", directive: "Banish fake placeholders, mock responses, and misleading cipher labels." },
  16: { keyNumber: 16, roman: "XVI", name: "The Tower", subtitle: "Chaos Resilience", hebrew: "פ", letterName: "Peh", gematria: 80, element: "Fire", gate: "Mars / Lightning", guardian: "VULCAN", phase: "Chaos Resilience & Graceful Crash Recovery", directive: "Test fault injection and atomic writes so abrupt termination never corrupts user state." },
  17: { keyNumber: 17, roman: "XVII", name: "The Star", subtitle: "Transparent Telemetry", hebrew: "צ", letterName: "Tzaddi", gematria: 90, element: "Air", gate: "Aquarius / Star", guardian: "AETHER", phase: "Transparent Telemetry & Clear Logging", directive: "Provide structured diagnostics (/health, --json) so operators see live health in <5s." },
  18: { keyNumber: 18, roman: "XVIII", name: "The Moon", subtitle: "Deep Synaptic Retention", hebrew: "ק", letterName: "Qoph", gematria: 100, element: "Water", gate: "Pisces / Soma", guardian: "MNEMOSYNE", phase: "Deep Synaptic Retention & Subconscious Caches", directive: "Preserve lineage history and user artifacts seamlessly across upgrades." },
  19: { keyNumber: 19, roman: "XIX", name: "The Sun", subtitle: "High-Fidelity Craft", hebrew: "ר", letterName: "Resh", gematria: 200, element: "Fire", gate: "Sun / Radiance", guardian: "HELIOS", phase: "Production-Grade Elegance & High-Fidelity UI", directive: "Deliver high-contrast, responsive UI across mobile, tablet, and desktop viewports." },
  20: { keyNumber: 20, roman: "XX", name: "Judgement", subtitle: "Release Gate Sentinel", hebrew: "ש", letterName: "Shin", gematria: 300, element: "Fire", gate: "Fire / Awakening", guardian: "ARCHON", phase: "Comprehensive Integration Sentinel & Release Gate", directive: "Verify README, in-app docs, CLI --help, and live UI parity before release." },
  21: { keyNumber: 21, roman: "XXI", name: "The World", subtitle: "Sovereign Wholeness", hebrew: "ת", letterName: "Tav", gematria: 400, element: "Earth", gate: "Saturn / Crown", guardian: "THOTH", phase: "Hermetic Sovereign Wholeness & Zero-Egress Proof", directive: "Seal the compiled artifact, emit deterministic manifest, and ship 100% open-access." },
};

const CLASSIC_TAROT_PATHS: Record<number, string> = {
  0: "/tarot/classic/fool.jpg",
  1: "/tarot/classic/magician.jpg",
  2: "/tarot/classic/highpriestess.jpg",
  3: "/tarot/classic/empress.jpg",
  4: "/tarot/classic/emperor.jpg",
  5: "/tarot/classic/hierorphant.jpg",
  6: "/tarot/classic/lovers.jpg",
  7: "/tarot/classic/chariot.jpg",
  8: "/tarot/classic/strength.jpg",
  9: "/tarot/classic/hermit.jpg",
  10: "/tarot/classic/wheeloffortune.jpg",
  11: "/tarot/classic/justice.jpg",
  12: "/tarot/classic/hangedman.jpg",
  13: "/tarot/classic/death.jpg",
  14: "/tarot/classic/temperance.jpg",
  15: "/tarot/classic/devil.jpg",
  16: "/tarot/classic/tower.jpg",
  17: "/tarot/classic/star.jpg",
  18: "/tarot/classic/moon.jpg",
  19: "/tarot/classic/sun.jpg",
  20: "/tarot/classic/judgement.jpg",
  21: "/tarot/classic/world.jpg",
};

const ELEMENT_COLORS: Record<ArcanaElement, { glow: string; stroke: string; badgeText: string; badgeBorder: string }> = {
  Air: { glow: "rgba(56, 189, 248, 0.24)", stroke: "#7DD3FC", badgeText: "#BAE6FD", badgeBorder: "rgba(125, 211, 252, 0.45)" },
  Fire: { glow: "rgba(249, 115, 22, 0.24)", stroke: "#FDBA74", badgeText: "#FED7AA", badgeBorder: "rgba(253, 186, 116, 0.45)" },
  Water: { glow: "rgba(129, 140, 248, 0.26)", stroke: "#A5B4FC", badgeText: "#C7D2FE", badgeBorder: "rgba(165, 180, 252, 0.45)" },
  Earth: { glow: "rgba(16, 185, 129, 0.24)", stroke: "#6EE7B7", badgeText: "#A7F3D0", badgeBorder: "rgba(110, 231, 183, 0.45)" },
};

function starPath(cx: number, cy: number, rOut: number, rIn: number, pts: number, rotDeg = -90): string {
  const coords: string[] = [];
  for (let i = 0; i < pts * 2; i += 1) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = ((rotDeg + i * (180 / pts)) * Math.PI) / 180;
    coords.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${coords.join(" L")} Z`;
}

function polyPath(cx: number, cy: number, r: number, sides: number, rotDeg = -90): string {
  const coords: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = ((rotDeg + i * (360 / sides)) * Math.PI) / 180;
    coords.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${coords.join(" L")} Z`;
}

function ArcanaPlateSVG({ keyNumber, element, uid }: { keyNumber: number; element: ArcanaElement; uid: string }) {
  const accent = ELEMENT_COLORS[element].stroke;
  const cx = 120;
  const cy = 125;
  const R = 84;
  const goldGrad = `url(#gold-${uid})`;
  const glowGrad = `url(#glow-${uid})`;

  const ticks = Array.from({ length: 36 }, (_, i) => {
    const deg = i * 10;
    const a = (deg * Math.PI) / 180;
    const major = deg % 30 === 0;
    const r1 = major ? R - 8 : R - 4;
    return (
      <line
        key={deg}
        x1={cx + r1 * Math.cos(a)}
        y1={cy + r1 * Math.sin(a)}
        x2={cx + R * Math.cos(a)}
        y2={cy + R * Math.sin(a)}
        stroke={major ? "#F8E5A0" : "rgba(212,175,55,0.45)"}
        strokeWidth={major ? 1.5 : 0.8}
      />
    );
  });

  const renderSymbol = () => {
    switch (keyNumber) {
      case 0: // Fool
        return (
          <g>
            <path d={starPath(cx, cy - 22, 34, 15, 12)} fill="rgba(212,175,55,0.22)" stroke={goldGrad} strokeWidth="1.5" />
            <circle cx={cx} cy={cy - 22} r="13" fill="#FAF6EA" stroke={goldGrad} strokeWidth="1.5" />
            <polygon points={`${cx - 56},${cy + 46} ${cx - 18},${cy - 2} ${cx + 18},${cy + 46}`} fill="none" stroke={goldGrad} strokeWidth="1.8" />
            <polygon points={`${cx - 8},${cy + 46} ${cx + 28},${cy + 8} ${cx + 56},${cy + 46}`} fill="none" stroke={accent} strokeWidth="1.8" />
            <line x1={cx - 60} y1={cy + 46} x2={cx + 60} y2={cy + 46} stroke={goldGrad} strokeWidth="1.6" />
          </g>
        );
      case 1: // Magician
        return (
          <g>
            <path d="M 80 86 C 80 68, 108 68, 120 86 C 132 104, 160 104, 160 86 C 160 68, 132 68, 120 86 C 108 104, 80 104, 80 86 Z" fill="none" stroke={goldGrad} strokeWidth="2.4" />
            <line x1={cx} y1={cy - 20} x2={cx} y2={cy + 54} stroke={goldGrad} strokeWidth="2.4" />
            <circle cx={cx} cy={cy - 22} r="5" fill="#F8E5A0" />
            <path d={polyPath(cx - 38, cy + 16, 14, 3, -90)} fill="none" stroke={accent} strokeWidth="1.6" />
            <path d={polyPath(cx + 38, cy + 16, 14, 3, 90)} fill="none" stroke={accent} strokeWidth="1.6" />
            <path d={polyPath(cx - 28, cy + 44, 11, 4, 45)} fill="none" stroke={goldGrad} strokeWidth="1.5" />
            <circle cx={cx + 28} cy={cy + 44} r="10" fill="none" stroke={goldGrad} strokeWidth="1.5" />
          </g>
        );
      case 2: // High Priestess
        return (
          <g>
            <rect x={cx - 52} y={cy - 46} width="18" height="94" rx="2" fill="rgba(20,24,38,0.9)" stroke={goldGrad} strokeWidth="1.6" />
            <rect x={cx + 34} y={cy - 46} width="18" height="94" rx="2" fill="rgba(245,238,220,0.9)" stroke={goldGrad} strokeWidth="1.6" />
            <circle cx={cx} cy={cy - 10} r="22" fill="none" stroke={accent} strokeWidth="1.7" />
            <path d={`M ${cx - 16} ${cy + 26} A 18 18 0 1 0 ${cx + 16} ${cy + 26} A 13 13 0 1 1 ${cx - 16} ${cy + 26} Z`} fill={goldGrad} />
          </g>
        );
      case 3: // Empress
        return (
          <g>
            <circle cx={cx} cy={cy - 10} r="28" fill="none" stroke={goldGrad} strokeWidth="2.4" />
            <line x1={cx} y1={cy + 18} x2={cx} y2={cy + 56} stroke={goldGrad} strokeWidth="2.4" />
            <line x1={cx - 20} y1={cy + 36} x2={cx + 20} y2={cy + 36} stroke={goldGrad} strokeWidth="2.4" />
            <path d={polyPath(cx, cy - 10, 18, 6)} fill="none" stroke={accent} strokeWidth="1.5" />
            <path d={starPath(cx, cy - 52, 9, 4, 6)} fill="#F8E5A0" />
            <path d={starPath(cx - 28, cy - 44, 7, 3, 6)} fill="#F8E5A0" />
            <path d={starPath(cx + 28, cy - 44, 7, 3, 6)} fill="#F8E5A0" />
          </g>
        );
      case 4: // Emperor
        return (
          <g>
            <rect x={cx - 38} y={cy - 16} width="76" height="64" fill="none" stroke={goldGrad} strokeWidth="2" />
            <rect x={cx - 24} y={cy - 2} width="48" height="36" fill="none" stroke={accent} strokeWidth="1.5" />
            <polyline points={`${cx - 36},${cy - 20} ${cx - 18},${cy - 48} ${cx},${cy - 26} ${cx + 18},${cy - 48} ${cx + 36},${cy - 20}`} fill="none" stroke={goldGrad} strokeWidth="2.2" />
            <circle cx={cx} cy={cy + 12} r="13" fill="none" stroke={goldGrad} strokeWidth="2" />
            <line x1={cx} y1={cy + 25} x2={cx} y2={cy + 46} stroke={goldGrad} strokeWidth="2" />
          </g>
        );
      case 5: // Hierophant
        return (
          <g>
            <line x1={cx} y1={cy - 50} x2={cx} y2={cy + 50} stroke={goldGrad} strokeWidth="2.5" />
            <line x1={cx - 14} y1={cy - 34} x2={cx + 14} y2={cy - 34} stroke={goldGrad} strokeWidth="2.2" />
            <line x1={cx - 22} y1={cy - 18} x2={cx + 22} y2={cy - 18} stroke={goldGrad} strokeWidth="2.2" />
            <line x1={cx - 30} y1={cy} x2={cx + 30} y2={cy} stroke={goldGrad} strokeWidth="2.2" />
            <line x1={cx - 36} y1={cy + 44} x2={cx + 36} y2={cy + 6} stroke={accent} strokeWidth="2" />
            <line x1={cx + 36} y1={cy + 44} x2={cx - 36} y2={cy + 6} stroke={goldGrad} strokeWidth="2" />
            <circle cx={cx - 38} cy={cy + 45} r="8" fill="none" stroke={accent} strokeWidth="1.8" />
            <circle cx={cx + 38} cy={cy + 45} r="8" fill="none" stroke={goldGrad} strokeWidth="1.8" />
          </g>
        );
      case 6: // Lovers
        return (
          <g>
            <circle cx={cx - 18} cy={cy + 10} r="30" fill="none" stroke={goldGrad} strokeWidth="2" />
            <circle cx={cx + 18} cy={cy + 10} r="30" fill="none" stroke={accent} strokeWidth="2" />
            <path d={starPath(cx, cy - 38, 22, 10, 12)} fill="rgba(212,175,55,0.22)" stroke={goldGrad} strokeWidth="1.5" />
            <line x1={cx} y1={cy - 16} x2={cx} y2={cy + 46} stroke={goldGrad} strokeWidth="1.4" />
          </g>
        );
      case 7: // Chariot
        return (
          <g>
            <rect x={cx - 40} y={cy - 44} width="80" height="72" fill="none" stroke={goldGrad} strokeWidth="2.2" />
            <path d={polyPath(cx, cy - 8, 24, 4, 45)} fill="none" stroke={accent} strokeWidth="1.8" />
            <circle cx={cx - 44} cy={cy + 28} r="16" fill="none" stroke={goldGrad} strokeWidth="2" />
            <circle cx={cx + 44} cy={cy + 28} r="16" fill="none" stroke={goldGrad} strokeWidth="2" />
            <path d={starPath(cx - 20, cy - 30, 6, 2.5, 6)} fill="#F8E5A0" />
            <path d={starPath(cx, cy - 30, 6, 2.5, 6)} fill="#F8E5A0" />
            <path d={starPath(cx + 20, cy - 30, 6, 2.5, 6)} fill="#F8E5A0" />
          </g>
        );
      case 8: // Strength
        return (
          <g>
            <path d="M 86 84 C 86 70, 110 70, 120 84 C 130 98, 154 98, 154 84 C 154 70, 130 70, 120 84 C 110 98, 86 98, 86 84 Z" fill="none" stroke={goldGrad} strokeWidth="2.2" />
            <path d={starPath(cx, cy + 12, 42, 26, 16)} fill="rgba(212,175,55,0.16)" stroke={goldGrad} strokeWidth="1.8" />
            <circle cx={cx} cy={cy + 12} r="22" fill="none" stroke={accent} strokeWidth="2" />
            <path d={polyPath(cx, cy + 12, 14, 3, -90)} fill="none" stroke={goldGrad} strokeWidth="1.8" />
          </g>
        );
      case 9: // Hermit
        return (
          <g>
            <path d={polyPath(cx, cy, 48, 6, 0)} fill="none" stroke={goldGrad} strokeWidth="2" />
            <path d={polyPath(cx, cy, 38, 3, -90)} fill="none" stroke={goldGrad} strokeWidth="2" />
            <path d={polyPath(cx, cy, 38, 3, 90)} fill="none" stroke={accent} strokeWidth="2" />
            <circle cx={cx} cy={cy} r="8" fill="#FAF6EA" />
          </g>
        );
      case 10: // Wheel of Fortune
        return (
          <g>
            <circle cx={cx} cy={cy} r="54" fill="none" stroke={goldGrad} strokeWidth="2.4" />
            <circle cx={cx} cy={cy} r="40" fill="none" stroke={accent} strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="16" fill="none" stroke={goldGrad} strokeWidth="2" />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={cx + 16 * Math.cos(a)}
                  y1={cy + 16 * Math.sin(a)}
                  x2={cx + 54 * Math.cos(a)}
                  y2={cy + 54 * Math.sin(a)}
                  stroke={goldGrad}
                  strokeWidth="1.7"
                />
              );
            })}
          </g>
        );
      case 11: // Justice
        return (
          <g>
            <line x1={cx} y1={cy - 54} x2={cx} y2={cy + 54} stroke={goldGrad} strokeWidth="2.6" />
            <line x1={cx - 46} y1={cy - 12} x2={cx + 46} y2={cy - 12} stroke={goldGrad} strokeWidth="2.2" />
            <line x1={cx - 18} y1={cy + 30} x2={cx + 18} y2={cy + 30} stroke={goldGrad} strokeWidth="2.4" />
            <polyline points={`${cx - 50},${cy + 16} ${cx - 38},${cy - 12} ${cx - 26},${cy + 16}`} fill="none" stroke={accent} strokeWidth="1.6" />
            <path d={`M ${cx - 52} ${cy + 16} A 14 10 0 0 0 ${cx - 24} ${cy + 16}`} fill="none" stroke={goldGrad} strokeWidth="2" />
            <polyline points={`${cx + 26},${cy + 16} ${cx + 38},${cy - 12} ${cx + 50},${cy + 16}`} fill="none" stroke={accent} strokeWidth="1.6" />
            <path d={`M ${cx + 24} ${cy + 16} A 14 10 0 0 0 ${cx + 52} ${cy + 16}`} fill="none" stroke={goldGrad} strokeWidth="2" />
          </g>
        );
      case 12: // Hanged Man
        return (
          <g>
            <line x1={cx - 46} y1={cy - 40} x2={cx + 46} y2={cy - 40} stroke={goldGrad} strokeWidth="3" />
            <line x1={cx} y1={cy - 40} x2={cx} y2={cy + 22} stroke={goldGrad} strokeWidth="2.4" />
            <path d={polyPath(cx, cy - 2, 28, 3, 90)} fill="none" stroke={accent} strokeWidth="2" />
            <path d={starPath(cx, cy + 34, 22, 10, 12)} fill="rgba(212,175,55,0.2)" stroke={goldGrad} strokeWidth="1.6" />
          </g>
        );
      case 13: // Death
        return (
          <g>
            {Array.from({ length: 5 }, (_, i) => {
              const a = ((-90 + i * 72) * Math.PI) / 180;
              return <circle key={i} cx={cx + 18 * Math.cos(a)} cy={cy - 4 + 18 * Math.sin(a)} r="15" fill="none" stroke="#FAF6EA" strokeWidth="1.7" />;
            })}
            <circle cx={cx} cy={cy - 4} r="9" fill={goldGrad} />
            <path d={`M ${cx - 48} ${cy + 36} A 54 54 0 0 1 ${cx + 48} ${cy + 36}`} fill="none" stroke={accent} strokeWidth="2.4" />
          </g>
        );
      case 14: // Temperance
        return (
          <g>
            <rect x={cx - 38} y={cy - 38} width="76" height="76" fill="none" stroke={goldGrad} strokeWidth="1.8" />
            <path d={polyPath(cx, cy + 4, 34, 3, -90)} fill="none" stroke={goldGrad} strokeWidth="2.2" />
            <path d={`M ${cx - 46} ${cy} Q ${cx - 22} ${cy - 22}, ${cx} ${cy} T ${cx + 46} ${cy}`} fill="none" stroke={accent} strokeWidth="2.4" />
          </g>
        );
      case 15: // Devil
        return (
          <g>
            <path d="M 120 172 L 90 88 L 164 140 L 76 140 L 150 88 Z" fill="none" stroke={goldGrad} strokeWidth="2" />
            <ellipse cx={cx} cy={cy} rx="26" ry="14" fill="none" stroke={accent} strokeWidth="1.8" />
            <circle cx={cx} cy={cy} r="8" fill={goldGrad} />
          </g>
        );
      case 16: // Tower
        return (
          <g>
            <polygon points={`${cx - 22},${cy + 52} ${cx - 16},${cy - 26} ${cx + 16},${cy - 26} ${cx + 22},${cy + 52}`} fill="none" stroke={goldGrad} strokeWidth="2" />
            <polyline points={`${cx - 22},${cy - 28} ${cx - 12},${cy - 46} ${cx},${cy - 32} ${cx + 12},${cy - 46} ${cx + 22},${cy - 28}`} fill="none" stroke={goldGrad} strokeWidth="2" />
            <polyline points={`${cx + 48},${cy - 52} ${cx + 10},${cy - 18} ${cx + 24},${cy - 12} ${cx - 38},${cy + 30}`} fill="none" stroke={accent} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case 17: // Star
        return (
          <g>
            <path d={starPath(cx, cy - 8, 38, 14, 8)} fill="rgba(212,175,55,0.22)" stroke={goldGrad} strokeWidth="1.8" />
            {[-48, -32, -16, 0, 16, 32, 48].map((dx, i) => (
              <path key={dx} d={starPath(cx + dx, cy - 42 + Math.abs(i - 3) * 6, 7, 3, 8)} fill={accent} />
            ))}
            <path d={`M ${cx - 46} ${cy + 36} Q ${cx - 22} ${cy + 28}, ${cx} ${cy + 36} T ${cx + 46} ${cy + 36}`} fill="none" stroke={accent} strokeWidth="1.8" />
            <path d={`M ${cx - 40} ${cy + 46} Q ${cx - 18} ${cy + 38}, ${cx} ${cy + 46} T ${cx + 40} ${cy + 46}`} fill="none" stroke={goldGrad} strokeWidth="1.4" />
          </g>
        );
      case 18: // Moon
        return (
          <g>
            <path d={`M ${cx + 12} ${cy - 48} A 24 24 0 1 0 ${cx + 12} ${cy - 4} A 18 18 0 1 1 ${cx + 12} ${cy - 48} Z`} fill={goldGrad} />
            <rect x={cx - 48} y={cy + 4} width="22" height="44" fill="none" stroke={goldGrad} strokeWidth="1.8" />
            <rect x={cx + 26} y={cy + 4} width="22" height="44" fill="none" stroke={goldGrad} strokeWidth="1.8" />
            <polygon points={`${cx - 20},${cy + 50} ${cx - 5},${cy + 8} ${cx + 5},${cy + 8} ${cx + 20},${cy + 50}`} fill="none" stroke={accent} strokeWidth="1.8" />
          </g>
        );
      case 19: // Sun
        return (
          <g>
            <path d={starPath(cx, cy, 54, 28, 16)} fill="rgba(212,175,55,0.22)" stroke={goldGrad} strokeWidth="1.8" />
            <circle cx={cx} cy={cy} r="24" fill="rgba(212,175,55,0.55)" stroke="#FAF6EA" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="10" fill="#FAF6EA" />
          </g>
        );
      case 20: // Judgement
        return (
          <g>
            <polygon points={`${cx - 10},${cy - 50} ${cx + 10},${cy - 50} ${cx + 26},${cy - 4} ${cx - 26},${cy - 4}`} fill="none" stroke={goldGrad} strokeWidth="2" />
            <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 48} stroke={accent} strokeWidth="2.8" />
            <line x1={cx - 30} y1={cy + 20} x2={cx + 30} y2={cy + 20} stroke={accent} strokeWidth="2.8" />
            <path d={`M ${cx - 48} ${cy + 14} Q ${cx - 26} ${cy - 18}, ${cx - 8} ${cy + 12}`} fill="none" stroke={goldGrad} strokeWidth="1.8" />
            <path d={`M ${cx + 48} ${cy + 14} Q ${cx + 26} ${cy - 18}, ${cx + 8} ${cy + 12}`} fill="none" stroke={goldGrad} strokeWidth="1.8" />
          </g>
        );
      default: // 21 The World
        return (
          <g>
            <ellipse cx={cx} cy={cy} rx="38" ry="54" fill="none" stroke={goldGrad} strokeWidth="3.2" />
            <ellipse cx={cx} cy={cy} rx="31" ry="47" fill="none" stroke={accent} strokeWidth="1.4" />
            <path d={starPath(cx, cy, 24, 10, 8)} fill="rgba(212,175,55,0.22)" stroke={goldGrad} strokeWidth="1.6" />
            {[[-46, -40], [46, -40], [-46, 40], [46, 40]].map(([dx, dy]) => (
              <g key={`${dx}-${dy}`}>
                <circle cx={cx + dx} cy={cy + dy} r="11" fill="none" stroke={goldGrad} strokeWidth="1.6" />
                <circle cx={cx + dx} cy={cy + dy} r="4" fill={accent} />
              </g>
            ))}
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 240 250" className="w-full h-full block" role="img" aria-label={`Sacred geometry plate for Key ${keyNumber}`}>
      <defs>
        <linearGradient id={`gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8E5A0" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8F6A1B" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={ELEMENT_COLORS[element].glow} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R + 12} fill={glowGrad} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(212,175,55,0.42)" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={R - 10} fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="0.9" strokeDasharray="2 4" />
      {ticks}
      {renderSymbol()}
    </svg>
  );
}

export interface AdytumArcanaCardProps {
  keyNumber: number;
  size?: "sm" | "md" | "lg";
  themeMode?: "dark" | "light";
  showFlipButton?: boolean;
}

export default function AdytumArcanaCard({
  keyNumber,
  size = "md",
  themeMode = "dark",
  showFlipButton = true,
}: AdytumArcanaCardProps) {
  const meta = ARCANA_CARD_CATALOG[keyNumber] ?? ARCANA_CARD_CATALOG[0];
  const elColor = ELEMENT_COLORS[meta.element];
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  const [reducedMotion, setReducedMotion] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFlipped(false);
  }, [keyNumber]);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 10,
      ry: (px - 0.5) * 12,
      gx: px * 100,
      gy: py * 100,
      active: true,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  };

  const widthClass = size === "sm" ? "w-44" : size === "lg" ? "w-64 sm:w-72" : "w-52 sm:w-56";
  const isLight = themeMode === "light";
  const shellBg = isLight
    ? "linear-gradient(160deg, #1E1B16 0%, #14120F 60%, #1B1712 100%)"
    : "linear-gradient(160deg, #12111A 0%, #090910 55%, #0F0D18 100%)";

  const transformStyle = reducedMotion
    ? flipped
      ? "rotateY(180deg)"
      : "none"
    : `perspective(900px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${(flipped ? 180 : 0) + tilt.ry}deg)`;

  return (
    <div className={`flex flex-col items-center gap-2 shrink-0 ${widthClass}`}>
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="w-full aspect-[2/3] relative select-none"
        style={{ perspective: "960px" }}
      >
        <div
          className="w-full h-full relative rounded-[18px] transition-transform duration-500 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: transformStyle,
            boxShadow: isLight
              ? "0 16px 36px rgba(26, 24, 21, 0.24), 0 0 0 1px rgba(180, 134, 28, 0.55)"
              : "0 20px 44px rgba(0, 0, 0, 0.7), 0 0 24px rgba(212, 175, 55, 0.14)",
          }}
        >
          {/* FRONT FACE */}
          <div
            className="absolute inset-0 rounded-[18px] p-2.5 flex flex-col justify-between overflow-hidden"
            style={{
              background: shellBg,
              border: "1.5px solid rgba(212, 175, 55, 0.72)",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Specular Foil Glint */}
            {!reducedMotion && tilt.active && (
              <div
                className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-200"
                style={{
                  background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(248, 229, 160, 0.22) 0%, rgba(212, 175, 55, 0.05) 35%, transparent 65%)`,
                }}
              />
            )}

            {/* Inner double hairline frame */}
            <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-amber-400/25" />

            {/* Top Cartouche */}
            <div className="relative z-10 flex items-center justify-between gap-1 rounded-lg border border-amber-400/30 bg-zinc-950/85 px-2.5 py-1.5">
              <span className="font-heading text-xs font-semibold text-amber-200 tracking-wider">
                {meta.roman}
              </span>
              <span className="text-xs font-medium text-zinc-100 tracking-wide" title={`${meta.letterName} (${meta.gematria})`}>
                {meta.hebrew} · {meta.gematria}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border"
                style={{ color: elColor.badgeText, borderColor: elColor.badgeBorder, background: "rgba(10,12,20,0.8)" }}
              >
                {meta.element}
              </span>
            </div>

            {/* Center Bespoke Sacred Geometry Plate */}
            <div className="relative z-10 flex-1 my-1.5 rounded-xl border border-amber-400/20 bg-zinc-950/45 flex items-center justify-center p-1 overflow-hidden">
              <ArcanaPlateSVG keyNumber={meta.keyNumber} element={meta.element} uid={`front-${meta.keyNumber}`} />
            </div>

            {/* Bottom Engraved Title Plaque */}
            <div className="relative z-10 rounded-lg border border-amber-400/35 bg-zinc-950/90 px-2.5 py-2 text-center space-y-0.5">
              <p className="font-heading text-sm font-semibold text-amber-200 tracking-[0.1em] uppercase truncate">
                {meta.name}
              </p>
              <p className="font-mono text-[9.5px] text-zinc-300/90 tracking-wide truncate">
                {meta.subtitle}
              </p>
            </div>
          </div>

          {/* BACKPLATE (CLASSIC OG BOTA TAROT ARTWORK + HERMETIC PLAQUE) */}
          <div
            className="absolute inset-0 rounded-[18px] p-2.5 flex flex-col justify-between overflow-hidden"
            style={{
              background: shellBg,
              border: "1.5px solid rgba(212, 175, 55, 0.72)",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="pointer-events-none absolute inset-1.5 rounded-[13px] border border-amber-400/25" />

            <div className="relative z-10 flex items-center justify-between gap-1 rounded-lg border border-amber-400/30 bg-zinc-950/90 px-2.5 py-1">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-amber-300">
                Classic BOTA · {meta.roman}
              </span>
              <span className="font-mono text-[9.5px] text-emerald-300">
                {meta.guardian}
              </span>
            </div>

            <div className="relative z-10 flex-1 my-1.5 rounded-xl border border-amber-400/35 bg-zinc-950/90 p-1.5 flex items-center justify-center overflow-hidden">
              <img
                src={CLASSIC_TAROT_PATHS[meta.keyNumber] ?? "/tarot/classic/fool.jpg"}
                alt={`Classic BOTA Tarot Key ${meta.keyNumber}: ${meta.name}`}
                className="h-full w-auto max-w-full object-contain rounded-lg shadow-[0_8px_22px_rgba(0,0,0,0.65)]"
                style={{ imageRendering: "auto" }}
              />
            </div>

            <div className="relative z-10 rounded-lg border border-amber-400/30 bg-zinc-950/90 px-2 py-1.5 text-center">
              <p className="font-mono text-[9.5px] text-amber-200 truncate">
                {meta.letterName} ({meta.hebrew}) · {meta.gematria} · {meta.gate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showFlipButton && (
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          aria-label={flipped ? `Show front plate for ${meta.name}` : `Flip ${meta.name} to Hermetic backplate`}
          className="min-h-[44px] w-full rounded-full border border-amber-400/35 bg-zinc-900/80 hover:bg-zinc-800 text-amber-200 text-xs font-mono px-3 py-2 inline-flex items-center justify-center gap-1.5 transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
          {flipped ? "Show Front Plate" : "Flip Card Backplate"}
        </button>
      )}
    </div>
  );
}
