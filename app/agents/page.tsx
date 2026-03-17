"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Plus,
  Play,
  Pause,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  Zap,
  Shield,
  TrendingUp,
  Database,
  AlertTriangle,
  FileText,
  RefreshCw,
  X,
  ChevronDown,
  Sparkles,
  MoreHorizontal,
  Timer,
  Target,
  MessageSquare,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import Header from "../components/Header";
import PersistentCopilot, { CopilotMsg } from "../components/PersistentCopilot";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ──────────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  description: string;
  type: "sentiment" | "theme" | "quality" | "report" | "anomaly" | "custom";
  status: "running" | "scheduled" | "idle" | "paused" | "error";
  datasets: string[];
  lastRun: string;
  nextRun: string;
  schedule: string;
  runs: number;
  insights: number;
  accuracy: number;
  health: "productive" | "attention" | "neutral";
}

// ── Mock Data ──────────────────────────────────────────────────
const AGENTS: Agent[] = [
  {
    id: "1",
    name: "Sentiment Monitor",
    description: "Tracks emotion shifts in real-time across all active datasets. Fires alerts on >15% sentiment change.",
    type: "sentiment",
    status: "running",
    datasets: ["Houston Parking", "Austin Parking", "Versant NBC"],
    lastRun: "2 min ago",
    nextRun: "in 13 min",
    schedule: "Every 15 min",
    runs: 188,
    insights: 34,
    accuracy: 94,
    health: "productive",
  },
  {
    id: "2",
    name: "Theme Discovery",
    description: "Detects emerging qualitative themes using LLM clustering. Surfaces new patterns before they trend.",
    type: "theme",
    status: "running",
    datasets: ["Houston Parking", "Northwest College", "ECC 2026"],
    lastRun: "12 min ago",
    nextRun: "in 48 min",
    schedule: "Hourly",
    runs: 64,
    insights: 21,
    accuracy: 89,
    health: "productive",
  },
  {
    id: "3",
    name: "Data Quality Agent",
    description: "Validates completeness, flags duplicates, scores classification confidence. Auto-quarantines low-quality rows.",
    type: "quality",
    status: "paused",
    datasets: ["All Datasets"],
    lastRun: "12 hr ago",
    nextRun: "Paused",
    schedule: "Daily 8 AM",
    runs: 30,
    insights: 7,
    accuracy: 98,
    health: "attention",
  },
  {
    id: "4",
    name: "Weekly Report Generator",
    description: "Auto-drafts executive summaries from dataset insights. Sends via email every Monday morning.",
    type: "report",
    status: "scheduled",
    datasets: ["Houston Parking", "Versant NBC"],
    lastRun: "5 days ago",
    nextRun: "Monday 9 AM",
    schedule: "Every Monday",
    runs: 12,
    insights: 12,
    accuracy: 91,
    health: "neutral",
  },
  {
    id: "5",
    name: "Anomaly Detector",
    description: "Monitors statistical outliers in response patterns. Flags unusual verbatim clusters for human review.",
    type: "anomaly",
    status: "idle",
    datasets: ["Versant NBC", "ECC 2026"],
    lastRun: "1 day ago",
    nextRun: "On demand",
    schedule: "Manual",
    runs: 9,
    insights: 15,
    accuracy: 87,
    health: "attention",
  },
  {
    id: "6",
    name: "Cross-Dataset Correlation",
    description: "Identifies shared themes and sentiment patterns across datasets. Surfaces strategic market insights.",
    type: "custom",
    status: "error",
    datasets: ["Houston Parking", "Austin Parking"],
    lastRun: "3 hr ago",
    nextRun: "Retry pending",
    schedule: "Every 6 hr",
    runs: 44,
    insights: 19,
    accuracy: 82,
    health: "attention",
  },
];

const AGENT_TYPE_ICONS: Record<Agent["type"], React.ReactNode> = {
  sentiment: <Activity className="w-4 h-4" />,
  theme: <Sparkles className="w-4 h-4" />,
  quality: <Shield className="w-4 h-4" />,
  report: <FileText className="w-4 h-4" />,
  anomaly: <AlertTriangle className="w-4 h-4" />,
  custom: <Zap className="w-4 h-4" />,
};

