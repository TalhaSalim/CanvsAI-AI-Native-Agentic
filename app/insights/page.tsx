"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileText,
  Activity,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Zap,
  Database,
  BarChart2,
  Bot,
  Target,
  Eye,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Flag,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  MessageSquare,
} from "lucide-react";
import Header from "../components/Header";
import PersistentCopilot, { CopilotMsg } from "../components/PersistentCopilot";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ──────────────────────────────────────────────────────
interface Insight {
  id: string;
  type: "spike" | "missing" | "emerging" | "suggestion" | "report" | "anomaly" | "correlation";
  title: string;
  description: string;
  dataset: string;
  timestamp: string;
  priority: "critical" | "high" | "medium" | "low";
  actionLabel: string;
  status: "new" | "investigating" | "resolved" | "dismissed";
  tags: string[];
}

// ── Mock Data ──────────────────────────────────────────────────
const INSIGHTS: Insight[] = [
  {
    id: "1",
    type: "spike",
    title: "Anger sentiment up 22% in Houston Parking",
    description: "Post-prompt sync data shows a significant increase in anger emotion. Payment app confusion is the primary driver — 68% of angry responses mention app usability.",
    dataset: "Houston Parking",
    timestamp: "2 min ago",
    priority: "critical",
    actionLabel: "Investigate",
    status: "new",
    tags: ["Sentiment Shift", "Payment App"],
  },
  {
    id: "2",
    type: "missing",
    title: "Northwest College missing Wave 4 responses",
    description: "Wave 4 was expected by Mar 10. Only 3 of the expected 4 waves have been received. Dataset may be incomplete for trending analysis.",
    dataset: "Northwest College 2026",
    timestamp: "9 min ago",
    priority: "high",
    actionLabel: "Review",
    status: "new",
    tags: ["Data Gap", "Wave Missing"],
  },
  {
    id: "3",
    type: "emerging",
    title: "Payment confusion emerging as cross-market theme",
    description: "Payment app confusion appears in both Houston and Austin parking datasets. 62% theme overlap detected — suggests a systemic issue across markets.",
    dataset: "Houston Parking + Austin Parking",
    timestamp: "25 min ago",
    priority: "high",
    actionLabel: "Explore",
    status: "investigating",
    tags: ["Cross-Dataset", "Theme"],
  },
  {
    id: "4",
    type: "report",
    title: "NBC Dispute executive summary draft ready",
    description: "The AI has drafted an 8-page executive summary for the Versant NBC Dispute dataset. Sentiment stabilized — resolution expectations are the top theme.",
    dataset: "Versant NBC Dispute",
    timestamp: "1 hr ago",
    priority: "medium",
    actionLabel: "Review Draft",
    status: "new",
    tags: ["Report Ready", "NBC Dispute"],
  },
  {
    id: "5",
    type: "correlation",
    title: "62% theme overlap: Houston ↔ Austin parking",
    description: "Cross-dataset correlation detected. Payment friction, app usability, and signage issues are shared across both markets — potential for unified action plan.",
    dataset: "Houston Parking + Austin Parking",
    timestamp: "2 hr ago",
    priority: "medium",
    actionLabel: "Explore",
    status: "investigating",
    tags: ["Correlation", "Cross-Market"],
  },
  {
    id: "6",
    type: "anomaly",
    title: "Low classification confidence in Ulta dstest",
    description: "81% of responses have classification confidence below threshold. Dataset may have ambiguous verbatims or require prompt reconfiguration.",
    dataset: "Ulta dstest - take 3",
    timestamp: "3 hr ago",
    priority: "medium",
    actionLabel: "Investigate",
    status: "new",
    tags: ["Quality", "Low Confidence"],
  },
  {
    id: "7",
    type: "spike",
    title: "NBC Dispute sentiment stabilized after media coverage",
    description: "Negative sentiment dropped from 71% to 54% following news coverage. Resolution expectations emerged as the primary constructive theme.",
    dataset: "Versant NBC Dispute",
    timestamp: "5 hr ago",
    priority: "low",
    actionLabel: "Review",
    status: "resolved",
    tags: ["Resolved", "Media Impact"],
  },
  {
    id: "8",
    type: "suggestion",
    title: "Recommended: Compare ECC vs Northwest College sentiment",
    description: "Both datasets cover academic satisfaction in 2026. Side-by-side comparison could surface regional differences in campus experience.",
    dataset: "ECC 2026 + Northwest College 2026",
    timestamp: "Yesterday",
    priority: "low",
    actionLabel: "Explore",
    status: "new",
    tags: ["Suggestion", "Academic"],
  },
];

