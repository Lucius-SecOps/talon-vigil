/**
 * ThreatScoreCard — EAA Threat Report Card Component
 * The core user-facing output of a TalonVigil scan.
 * Shows composite score, classification, and full layer breakdown.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldX, ChevronDown, ChevronUp, Zap } from "lucide-react";
import clsx from "clsx";

interface LayerResult {
  layer:       number;
  name:        string;
  score:       number;
  multiplier:  number;
  weighted:    number;
  signals:     string[];
  veto:        boolean;
}

interface ScanResult {
  scan_id:         string;
  composite_score: number;
  classification:  "SAFE" | "SUSPICIOUS" | "QUARANTINE" | "VETO";
  veto_triggered:  boolean;
  action:          string;
  layers:          LayerResult[];
  summary:         string;
}

interface Props {
  result: ScanResult;
}

const CLASSIFICATION_CONFIG = {
  SAFE: {
    icon:    Shield,
    label:   "Safe",
    badge:   "badge-safe",
    color:   "text-safe",
    bar:     "bg-safe",
    border:  "border-safe/30",
    glow:    "shadow-safe/20",
  },
  SUSPICIOUS: {
    icon:    ShieldAlert,
    label:   "Suspicious",
    badge:   "badge-suspicious",
    color:   "text-suspicious",
    bar:     "bg-suspicious",
    border:  "border-suspicious/30",
    glow:    "shadow-suspicious/20",
  },
  QUARANTINE: {
    icon:    ShieldX,
    label:   "Quarantined",
    badge:   "badge-quarantine",
    color:   "text-quarantine",
    bar:     "bg-quarantine",
    border:  "border-quarantine/30",
    glow:    "shadow-quarantine/20",
  },
  VETO: {
    icon:    ShieldX,
    label:   "Veto Override",
    badge:   "badge-veto",
    color:   "text-veto",
    bar:     "bg-veto",
    border:  "border-veto/30",
    glow:    "shadow-veto/20",
  },
};

const LAYER_NAMES: Record<number, string> = {
  1: "Envelope", 2: "Reputation", 3: "Headers",
  4: "Linguistics", 5: "Impersonation", 6: "Links", 7: "Behavioral",
};

export default function ThreatScoreCard({ result }: Props) {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
  const config = CLASSIFICATION_CONFIG[result.classification];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "card-cyber relative overflow-hidden",
        `border ${config.border}`,
        `shadow-lg ${config.glow}`
      )}
    >
      {/* Scanline overlay */}
      <div className="scanlines absolute inset-0 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-lg bg-white/5", config.color)}>
            <Icon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={clsx("text-2xl font-bold font-mono", config.color)}>
                {result.composite_score.toFixed(0)}
              </span>
              <span className="text-white/40 text-sm font-mono">/100</span>
              {result.veto_triggered && (
                <span className="flex items-center gap-1 text-xs font-mono text-veto px-2 py-0.5 rounded bg-veto/10 border border-veto/20">
                  <Zap size={10} /> VETO
                </span>
              )}
            </div>
            <span className={clsx("text-sm font-medium", config.color)}>
              {config.label}
            </span>
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
        <p className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
          Layer Breakdown — EAA Report
        </p>

        {result.layers.map((layer, i) => (
          <motion.div
            key={layer.layer}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={clsx(
              "rounded-lg border border-white/5 overflow-hidden",
              layer.score > 65 ? "border-quarantine/20" :
              layer.score > 30 ? "border-suspicious/20" : ""
            )}
          >
            {/* Layer row */}
            <button
              onClick={() => setExpandedLayer(expandedLayer === layer.layer ? null : layer.layer)}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
            >
              {/* Layer number */}
              <span className="text-xs font-mono text-cyan/60 w-5 shrink-0">
                L{layer.layer}
              </span>

              {/* Layer name */}
              <span className="text-sm text-white/70 flex-1">
                {LAYER_NAMES[layer.layer] || layer.name}
              </span>

              {/* Score bar */}
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    layer.score > 65 ? "bg-quarantine" :
                    layer.score > 30 ? "bg-suspicious" : "bg-safe"
                  )}
                  style={{ width: `${layer.score}%` }}
                />
              </div>

              {/* Score value */}
              <span className={clsx(
                "text-xs font-mono w-8 text-right shrink-0",
                layer.score > 65 ? "text-quarantine" :
                layer.score > 30 ? "text-suspicious" : "text-safe"
              )}>
                {layer.score.toFixed(0)}
              </span>

              {/* Veto badge */}
              {layer.veto && (
                <span className="text-[10px] font-mono text-veto px-1.5 py-0.5 rounded bg-veto/10">
                  VETO
                </span>
              )}

              {/* Expand toggle */}
              {layer.signals.length > 0 && (
                <span className="text-white/30 shrink-0">
                  {expandedLayer === layer.layer
                    ? <ChevronUp size={14} />
                    : <ChevronDown size={14} />
                  }
                </span>
              )}
            </button>

            {/* Expanded signals */}
            <AnimatePresence>
              {expandedLayer === layer.layer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/5 bg-white/[0.02]"
                >
                  <ul className="p-3 space-y-2">
                    {layer.signals.map((signal, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-white/50">
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
        ))}
      </div>

      {/* EAA Actions */}
      {result.classification !== "SAFE" && (
        <div className="mt-6 flex gap-3 pt-6 border-t border-white/10">
          <button className="btn-secondary text-xs flex-1">
            Release to Inbox
          </button>
          <button className="btn-secondary text-xs flex-1">
            Keep Quarantined
          </button>
          <button className="text-xs flex-1 px-4 py-2 rounded border border-quarantine/40
                             text-quarantine hover:bg-quarantine/10 transition-colors">
            Report Phishing
          </button>
        </div>
      )}
    </motion.div>
  );
}
