/**
 * ThreatScoreCard — EAA Threat Report Card Component
 * The core user-facing output of a TalonVigil scan.
 * Shows composite score, classification, and full layer breakdown.
 *
 * MERGED with the design pass — original prop shape and structure preserved
 * (drop-in compatible), plus optional additions, all animated with framer-motion
 * so no changes to tailwind.config.js / index.css are required:
 *   - `scanning` prop plays a sequential layer-fill before the verdict
 *   - composite score counts up on reveal
 *   - VETO classification gets a distinct purple glow pulse
 *   - expand/collapse-all control over the layer breakdown
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldX, ChevronDown, ChevronUp, Zap } from "lucide-react";
import clsx from "clsx";
import type { ScanResult, Classification } from "../types/scan";
import { LAYER_NAMES } from "../types/scan";

interface Props {
  result: ScanResult;
  /** When true, play the sequential layer-scan animation before showing the verdict. */
  scanning?: boolean;
}

const CLASSIFICATION_CONFIG: Record<
  Classification,
  { icon: typeof Shield; label: string; badge: string; color: string; bar: string; border: string; glow: string }
> = {
  SAFE:       { icon: Shield,      label: "Safe",          badge: "badge-safe",       color: "text-safe",       bar: "bg-safe",       border: "border-safe/30",       glow: "shadow-safe/20" },
  SUSPICIOUS: { icon: ShieldAlert, label: "Suspicious",    badge: "badge-suspicious", color: "text-suspicious", bar: "bg-suspicious", border: "border-suspicious/30", glow: "shadow-suspicious/20" },
  QUARANTINE: { icon: ShieldX,     label: "Quarantined",   badge: "badge-quarantine", color: "text-quarantine", bar: "bg-quarantine", border: "border-quarantine/30", glow: "shadow-quarantine/20" },
  VETO:       { icon: ShieldX,     label: "Veto Override", badge: "badge-veto",       color: "text-veto",       bar: "bg-veto",       border: "border-veto/30",       glow: "shadow-veto/20" },
};

function useCountUp(target: number, run: boolean, ms = 900) {
  const [n, setN] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    if (!run) return;
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min((performance.now() - t0) / ms, 1);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, run, ms]);
  return run ? n : target;
}