const TYPE_CONFIG: Record<Insight["type"], { label: string; icon: React.ReactNode; iconBg: string; iconColor: string }> = {
  spike: { label: "Sentiment Spike", icon: <TrendingUp className="w-4 h-4" />, iconBg: "bg-[#F3F4F6]", iconColor: "text-[#374151]" },
  missing: { label: "Missing Data", icon: <AlertCircle className="w-4 h-4" />, iconBg: "bg-[#FFFAF5]", iconColor: "text-[#4B5563]" },
  emerging: { label: "Emerging Theme", icon: <Sparkles className="w-4 h-4" />, iconBg: "bg-[#F3F4F6]", iconColor: "text-[#374151]" },
  suggestion: { label: "AI Suggestion", icon: <Lightbulb className="w-4 h-4" />, iconBg: "bg-[#F3F4F6]", iconColor: "text-[#374151]" },
  report: { label: "Report Ready", icon: <FileText className="w-4 h-4" />, iconBg: "bg-[#F3F4F6]", iconColor: "text-[#374151]" },
  anomaly: { label: "Anomaly", icon: <AlertTriangle className="w-4 h-4" />, iconBg: "bg-[#FFFAF5]", iconColor: "text-[#4B5563]" },
  correlation: { label: "Correlation", icon: <Activity className="w-4 h-4" />, iconBg: "bg-[#F3F4F6]", iconColor: "text-[#374151]" },
};

const PRIORITY_CONFIG: Record<Insight["priority"], { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "text-[#374151] bg-[#F3F4F6] border-[#D1D5DB]", dot: "bg-[#1F2937]" },
  high: { label: "High", color: "text-[#4B5563] bg-[#FFFAF5] border-[#D1D5DB]", dot: "bg-[#6B7280]" },
  medium: { label: "Medium", color: "text-[#4B5563] bg-[#FFFAF5] border-[#D1D5DB]", dot: "bg-[#9CA3AF]" },
  low: { label: "Low", color: "text-[#535862] bg-[#FFFAF5] border-[#E9EAEB]", dot: "bg-[#A4A7AE]" },
};

const STATUS_CONFIG: Record<Insight["status"], { label: string; color: string }> = {
  new: { label: "New", color: "text-[#111827] bg-[#F3F4F6]" },
  investigating: { label: "Investigating", color: "text-[#4B5563] bg-[#FFFAF5]" },
  resolved: { label: "Resolved", color: "text-[#374151] bg-[#F3F4F6]" },
  dismissed: { label: "Dismissed", color: "text-[#717680] bg-[#FFFAF5]" },
};

// ── Copilot Data ───────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_COPILOT_MSGS: CopilotMsg[] = [
  {
    id: "init-1",
    role: "ai",
    content: "**Insights Overview**\n\nI'm monitoring **8 insights** across your datasets:\n\n• **1 critical** — Anger spike in Houston Parking (needs immediate action)\n• **2 high** — Missing Wave 4 data + cross-market payment theme\n• **1 resolved** — NBC Dispute sentiment stabilized\n\nClick any action button — **Investigate**, **Review**, **Explore**, or **Review Draft** — to get my full analysis.",
    timestamp: nowTime(),
    proactive: true,
  },
];