const AGENT_TYPE_COLOR: Record<Agent["type"], string> = {
  sentiment: "bg-[#F3F4F6] text-[#374151]",
  theme: "bg-[#F3F4F6] text-[#374151]",
  quality: "bg-[#F3F4F6] text-[#374151]",
  report: "bg-[#F3F4F6] text-[#374151]",
  anomaly: "bg-[#FFFAF5] text-[#4B5563]",
  custom: "bg-[#F3F4F6] text-[#374151]",
};

const STATUS_CONFIG: Record<Agent["status"], { label: string; dot: string; text: string }> = {
  running: { label: "Running", dot: "bg-[#374151]", text: "text-[#374151]" },
  scheduled: { label: "Scheduled", dot: "bg-[#6B7280]", text: "text-[#535862]" },
  idle: { label: "Idle", dot: "bg-[#A4A7AE]", text: "text-[#535862]" },
  paused: { label: "Paused", dot: "bg-[#9CA3AF]", text: "text-[#535862]" },
  error: { label: "Error", dot: "bg-[#1F2937]", text: "text-[#374151]" },
};

// ── Copilot Data ───────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_COPILOT_MSGS: CopilotMsg[] = [
  {
    id: "init-1",
    role: "ai",
    content: "**Agent Health Overview**\n\nYou have **6 agents** deployed. Here's the quick picture:\n\n• **2 productive** — Sentiment Monitor & Theme Discovery are running well with high accuracy (94% and 89%)\n• **3 need attention** — Data Quality (paused), Anomaly Detector (idle), and Cross-Dataset Correlation (error)\n• **1 neutral** — Weekly Report Generator is on schedule\n\nWant me to deep-dive into any specific agent or issue?",
    timestamp: now(),
    proactive: true,
  },
];

const AGENT_CONTEXT_MESSAGES: Record<string, string> = {
  "1": "**Sentiment Monitor — Productive**\n\nThis agent is your highest performer. Running every 15 minutes across Houston, Austin, and Versant NBC datasets with **94% accuracy** and 34 insights generated.\n\n**Agentic relations:** It feeds data into the Weekly Report Generator and triggers the Anomaly Detector on large sentiment shifts. No action needed — keep monitoring.",
  "2": "**Theme Discovery — Productive**\n\nRunning smoothly on an hourly cadence. 21 insights generated with 89% accuracy across 3 datasets.\n\n**Opportunity:** Consider expanding to Austin Parking — similar respondent profile may reveal cross-market theme convergence. Want me to draft the configuration change?",
  "3": "**Data Quality Agent — Needs Attention**\n\nPaused 12 hours ago. This agent validates all datasets, so its absence may allow data quality issues to accumulate.\n\n**Recommendation:** Resume immediately with a one-time manual run to catch any backlog. The 98% accuracy makes it the most reliable agent in your stack — it shouldn't stay paused.",
  "4": "**Weekly Report Generator — On Schedule**\n\nNext run is Monday 9 AM. It will auto-draft summaries from Houston Parking and Versant NBC insights.\n\n**Suggestion:** Add ECC 2026 to its dataset scope before Monday — there's strong emerging data that stakeholders will want in the executive summary.",
  "5": "**Anomaly Detector — Needs Attention**\n\nHas been idle for 1 day. Last run generated 15 insights on Versant NBC and ECC 2026 — the highest insight-to-run ratio in your fleet.\n\n**Recommendation:** Switch from Manual to a Daily schedule. Its 87% accuracy at detecting outliers makes it high-value for proactive alerting.",
  "6": "**Cross-Dataset Correlation — Error State**\n\nFailed 3 hours ago. This agent compares Houston and Austin Parking datasets — it had been generating 19 strategic insights.\n\n**Likely cause:** Rate limit or timeout on the LLM clustering step. Recommend reviewing logs, reducing batch size, and retrying. Want me to suggest updated configuration parameters?",
};