export default function ThreatScoreCard({ result, scanning = false }: Props) {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
  const [phase, setPhase] = useState<"scan" | "result">(scanning ? "scan" : "result");
  const [filled, setFilled] = useState(scanning ? 0 : result.layers.length);

  const config = CLASSIFICATION_CONFIG[result.classification];
  const Icon = config.icon;
  const showScore = useCountUp(result.composite_score, phase === "result");
  const isVeto = result.classification === "VETO";

  // Sequential layer fill during scanning (~90ms apart), then reveal the verdict.
  useEffect(() => {
    if (!scanning) return;
    setPhase("scan");
    setFilled(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setFilled(i);
      if (i >= result.layers.length) {
        clearInterval(id);
        setTimeout(() => setPhase("result"), 450);
      }
    }, 90);
    return () => clearInterval(id);
  }, [scanning, result.scan_id, result.layers.length]);

  const allOpen = expandedLayer === -1;
  const isOpen = (layer: number) => allOpen || expandedLayer === layer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={
        isVeto
          ? { opacity: 1, y: 0, boxShadow: ["0 0 12px rgba(168,85,247,0.35)", "0 0 44px rgba(168,85,247,0.75)", "0 0 12px rgba(168,85,247,0.35)"] }
          : { opacity: 1, y: 0 }
      }
      transition={isVeto ? { boxShadow: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }, default: { duration: 0.4 } } : { duration: 0.4 }}
      className={clsx("card-cyber relative overflow-hidden", `border ${config.border}`, `shadow-lg ${config.glow}`)}
    >
      {/* Scanline overlay */}
      <div className="scanlines absolute inset-0 pointer-events-none" />

      {phase === "scan" ? (
        /* ── Scanning phase ─────────────────────────────────── */
        <div className="relative">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-xs font-mono tracking-[0.14em] text-cyan">
              RUNNING 8-LAYER ANALYSIS
              <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>_</motion.span>
            </span>
            <span className="text-xs font-mono text-white/40">{filled}/{result.layers.length} LAYERS</span>
          </div>
          <div className="space-y-2.5">
            {result.layers.map((layer, i) => {
              const done = i < filled;
              const running = i === filled;
              return (
                <div key={layer.layer} className={clsx("grid grid-cols-[28px_120px_1fr_64px] items-center gap-3 transition-opacity", done || running ? "opacity-100" : "opacity-40")}>
                  <span className="text-xs font-mono text-white/40">L{layer.layer}</span>
                  <span className={clsx("text-sm", done ? "text-white" : "text-white/50")}>{LAYER_NAMES[layer.layer] || layer.name}</span>
                  <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-cyan"
                      initial={false}
                      animate={{ width: done ? "100%" : running ? "60%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {running && (
                        <motion.div
                          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                          animate={{ x: ["-100%", "400%"] }}
                          transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                    </motion.div>
                  </div>
                  <span className="text-right text-xs font-mono text-cyan">{done ? `${layer.score.toFixed(0)}/100` : running ? "···" : "queued"}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={clsx("p-2 rounded-lg bg-white/5", config.color)}>
                <Icon size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={clsx("text-2xl font-bold font-mono", config.color)}>{showScore.toFixed(0)}</span>
                  <span className="text-white/40 text-sm font-mono">/100</span>
                  {result.veto_triggered && (
                    <span className="flex items-center gap-1 text-xs font-mono text-veto px-2 py-0.5 rounded bg-veto/10 border border-veto/20">
                      <Zap size={10} /> VETO
                    </span>
                  )}
                </div>
                <span className={clsx("text-sm font-medium", config.color)}>{config.label}</span>
              </div>
            </div>
            <span className={clsx("text-xs font-mono px-3 py-1.5 rounded-full", config.badge)}>
              {result.action.toUpperCase()}
            </span>
          </div>

          {/* Composite score bar */}
          <div className="mb-6">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.composite_score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={clsx("h-full rounded-full", config.bar)}
              />
            </div>
          </div>

          {/* EAA Summary */}
          <p className="text-sm text-white/60 mb-6 leading-relaxed border-l-2 border-cyan/30 pl-3">
            {result.summary}
          </p>

          {/* Layer Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-white/40 uppercase tracking-wider">Layer Breakdown — EAA Report</p>
              <button
                onClick={() => setExpandedLayer(allOpen ? null : -1)}
                className="text-xs font-mono text-cyan hover:text-cyan-400 transition-colors"
              >
                {allOpen ? "COLLAPSE ALL" : "EXPAND ALL"}
              </button>
            </div>

            {result.layers.map((layer, i) => {
              const open = isOpen(layer.layer);
              return (
                <motion.div
                  key={layer.layer}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={clsx(
                    "rounded-lg border overflow-hidden transition-colors",
                    open ? "border-cyan/40" : "border-white/5",
                    !open && layer.score > 65 ? "border-quarantine/20" : "",
                    !open && layer.score > 30 && layer.score <= 65 ? "border-suspicious/20" : "",
                    layer.veto && "border-veto/40",
                  )}
                >
                  <button
                    onClick={() => setExpandedLayer(open && !allOpen ? null : layer.layer)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-xs font-mono text-cyan/60 w-5 shrink-0">L{layer.layer}</span>
                    <span className="text-sm text-white/70 flex-1 flex items-center gap-2">
                      {LAYER_NAMES[layer.layer] || layer.name}
                      {layer.veto && <span className="text-[10px] font-mono text-veto px-1.5 py-0.5 rounded bg-veto/10 border border-veto/40">VETO</span>}
                    </span>
                    <div className="hidden sm:block w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={clsx("h-full rounded-full transition-all", layer.veto ? "bg-veto" : layer.score > 65 ? "bg-quarantine" : layer.score > 30 ? "bg-suspicious" : "bg-safe")}
                        style={{ width: `${layer.score}%` }}
                      />
                    </div>
                    <span className={clsx("text-xs font-mono w-8 text-right shrink-0", layer.veto ? "text-veto" : layer.score > 65 ? "text-quarantine" : layer.score > 30 ? "text-suspicious" : "text-safe")}>
                      {layer.score.toFixed(0)}
                    </span>
                    {layer.signals.length > 0 && (
                      <span className="text-white/30 shrink-0">
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="border-t border-white/5 bg-white/[0.02]"
                      >
                        <ul className="p-3 space-y-2">
                          {layer.signals.map((signal, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-white/50 leading-relaxed">
                              <span className="text-cyan/40 shrink-0 mt-0.5">→</span>
                              {signal}
                            </li>
                          ))}
                        </ul>
                        <div className="px-3 pb-3 flex gap-4 text-xs font-mono text-white/30">
                          <span>weight: {layer.multiplier}×</span>
                          <span>weighted: {layer.weighted.toFixed(1)}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* EAA Actions */}
          {result.classification !== "SAFE" && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
              <button className="btn-secondary text-xs flex-1">Release to Inbox</button>
              <button className="btn-secondary text-xs flex-1">Keep Quarantined</button>
              <button className="text-xs flex-1 px-4 py-2 rounded border border-quarantine/40 text-quarantine hover:bg-quarantine/10 transition-colors">
                Report Phishing
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