const INSIGHT_CONTEXT_MESSAGES: Record<string, string> = {
  "1": "**Investigating: Anger Spike in Houston Parking**\n\nThis is a critical signal. Here's what I found:\n\n• **22% anger increase** since the Mar 8 prompt sync\n• **68% of angry verbatims** mention payment app issues\n• Top phrases: \"app keeps crashing\", \"can't complete payment\", \"charged twice\"\n\n**Root cause hypothesis:** The prompt sync may have introduced payment flow friction. I recommend:\n1. Review the Mar 8 sync changelog\n2. Pull all payment-related verbatims for QA\n3. Flag to product team immediately\n\nWant me to draft the escalation summary?",
  "2": "**Reviewing: Northwest College Wave 4 Gap**\n\nWave 4 data was due March 10 and hasn't arrived. Impact assessment:\n\n• **Trending analysis is blocked** — 4-wave comparison incomplete\n• **Wave 1–3 summary:** Satisfaction scores trending down in instructor support\n• **Risk:** Report scheduled for Mar 15 may need to be delayed\n\n**Recommendations:**\n1. Contact the client to confirm delivery timeline\n2. Build Wave 1–3 partial report now as a backup\n3. Set an alert to auto-ingest when Wave 4 arrives\n\nShould I draft the client outreach message?",
  "3": "**Exploring: Cross-Market Payment Theme**\n\nPayment friction is appearing consistently across both parking markets:\n\n• **Houston:** 68% of anger responses mention app/payment issues\n• **Austin:** 44% mention similar friction points\n• **Overlap score:** 62% — well above the 30% threshold for systemic concern\n\n**Top shared verbatim themes:**\n1. App usability (both markets)\n2. Payment processing delays (Houston dominant)\n3. Signage confusion (Austin dominant)\n\nThis warrants a unified product recommendation. Want me to draft a cross-market action brief?",
  "4": "**Review Draft: NBC Dispute Executive Summary**\n\nThe 8-page draft is ready. Here's my assessment:\n\n• **Sentiment arc:** 71% negative → 54% negative — clear stabilization\n• **Top emerging theme:** Resolution expectations (38% of recent verbatims)\n• **Key narrative:** Media coverage accelerated sentiment recovery\n\n**Draft quality:** Strong. The executive summary correctly identifies the inflection point.\n\n**Suggested additions before publishing:**\n- Add a 30-day sentiment projection\n- Include the 3 specific verbatim quotes I've flagged\n- Add a \"Next Steps\" section for stakeholders\n\nWant me to add those sections to the draft?",
  "5": "**Exploring: Houston ↔ Austin Correlation**\n\nThe 62% theme overlap reveals a systemic pattern worth addressing at a strategic level:\n\n**Shared themes (ranked by frequency):**\n1. Payment friction — 44% combined\n2. App usability — 38% combined\n3. Signage clarity — 24% combined\n\n**Diverging themes:**\n• Houston-only: Anger at staff behavior (+18%)\n• Austin-only: Positive comments on new lot design (+22%)\n\n**Strategic implication:** A unified payment experience improvement would address the majority of negative feedback across both markets simultaneously. Want me to generate a cross-market recommendation report?",
  "6": "**Investigating: Ulta Classification Confidence**\n\n81% of responses in Ulta dstest fall below the confidence threshold. Diagnosis:\n\n**Likely causes:**\n1. Prompt is too narrow for the verbatim variety in this dataset\n2. Many responses are ambiguous/mixed sentiment\n3. Dataset may contain non-English content\n\n**Immediate actions:**\n1. Review low-confidence verbatims manually (sample of 20)\n2. Broaden classification prompt to include mixed sentiment category\n3. Re-run classification and check confidence distribution\n\nConfidence below 70% means those rows should be excluded from reporting until resolved. Want me to flag the low-confidence rows for export?",
  "7": "**Review: NBC Dispute Sentiment Recovery**\n\nThis insight is marked resolved, but here's the full picture:\n\n**Recovery timeline:**\n• Peak negative: 71% (Mar 1)\n• Post-media coverage drop: 64% (Mar 5)\n• Current: 54% (Mar 11) — stabilized\n\n**What drove recovery:**\n- Media coverage created expectation of resolution\n- Company communication improved response tone\n- Resolution expectation theme now at 38% — highest in dataset history\n\nThis is a template for how to handle future dispute datasets. Should I save this as a case study report?",
  "8": "**Exploring: ECC vs Northwest College Comparison**\n\nThese two academic datasets have strong comparison potential:\n\n**ECC 2026 vs Northwest College 2026:**\n• Both cover spring semester 2026\n• ECC: Digital learning tools are dominant theme (29%)\n• Northwest: Instructor quality leads (31%)\n• Shared concern: Academic support responsiveness (both ~18%)\n\n**Potential insight:** ECC students are more satisfied with technology tools (+14% vs Northwest) while Northwest students rate instructor quality higher (+9% vs ECC). This suggests different institutional strengths worth highlighting.\n\nReady to generate the comparison report? I can configure it now.",
};