function getAgentReply(q: string, contextKey?: string): string {
  const lq = q.toLowerCase();
  const agent = AGENTS.find((a) => a.id === contextKey);

  if (agent) {
    if (lq.includes("accuracy") || lq.includes("performance"))
      return `**${agent.name} Accuracy: ${agent.accuracy}%**\n\nThis is ${agent.accuracy >= 90 ? "above average" : "slightly below average"} for this agent type. ${agent.accuracy >= 90 ? "No tuning needed at this time." : "Consider reviewing dataset quality and threshold settings."}`;
    if (lq.includes("insight") || lq.includes("finding"))
      return `**Insights from ${agent.name}**\n\n${agent.insights} total insights generated across ${agent.runs} runs. The insight rate is **${(agent.insights / Math.max(agent.runs, 1)).toFixed(2)} per run** — ${agent.insights / Math.max(agent.runs, 1) > 0.3 ? "which is healthy" : "suggesting potential tuning opportunities"}.`;
    if (lq.includes("pause") || lq.includes("stop") || lq.includes("resume"))
      return `To ${agent.status === "running" ? "pause" : "resume"} ${agent.name}, use the toggle button on its card. I'd recommend ${agent.status === "paused" ? "resuming soon — the data backlog may be growing" : "only pausing if there's a specific reason — this agent is contributing to downstream pipelines"}.`;
  }

  if (lq.includes("productive") || lq.includes("best")) {
    return "**Top Performing Agents**\n\n1. **Sentiment Monitor** (94% accuracy, 188 runs) — your most active\n2. **Data Quality Agent** (98% accuracy) — most precise, but currently paused\n3. **Theme Discovery** (89%, generating new patterns hourly)\n\nFocus attention on the 3 agents in error/idle/paused states.";
  }
  if (lq.includes("attention") || lq.includes("fix") || lq.includes("error") || lq.includes("problem")) {
    return "**Agents Needing Attention**\n\n• **Cross-Dataset Correlation** — Error state, retry needed\n• **Data Quality Agent** — Paused 12hr, data quality risk\n• **Anomaly Detector** — Idle, missing daily outlier detection\n\nWant me to walk through the fix for any of these?";
  }
  if (lq.includes("schedule") || lq.includes("when") || lq.includes("next")) {
    return "**Upcoming Agent Activity**\n\n• Sentiment Monitor — runs in 13 min\n• Theme Discovery — runs in 48 min\n• Weekly Report Generator — Monday 9 AM\n• Cross-Dataset Correlation — retry pending\n\nNo conflicts detected in the current schedule.";
  }
  if (lq.includes("deploy") || lq.includes("new agent") || lq.includes("create")) {
    return "To deploy a new agent, click **New Agent** in the top right. I recommend starting with a **Sentiment Monitor** if you have a new dataset — it provides the fastest time-to-insight and feeds other agents downstream.";
  }
  return "I can help you analyze agent performance, identify which agents need attention, troubleshoot errors, or recommend configuration improvements. Which agent would you like to focus on?";
}

const COPILOT_CHIPS = [
  "Which agents need attention?",
  "Show productive agents",
  "Fix error state",
  "Optimize schedules",
];