function getInsightReply(q: string, contextKey?: string): string {
  const lq = q.toLowerCase();
  const insight = INSIGHTS.find((i) => i.id === contextKey);

  if (insight) {
    if (lq.includes("action") || lq.includes("recommend") || lq.includes("next step") || lq.includes("do"))
      return `**Recommended Actions for: ${insight.title}**\n\nBased on the data patterns, I suggest:\n1. Prioritize verbatim review in the ${insight.dataset} dataset\n2. Tag and export affected responses for team review\n3. ${insight.priority === "critical" ? "Escalate to leadership immediately — this is a critical signal" : "Schedule a follow-up analysis in 48 hours"}\n\nWant me to draft the action brief?`;
    if (lq.includes("verbatim") || lq.includes("quote") || lq.includes("example"))
      return `**Sample Verbatims — ${insight.title}**\n\n• "The app keeps freezing on the payment screen — extremely frustrating"\n• "I was charged twice and couldn't get a response for 3 days"\n• "The signage is confusing, I ended up in the wrong lot twice"\n\nThese represent the highest-frequency patterns in the ${insight.dataset} dataset. Want me to pull the full verbatim list?`;
    if (lq.includes("resolv") || lq.includes("close") || lq.includes("done"))
      return `To resolve **${insight.title}**, click the **Resolve** button on the insight card. This will mark it as resolved and archive it from the active view. The insight data is retained for historical analysis.`;
  }

  if (lq.includes("critical") || lq.includes("urgent") || lq.includes("immediate")) {
    return "**Critical Insights Right Now**\n\n1. **Anger spike in Houston Parking** — 22% increase, payment app root cause. Needs escalation today.\n\nThis is the only critical-priority insight currently active. Want me to walk through the investigation steps?";
  }
  if (lq.includes("pattern") || lq.includes("trend") || lq.includes("common")) {
    return "**Cross-Dataset Patterns I'm Seeing**\n\n• **Payment friction** appears in Houston, Austin, and NBC Dispute datasets\n• **Data quality issues** in Ulta and Northwest College\n• **Sentiment recovery pattern** in NBC mirrors prior dispute resolution cases\n\nThe payment friction signal is the strongest recurring pattern — worth a unified response.";
  }
  if (lq.includes("filter") || lq.includes("show") || lq.includes("find")) {
    return "Use the type filters above (Sentiment Spike, Emerging Theme, etc.) and priority filters to narrow your view. You can also search by dataset name. Click any action button to bring up my full analysis in this panel.";
  }
  return "Click any action button on an insight card (**Investigate**, **Review**, **Explore**, or **Review Draft**) to get my full analysis here. I can also answer general questions about patterns across your insight portfolio.";
}

const COPILOT_CHIPS = [
  "What's most critical?",
  "Show cross-market patterns",
  "Which needs action today?",
  "Summarize data quality issues",
];

// ── Live Pulse Badge ────────────────────────────────────────────
function LivePulse({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-[#F5F5F5] text-[#111111] border border-[#CCCCCC]">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#666666] opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#333333]" />
      </span>
      {label}
    </span>
  );
}

// ── Platform Overview ──────────────────────────────────────────
function PlatformOverview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });

  const stats = [
    { label: "Datasets", value: "5", sub: "2 need review", icon: Database, iconColor: "text-[#111111]", iconBg: "bg-[#F5F5F5]", live: false },
    { label: "Active Agents", value: "3", sub: "Running now", icon: Bot, iconColor: "text-[#444444]", iconBg: "bg-[#E8E8E8]", live: true },
    { label: "Insights Today", value: "47", sub: "+12 from yesterday", icon: Sparkles, iconColor: "text-[#555555]", iconBg: "bg-[#F7F7F7]", live: false },
    { label: "Active Alerts", value: "2", sub: "1 high priority", icon: AlertTriangle, iconColor: "text-[#444444]", iconBg: "bg-[#F2F2F2]", live: false },
  ];

  return (
    <div ref={ref} className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#111111] to-[#333333] flex items-center justify-center">
          <BarChart2 className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Platform Overview</h2>
          <p className="text-xs text-[#666666]">Live metrics across all datasets, agents, and insights</p>
        </div>
        <LivePulse />
      </div>
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } }}
            whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
            className="bg-white rounded-2xl p-4 border border-[#F5F5F5] shadow-sm cursor-default"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", stat.iconBg)}>
                <stat.icon className={cn("w-4 h-4", stat.iconColor)} />
              </div>
              {stat.live && <LivePulse />}
            </div>
            <div className="text-3xl font-bold text-[#1A1A1A] leading-none mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-[#444444]">{stat.label}</div>
            <div className="text-xs text-[#999999] mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Insight Detail View ────────────────────────────────────────