// ── New Agent Modal ────────────────────────────────────────────
function NewAgentModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "",
    datasets: [] as string[],
    schedule: "hourly",
    notify: true,
    threshold: "15",
  });

  const agentTypes = [
    { value: "sentiment", label: "Sentiment Monitor", desc: "Track emotion shifts in real-time", icon: <Activity className="w-5 h-5" />, color: "border-[#E5E7EB] bg-[#F3F4F6]" },
    { value: "theme", label: "Theme Discovery", desc: "Surface emerging themes with LLM clustering", icon: <Sparkles className="w-5 h-5" />, color: "border-[#E5E7EB] bg-[#F3F4F6]" },
    { value: "quality", label: "Data Quality", desc: "Validate completeness, flag duplicates", icon: <Shield className="w-5 h-5" />, color: "border-[#E5E7EB] bg-[#F3F4F6]" },
    { value: "report", label: "Report Generator", desc: "Auto-draft executive summaries", icon: <FileText className="w-5 h-5" />, color: "border-[#E5E7EB] bg-[#F3F4F6]" },
    { value: "anomaly", label: "Anomaly Detector", desc: "Detect statistical outliers", icon: <AlertTriangle className="w-5 h-5" />, color: "border-[#E5E7EB] bg-[#FFFAF5]" },
    { value: "custom", label: "Custom Agent", desc: "Build with custom instructions", icon: <Zap className="w-5 h-5" />, color: "border-[#E5E7EB] bg-[#F3F4F6]" },
  ];

  const datasets = ["Houston Parking", "Austin Parking", "Versant NBC Dispute", "Northwest College 2026", "ECC 2026 Dashboard", "Ulta dstest"];

  const toggleDataset = (ds: string) => {
    setForm((f) => ({
      ...f,
      datasets: f.datasets.includes(ds) ? f.datasets.filter((d) => d !== ds) : [...f.datasets, ds],
    }));
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-[#1F2937]/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F5]">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Create New Agent</h2>
              <p className="text-xs text-[#A4A7AE] mt-0.5">Step {step} of 3</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] text-[#A4A7AE] hover:text-[#535862] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-1 px-6 pt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn("h-1 flex-1 rounded-full transition-colors", s <= step ? "bg-[#E83069]" : "bg-[#F5F5F5]")} />
            ))}
          </div>

          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            {step === 1 && (
              <div>
                <p className="text-sm font-medium text-[#414651] mb-3">Choose agent type</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {agentTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                      className={cn(
                        "text-left p-3.5 rounded-xl border-2 transition-all",
                        form.type === t.value ? "border-[#E83069] bg-[#F5F5F5]" : `border-transparent ${t.color} hover:border-[#E9EAEB]`
                      )}
                    >
                      <div className="mb-2">{t.icon}</div>
                      <p className="text-sm font-semibold text-[#1F2937]">{t.label}</p>
                      <p className="text-xs text-[#717680] mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-1.5">Agent Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Houston Sentiment Watcher"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#E9EAEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E83069]/20 focus:border-[#E83069] transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    placeholder="What should this agent do?"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#E9EAEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E83069]/20 focus:border-[#E83069] transition resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-2">Target Datasets</label>
                  <div className="flex flex-wrap gap-2">
                    {datasets.map((ds) => (
                      <button
                        key={ds}
                        onClick={() => toggleDataset(ds)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                          form.datasets.includes(ds)
                            ? "bg-[#E83069] text-white border-[#E83069]"
                            : "bg-white text-[#535862] border-[#E9EAEB] hover:border-[#D5D7DA]"
                        )}
                      >
                        {ds}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-1.5">Run Schedule</label>
                  <select
                    value={form.schedule}
                    onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#E9EAEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E83069]/20 focus:border-[#E83069] transition bg-white"
                  >
                    <option value="realtime">Real-time (continuous)</option>
                    <option value="15min">Every 15 minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily at 8 AM</option>
                    <option value="weekly">Every Monday</option>
                    <option value="manual">Manual only</option>
                  </select>
                </div>
                {form.type === "sentiment" && (
                  <div>
                    <label className="text-xs font-medium text-[#535862] block mb-1.5">Alert Threshold (%)</label>
                    <input
                      type="number" min="1" max="100"
                      value={form.threshold}
                      onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-[#E9EAEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E83069]/20 focus:border-[#E83069] transition"
                    />
                    <p className="text-xs text-[#A4A7AE] mt-1">Alert fires when sentiment changes by this amount</p>
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#FFFAF5] border border-[#F5F5F5]">
                  <div
                    onClick={() => setForm((f) => ({ ...f, notify: !f.notify }))}
                    className={cn("w-10 h-5.5 rounded-full relative transition-colors", form.notify ? "bg-[#E83069]" : "bg-[#E9EAEB]")}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", form.notify ? "left-5" : "left-0.5")} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1F2937]">Email notifications</p>
                    <p className="text-xs text-[#A4A7AE]">Get notified when insights are generated</p>
                  </div>
                </label>
                <div className="bg-[#FFFAF5] rounded-xl p-4 border border-[#E9EAEB]">
                  <p className="text-xs font-semibold text-[#414651] mb-2">Agent Summary</p>
                  <div className="space-y-1 text-xs text-[#535862]">
                    <p><span className="font-medium text-[#1F2937]">Name:</span> {form.name || "—"}</p>
                    <p><span className="font-medium text-[#1F2937]">Type:</span> {form.type || "—"}</p>
                    <p><span className="font-medium text-[#1F2937]">Datasets:</span> {form.datasets.length > 0 ? form.datasets.join(", ") : "—"}</p>
                    <p><span className="font-medium text-[#1F2937]">Schedule:</span> {form.schedule}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#F5F5F5] flex items-center justify-between">
            <button
              onClick={() => step > 1 ? setStep((s) => s - 1) : onClose()}
              className="text-sm text-[#717680] hover:text-[#414651] font-medium"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={() => step < 3 ? setStep((s) => s + 1) : onClose()}
              disabled={step === 1 && !form.type}
              className={cn(
                "px-5 py-2 text-sm rounded-xl font-semibold transition-all",
                step === 3
                  ? "bg-[#E83069] text-white hover:bg-[#C71E52] shadow-sm hover:shadow-md"
                  : "bg-[#E83069] text-white hover:bg-[#C71E52]",
                step === 1 && !form.type ? "opacity-40 cursor-not-allowed" : ""
              )}
            >
              {step === 3 ? "Deploy Agent" : "Continue"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Agent Card ─────────────────────────────────────────────────
function AgentCard({
  agent,
  onAskAsa,
}: {
  agent: Agent;
  onAskAsa: (agent: Agent) => void;
}) {
  const [localStatus, setLocalStatus] = useState(agent.status);

  const healthBadge = {
    productive: { label: "Productive", bg: "bg-[#F3F4F6]", text: "text-[#374151]", icon: <TrendingUp className="w-3 h-3" /> },
    attention: { label: "Needs Attention", bg: "bg-[#FFFAF5]", text: "text-[#4B5563]", icon: <AlertCircle className="w-3 h-3" /> },
    neutral: { label: "On Track", bg: "bg-[#F5F5F5]", text: "text-[#535862]", icon: <CheckCircle className="w-3 h-3" /> },
  }[agent.health];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-4"
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", AGENT_TYPE_COLOR[agent.type])}>
            {AGENT_TYPE_ICONS[agent.type]}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{agent.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[localStatus].dot)} />
              <span className={cn("text-xs font-medium", STATUS_CONFIG[localStatus].text)}>
                {STATUS_CONFIG[localStatus].label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full", healthBadge.bg, healthBadge.text)}>
            {healthBadge.icon}
            {healthBadge.label}
          </span>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] text-[#A4A7AE]">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-[#717680] leading-relaxed">{agent.description}</p>

      {/* Datasets */}
      <div className="flex flex-wrap gap-1.5">
        {agent.datasets.map((ds) => (
          <span key={ds} className="text-xs px-2 py-0.5 bg-[#FFFAF5] text-[#535862] rounded-full border border-[#F5F5F5]">
            {ds}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#FAFAFA]">
        <div className="text-center">
          <p className="text-sm font-bold text-[#1F2937]">{agent.runs}</p>
          <p className="text-xs text-[#A4A7AE]">Total runs</p>
        </div>
        <div className="text-center border-x border-[#F5F5F5]">
          <p className="text-sm font-bold text-[#1F2937]">{agent.insights}</p>
          <p className="text-xs text-[#A4A7AE]">Insights</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1F2937]">{agent.accuracy}%</p>
          <p className="text-xs text-[#A4A7AE]">Accuracy</p>
        </div>
      </div>

      {/* Schedule */}
      <div className="flex items-center gap-4 text-xs text-[#A4A7AE]">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last: {agent.lastRun}</span>
        <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Next: {agent.nextRun}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#FAFAFA]">
        <button
          onClick={() => setLocalStatus((s) => (s === "running" ? "paused" : "running"))}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl transition-all",
            localStatus === "running"
              ? "bg-[#FFFAF5] text-[#4B5563] hover:bg-[#F3F4F6]"
              : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
          )}
        >
          {localStatus === "running" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl bg-[#FFFAF5] text-[#535862] hover:bg-[#F5F5F5] transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Run Now
        </button>
        <button className="flex items-center justify-center py-2 px-2.5 text-xs font-medium rounded-xl bg-[#FFFAF5] text-[#535862] hover:bg-[#F5F5F5] transition-all">
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAskAsa(agent); }}
          className="ml-auto flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-[#E83069] text-white hover:bg-[#C71E52] transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Ask Asa
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AgentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | Agent["status"]>("all");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [copilotMsgs, setCopilotMsgs] = useState<CopilotMsg[]>(INITIAL_COPILOT_MSGS);

  const filtered = AGENTS.filter((a) => filter === "all" || a.status === filter);

  const stats = [
    { label: "Total Agents", value: AGENTS.length, icon: Bot, color: "text-[#111827]", bg: "bg-[#F5F5F5]" },
    { label: "Running", value: AGENTS.filter((a) => a.status === "running").length, icon: Activity, color: "text-[#374151]", bg: "bg-[#F3F4F6]" },
    { label: "Need Attention", value: AGENTS.filter((a) => a.health === "attention").length, icon: AlertCircle, color: "text-[#4B5563]", bg: "bg-[#FFFAF5]" },
    { label: "Productive", value: AGENTS.filter((a) => a.health === "productive").length, icon: TrendingUp, color: "text-[#374151]", bg: "bg-[#F3F4F6]" },
  ];

  const filters: { label: string; value: "all" | Agent["status"] }[] = [
    { label: "All", value: "all" },
    { label: "Running", value: "running" },
    { label: "Scheduled", value: "scheduled" },
    { label: "Paused", value: "paused" },
    { label: "Idle", value: "idle" },
  ];

  function handleAskAsa(agent: Agent) {
    setSelectedAgent(agent);
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#FFFAF5]/60">
      <Header />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Left Panel — Copilot (35%) ────────────────────── */}
        <div className="w-[36%] min-w-[340px] max-w-[500px] flex-shrink-0 flex flex-col overflow-hidden border-r border-[#E9EAEB] shadow-[8px_0_24px_rgba(10,13,18,0.06)]">
          <PersistentCopilot
            key="agents-copilot"
            initialMessages={INITIAL_COPILOT_MSGS}
            chips={COPILOT_CHIPS}
            getReply={getAgentReply}
            contextKey={selectedAgent?.id}
            contextMessage={selectedAgent ? AGENT_CONTEXT_MESSAGES[selectedAgent.id] : undefined}
            onReset={() => setSelectedAgent(null)}
          />
        </div>

        {/* ── Right Panel (65%) ─────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Page header */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#111827]">Agent Workflows</h1>
                <p className="text-sm text-[#717680] mt-1">Autonomous agents monitoring your datasets around the clock</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#E83069] text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-[#C71E52] hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                New Agent
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mt-5">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-3.5 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                    <s.icon className={cn("w-4.5 h-4.5", s.color)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#111827]">{s.value}</p>
                    <p className="text-xs text-[#A4A7AE]">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 mt-4">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "px-3.5 py-1.5 text-sm rounded-xl font-medium transition-all",
                    filter === f.value
                      ? "bg-[#E83069] text-white shadow-sm"
                      : "bg-white text-[#717680] border border-[#E9EAEB] hover:border-[#D5D7DA] hover:text-[#1F2937]"
                  )}
                >
                  {f.label}
                  {f.value !== "all" && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {AGENTS.filter((a) => a.status === f.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onAskAsa={handleAskAsa} />
              ))}
            </div>
          </div>
        </div>

      </div>

      {showModal && <NewAgentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