function InsightDetailView({ insight, onBack }: { insight: Insight; onBack: () => void }) {
  const type = TYPE_CONFIG[insight.type];
  const priority = PRIORITY_CONFIG[insight.priority];

  const mockTimeline = [
    { label: "Detected", time: insight.timestamp, done: true },
    { label: "Analysis complete", time: "just now", done: true },
    { label: "Awaiting action", time: "—", done: false },
    { label: "Resolved", time: "—", done: false },
  ];

  const mockImpact = [
    { label: "Responses affected", value: insight.priority === "critical" ? "847" : insight.priority === "high" ? "312" : "104" },
    { label: "Sentiment delta", value: insight.type === "spike" ? "-22%" : insight.type === "missing" ? "N/A" : "+8%" },
    { label: "Dataset coverage", value: insight.priority === "critical" ? "68%" : "44%" },
    { label: "Confidence", value: insight.type === "anomaly" ? "19%" : "87%" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFAF5]/60">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#F5F5F5] px-6 py-4 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] text-[#A4A7AE] hover:text-[#414651] transition-colors flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", type.iconBg, type.iconColor)}>
            {type.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[#111827] leading-snug">{insight.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border", priority.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
                {priority.label}
              </span>
              <span className="text-xs text-[#A4A7AE]">{type.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Asa Analysis Summary */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4">
          <p className="text-xs font-semibold text-[#414651] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#374151]" /> Asa's Analysis
          </p>
          <p className="text-sm text-[#535862] leading-relaxed">{insight.description}</p>
          <div className="mt-3 pt-3 border-t border-[#F5F5F5]">
            <p className="text-xs text-[#A4A7AE]">
              Detected {insight.timestamp} · Dataset: <span className="text-[#535862] font-medium">{insight.dataset}</span>
            </p>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {mockImpact.map((m) => (
            <div key={m.label} className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-3.5">
              <p className="text-xs text-[#A4A7AE] mb-1">{m.label}</p>
              <p className="text-xl font-bold text-[#111827]">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4">
          <p className="text-xs font-semibold text-[#414651] mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {insight.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 bg-[#FFFAF5] text-[#535862] rounded-full border border-[#F5F5F5]">{tag}</span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4">
          <p className="text-xs font-semibold text-[#414651] mb-3">Timeline</p>
          <div className="space-y-3">
            {mockTimeline.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                  step.done ? "bg-[#E83069]" : "bg-[#F5F5F5]")}>
                  {step.done
                    ? <CheckCircle className="w-3 h-3 text-white" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-[#D5D7DA]" />}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className={cn("text-xs", step.done ? "text-[#414651] font-medium" : "text-[#A4A7AE]")}>{step.label}</span>
                  <span className="text-xs text-[#A4A7AE]">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4 pb-6">
          <p className="text-xs font-semibold text-[#414651] mb-3">Recommended Actions</p>
          <div className="space-y-2">
            {[
              `Review ${insight.dataset} verbatims for this pattern`,
              `${insight.priority === "critical" ? "Escalate to team immediately" : "Schedule follow-up analysis"}`,
              "Ask Asa to draft action brief",
            ].map((action, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FFFAF5] border border-[#F5F5F5]">
                <div className="w-5 h-5 rounded-full bg-[#E83069] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-xs text-[#535862]">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Insight Card ───────────────────────────────────────────────
function InsightCard({
  insight,
  featured,
  onAction,
}: {
  insight: Insight;
  featured?: boolean;
  onAction: (insight: Insight) => void;
}) {
  const type = TYPE_CONFIG[insight.type];
  const priority = PRIORITY_CONFIG[insight.priority];
  const [localStatus, setLocalStatus] = useState(insight.status);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5",
        featured ? "border-[#D1D5DB] ring-1 ring-black/5" : "border-[#F5F5F5]",
        localStatus === "resolved" ? "opacity-70" : ""
      )}
    >
      {/* Top */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", type.iconBg, type.iconColor)}>
          {type.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#111827] leading-snug">{insight.title}</p>
            <button onClick={() => setSaved((s) => !s)} className={cn("w-6 h-6 flex items-center justify-center rounded-md transition-colors flex-shrink-0", saved ? "text-[#374151]" : "text-[#D5D7DA] hover:text-[#A4A7AE]")}>
              <Bookmark className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border", priority.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
              {priority.label}
            </span>
            <span className={cn("inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium", STATUS_CONFIG[localStatus].color)}>
              {STATUS_CONFIG[localStatus].label}
            </span>
            <span className="text-xs text-[#A4A7AE]">{type.label}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#717680] leading-relaxed mb-3">{insight.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {insight.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-[#FFFAF5] text-[#717680] rounded-full border border-[#F5F5F5]">{tag}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#FAFAFA]">
        <div className="flex items-center gap-3 text-xs text-[#A4A7AE]">
          <span className="flex items-center gap-1 truncate max-w-[120px]"><Database className="w-3 h-3 flex-shrink-0" /> {insight.dataset}</span>
          <span className="flex items-center gap-1 flex-shrink-0"><Clock className="w-3 h-3" /> {insight.timestamp}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {localStatus !== "resolved" && (
            <button
              onClick={(e) => { e.stopPropagation(); setLocalStatus("resolved"); }}
              className="flex items-center gap-1 text-xs text-[#A4A7AE] hover:text-[#374151] transition-colors px-2 py-1 rounded-lg hover:bg-[#F3F4F6]"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onAction(insight); }}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-[#E83069] hover:bg-[#C71E52] transition-colors px-3 py-1.5 rounded-xl"
          >
            {insight.actionLabel} <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function InsightsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | Insight["type"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Insight["priority"]>("all");
  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  const filtered = INSIGHTS.filter((i) => {
    const matchesType = typeFilter === "all" || i.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || i.priority === priorityFilter;
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.dataset.toLowerCase().includes(search.toLowerCase());
    const matchesResolved = showResolved || i.status !== "resolved";
    return matchesType && matchesPriority && matchesSearch && matchesResolved;
  });

  const typeFilters: { label: string; value: "all" | Insight["type"] }[] = [
    { label: "All", value: "all" },
    { label: "Sentiment Spike", value: "spike" },
    { label: "Emerging Theme", value: "emerging" },
    { label: "Correlation", value: "correlation" },
    { label: "Missing Data", value: "missing" },
    { label: "Anomaly", value: "anomaly" },
    { label: "Suggestions", value: "suggestion" },
  ];

  const criticalInsights = filtered.filter((i) => i.priority === "critical");
  const otherInsights = filtered.filter((i) => i.priority !== "critical");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#FFFAF5]/60">
      <Header />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Left Panel — Copilot (35%) ────────────────────── */}
        <div className="w-[36%] min-w-[340px] max-w-[500px] flex-shrink-0 flex flex-col overflow-hidden border-r border-[#E9EAEB] shadow-[8px_0_24px_rgba(10,13,18,0.06)]">
          <PersistentCopilot
            key="insights-copilot"
            initialMessages={INITIAL_COPILOT_MSGS}
            chips={COPILOT_CHIPS}
            getReply={getInsightReply}
            contextKey={selectedInsight?.id}
            contextMessage={selectedInsight ? INSIGHT_CONTEXT_MESSAGES[selectedInsight.id] : undefined}
            onReset={() => setSelectedInsight(null)}
          />
        </div>

        {/* ── Right Panel (65%) ─────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AnimatePresence mode="wait">
            {selectedInsight ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <InsightDetailView insight={selectedInsight} onBack={() => setSelectedInsight(null)} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Page header */}
                <div className="px-6 pt-6 pb-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-[#111827]">Insights</h1>
                      <p className="text-sm text-[#717680] mt-1">Proactive AI findings surfaced from across your dataset portfolio</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-[#717680] bg-white border border-[#E9EAEB] px-3 py-2 rounded-xl hover:border-[#D5D7DA] transition-colors">
                      <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="rounded accent-[#E83069]" />
                      Show resolved
                    </label>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-[#E9EAEB] shadow-sm">
                      <Search className="w-4 h-4 text-[#A4A7AE]" />
                      <input type="text" placeholder="Search insights..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-36 text-sm bg-transparent outline-none text-[#414651] placeholder:text-[#A4A7AE]" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {typeFilters.map((f) => (
                        <button key={f.value} onClick={() => setTypeFilter(f.value)}
                          className={cn("px-3 py-1.5 text-xs rounded-xl font-medium transition-all",
                            typeFilter === f.value ? "bg-[#E83069] text-white shadow-sm" : "bg-white text-[#717680] border border-[#E9EAEB] hover:border-[#D1D5DB] hover:text-[#374151]")}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {(["all", "critical", "high", "medium", "low"] as const).map((p) => (
                        <button key={p} onClick={() => setPriorityFilter(p)}
                          className={cn("px-2.5 py-1.5 text-xs rounded-xl font-medium border transition-all capitalize",
                            priorityFilter === p ? "bg-[#E83069] text-white border-[#E83069]" : "bg-white text-[#717680] border-[#E9EAEB] hover:border-[#D5D7DA]")}>
                          {p === "all" ? "All" : p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pt-2 pb-8 space-y-6">
                  {/* Platform Overview */}
                  <PlatformOverview />

                  {/* Critical section */}
                  {criticalInsights.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Flag className="w-4 h-4 text-[#374151]" />
                        <h2 className="text-sm font-semibold text-[#374151]">Critical — Needs Immediate Attention</h2>
                        <span className="text-xs bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded-full font-medium">{criticalInsights.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {criticalInsights.map((insight) => (
                          <InsightCard key={insight.id} insight={insight} featured onAction={setSelectedInsight} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All other insights */}
                  {otherInsights.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#374151]" />
                        <h2 className="text-sm font-semibold text-[#414651]">All Insights</h2>
                        <span className="text-xs bg-[#F5F5F5] text-[#535862] px-2 py-0.5 rounded-full font-medium">{otherInsights.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {otherInsights.map((insight) => (
                          <InsightCard key={insight.id} insight={insight} onAction={setSelectedInsight} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filtered.length === 0 && (
                    <div className="text-center py-20">
                      <Sparkles className="w-10 h-10 text-[#D5D7DA] mx-auto mb-3" />
                      <p className="text-[#717680] font-medium">No insights match your filters</p>
                      <p className="text-[#A4A7AE] text-sm mt-1">Try adjusting the filters above</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
