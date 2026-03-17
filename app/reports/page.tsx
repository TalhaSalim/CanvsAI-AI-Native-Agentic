"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Download,
  Eye,
  Send,
  Clock,
  CheckCircle,
  Sparkles,
  X,
  Search,
  Filter,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Layers,
  Users,
  Calendar,
  MoreHorizontal,
  RefreshCw,
  Star,
  Zap,
  MessageSquare,
  ChevronLeft,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import Header from "../components/Header";
import PersistentCopilot, { CopilotMsg } from "../components/PersistentCopilot";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ──────────────────────────────────────────────────────
interface Report {
  id: string;
  name: string;
  type: "executive" | "sentiment" | "theme" | "comparison" | "quality" | "custom";
  status: "ready" | "generating" | "scheduled" | "draft";
  datasets: string[];
  generatedAt: string;
  pages: number;
  recipients: number;
  starred: boolean;
  summary: string;
  format: "pdf" | "slides" | "doc";
}

// ── Mock Data ──────────────────────────────────────────────────
const REPORTS: Report[] = [
  {
    id: "1",
    name: "NBC Dispute Executive Summary",
    type: "executive",
    status: "ready",
    datasets: ["Versant NBC Dispute"],
    generatedAt: "Today 9:14 AM",
    pages: 8,
    recipients: 5,
    starred: true,
    summary: "Sentiment stabilized at 54% negative after media coverage peaked. Resolution expectations are the top emerging theme.",
    format: "pdf",
  },
  {
    id: "2",
    name: "Houston vs Austin Parking Comparison",
    type: "comparison",
    status: "ready",
    datasets: ["Houston Parking", "Austin Parking"],
    generatedAt: "Yesterday 4:22 PM",
    pages: 14,
    recipients: 3,
    starred: true,
    summary: "62% theme overlap detected. Payment friction and app usability are shared pain points across both markets.",
    format: "slides",
  },
  {
    id: "3",
    name: "Weekly Sentiment Digest — March W2",
    type: "sentiment",
    status: "ready",
    datasets: ["Houston Parking", "Austin Parking", "Versant NBC"],
    generatedAt: "Mar 10, 2026",
    pages: 6,
    recipients: 8,
    starred: false,
    summary: "Anger sentiment up 22% in Houston post-prompt sync. Austin remains stable. NBC sentiment recovery mirrors prior cases.",
    format: "pdf",
  },
  {
    id: "4",
    name: "ECC 2026 Theme Discovery Report",
    type: "theme",
    status: "ready",
    datasets: ["ECC 2026 Dashboard"],
    generatedAt: "Mar 9, 2026",
    pages: 11,
    recipients: 4,
    starred: false,
    summary: "Digital learning and instructor quality are dominant themes. Satisfaction trending up across academic support questions.",
    format: "doc",
  },
  {
    id: "5",
    name: "Cross-Dataset Quality Assessment",
    type: "quality",
    status: "generating",
    datasets: ["All Datasets"],
    generatedAt: "Generating…",
    pages: 0,
    recipients: 2,
    starred: false,
    summary: "Analyzing completeness, duplicates, and classification confidence across 5 active datasets.",
    format: "pdf",
  },
  {
    id: "6",
    name: "Northwest College Wave 4 Readiness",
    type: "executive",
    status: "draft",
    datasets: ["Northwest College 2026"],
    generatedAt: "Draft — Mar 8",
    pages: 5,
    recipients: 0,
    starred: false,
    summary: "Wave 4 responses still missing. Report draft on hold pending data ingestion.",
    format: "pdf",
  },
];

const REPORT_TYPE_CONFIG: Record<Report["type"], { label: string; icon: React.ReactNode; color: string }> = {
  executive: { label: "Executive", icon: <Star className="w-3.5 h-3.5" />, color: "bg-[#F3F4F6] text-[#374151]" },
  sentiment: { label: "Sentiment", icon: <TrendingUp className="w-3.5 h-3.5" />, color: "bg-[#F3F4F6] text-[#374151]" },
  theme: { label: "Theme", icon: <Sparkles className="w-3.5 h-3.5" />, color: "bg-[#FFFAF5] text-[#4B5563]" },
  comparison: { label: "Comparison", icon: <Layers className="w-3.5 h-3.5" />, color: "bg-[#F3F4F6] text-[#374151]" },
  quality: { label: "Quality", icon: <BarChart2 className="w-3.5 h-3.5" />, color: "bg-[#F3F4F6] text-[#374151]" },
  custom: { label: "Custom", icon: <Zap className="w-3.5 h-3.5" />, color: "bg-[#F3F4F6] text-[#374151]" },
};

const STATUS_CONFIG: Record<Report["status"], { label: string; dot: string; text: string; bg: string }> = {
  ready: { label: "Ready", dot: "bg-[#374151]", text: "text-[#374151]", bg: "bg-[#F3F4F6]" },
  generating: { label: "Generating…", dot: "bg-[#9CA3AF] animate-pulse", text: "text-[#4B5563]", bg: "bg-[#FFFAF5]" },
  scheduled: { label: "Scheduled", dot: "bg-[#6B7280]", text: "text-[#374151]", bg: "bg-[#F3F4F6]" },
  draft: { label: "Draft", dot: "bg-[#D1D5DB]", text: "text-[#535862]", bg: "bg-[#FFFAF5]" },
};

// ── Copilot Data ───────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_COPILOT_MSGS: CopilotMsg[] = [
  {
    id: "init-1",
    role: "ai",
    content: "**Reports Overview**\n\nYou have **6 reports** in your library:\n\n• **4 ready** to view and download\n• **1 currently generating** (Quality Assessment)\n• **1 draft** pending data (Northwest College)\n\nClick **Discuss with Asa** on any report to explore its findings in depth.",
    timestamp: nowTime(),
    proactive: true,
  },
];

const REPORT_CONTEXT_MESSAGES: Record<string, string> = {
  "1": "**NBC Dispute Executive Summary**\n\nI've pulled this report up. Here's the key picture:\n\n• **Overall sentiment:** 54% negative, stabilizing after media peak\n• **Top emerging theme:** Resolution expectations (38% of verbatims)\n• **Trend:** 12% improvement week-over-week as communication improved\n\nThe report spans 8 pages. Want me to walk through the sentiment breakdown, key quotes, or recommendations section?",
  "2": "**Houston vs Austin Parking Comparison**\n\nThis comparison report reveals strong cross-market patterns:\n\n• **62% theme overlap** — payment friction is #1 in both markets\n• App usability issues appear in 44% of Houston responses vs 39% in Austin\n• **Houston NPS: 31** | **Austin NPS: 38** — Austin outperforms slightly\n\nWant me to highlight diverging themes, or dig into the actionable recommendations across both markets?",
  "3": "**Weekly Sentiment Digest — March W2**\n\nKey findings from this digest:\n\n• **Houston:** Anger up 22% — triggered by the prompt sync issue on Mar 8\n• **Austin:** Stable, no significant movement\n• **NBC:** Recovering — sentiment trending back toward baseline following prior dispute case pattern\n\nThis covers 3 datasets with 8 recipients. Should I summarize the recommended actions or the dataset-by-dataset breakdown?",
  "4": "**ECC 2026 Theme Discovery Report**\n\nThis theme report from ECC 2026 data shows:\n\n• **Dominant themes:** Digital learning tools (29%), Instructor quality (24%)\n• **Satisfaction trending up** in academic support questions\n• 11 pages covering 6 theme clusters with verbatim examples\n\nThis is strong data for the upcoming presentation to academic leadership. Want me to surface the top 3 actionable insights from this report?",
  "5": "**Cross-Dataset Quality Assessment**\n\nThis report is still generating. Once complete it will cover:\n\n• Completeness score across all 5 datasets\n• Duplicate detection results\n• Classification confidence distribution\n\nEstimated completion: ~8 minutes. I'll flag you when it's ready. In the meantime, want me to summarize what I know about current data quality issues?",
  "6": "**Northwest College Wave 4 Readiness**\n\nThis report is in draft state — Wave 4 data hasn't been ingested yet.\n\n• **5 pages drafted** from Wave 1-3 historical data\n• Awaiting: Wave 4 upload (due Mar 14)\n• Once ingested, the full comparative report will auto-complete\n\nWant me to summarize what the Wave 1-3 trends are showing so you're prepared for the Wave 4 comparison?",
};

function getReportReply(q: string, contextKey?: string): string {
  const lq = q.toLowerCase();
  const report = REPORTS.find((r) => r.id === contextKey);

  if (report) {
    if (lq.includes("download") || lq.includes("pdf") || lq.includes("export"))
      return `To download **${report.name}** as PDF, click the **Download PDF** button on the card. The report will download as a ${report.format.toUpperCase()} file to your device.`;
    if (lq.includes("recipient") || lq.includes("share") || lq.includes("send"))
      return `**${report.name}** has been shared with ${report.recipients} recipient${report.recipients !== 1 ? "s" : ""}. To add more recipients, use the Share button on the card. Want me to draft a summary email to accompany it?`;
    if (lq.includes("summar") || lq.includes("overview") || lq.includes("summary"))
      return `**${report.name} — Summary**\n\n${report.summary}\n\nThis ${report.pages}-page ${report.format.toUpperCase()} was generated ${report.generatedAt}. Want me to go deeper on any specific section?`;
    if (lq.includes("theme") || lq.includes("topic"))
      return `The key themes in **${report.name}** align with the dataset signals from ${report.datasets.join(", ")}. Based on the data patterns, the dominant topics are resolution expectations, service quality, and user experience. Want the full theme hierarchy?`;
  }

  if (lq.includes("download") || lq.includes("pdf")) {
    return "All ready reports can be downloaded as PDF by clicking **Download PDF** on each card. The download triggers immediately — no login or external service required.";
  }
  if (lq.includes("ready") || lq.includes("available")) {
    const ready = REPORTS.filter((r) => r.status === "ready");
    return `**${ready.length} reports are ready:**\n\n${ready.map((r) => `• ${r.name}`).join("\n")}\n\nClick **Discuss with Asa** on any of them to explore the findings.`;
  }
  if (lq.includes("generat") || lq.includes("creat") || lq.includes("new")) {
    return "Click **Generate Report** in the top right to create a new AI report. You can choose from 6 report types: Executive Summary, Sentiment Analysis, Theme Report, Dataset Comparison, Quality Assessment, or Custom.";
  }
  if (lq.includes("sentiment") || lq.includes("emotion")) {
    return "**Sentiment Summary Across Reports**\n\n• NBC Dispute: 54% negative, stabilizing\n• Houston (Weekly): Anger up 22% from prompt sync issue\n• Austin (Weekly): Stable, no major shifts\n• ECC 2026: Positive trending in academic support\n\nWant me to identify which dataset needs the most attention?";
  }
  return "I can help you explore any report in your library. Click **Discuss with Asa** on a report card to pull it up here, or ask me questions about your overall report landscape.";
}

const COPILOT_CHIPS = [
  "Which reports are ready?",
  "Summarize sentiment trends",
  "How to download as PDF?",
  "What's still generating?",
];

// ── PDF Download Helper ────────────────────────────────────────
function downloadReportAsPdf(report: Report) {
  const content = `REPORT: ${report.name}
Generated: ${report.generatedAt}
Type: ${report.type.toUpperCase()}
Pages: ${report.pages}
Datasets: ${report.datasets.join(", ")}

EXECUTIVE SUMMARY
${report.summary}

---
This is a demo export from Canvs AI.
Report ID: ${report.id}
Format: ${report.format.toUpperCase()}
Recipients: ${report.recipients}
`;
  const blob = new Blob([content], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.name.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Report Detail View (left panel) ───────────────────────────
function ReportDetailView({ report, onBack }: { report: Report; onBack: () => void }) {
  const type = REPORT_TYPE_CONFIG[report.type];

  const mockMetrics: { label: string; value: string; trend: "up" | "down" | "flat"; delta: string }[] = [
    { label: "Positive Sentiment", value: "46%", trend: "up", delta: "+8%" },
    { label: "Negative Sentiment", value: "54%", trend: "down", delta: "-4%" },
    { label: "Top Theme Coverage", value: "38%", trend: "up", delta: "+12%" },
    { label: "Response Volume", value: "2,847", trend: "flat", delta: "0%" },
  ];

  const trendIcon = (t: "up" | "down" | "flat") =>
    t === "up" ? <ArrowUp className="w-3 h-3 text-[#374151]" /> :
    t === "down" ? <ArrowDown className="w-3 h-3 text-[#374151]" /> :
    <Minus className="w-3 h-3 text-[#A4A7AE]" />;

  const themes = [
    { name: "Resolution Expectations", pct: 38 },
    { name: "Communication Quality", pct: 29 },
    { name: "Service Reliability", pct: 24 },
    { name: "Response Time", pct: 18 },
    { name: "Staff Behavior", pct: 14 },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFAF5]/60">
      {/* Report header */}
      <div className="sticky top-0 bg-white border-b border-[#F5F5F5] px-6 py-4 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] text-[#A4A7AE] hover:text-[#414651] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[#111827] truncate">{report.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", type.color)}>
                {type.icon} {type.label}
              </span>
              <span className="text-xs text-[#A4A7AE]">{report.generatedAt}</span>
            </div>
          </div>
          <button
            onClick={() => downloadReportAsPdf(report)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E83069] text-white text-xs font-semibold rounded-xl hover:bg-[#C71E52] transition-all flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Summary */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4">
          <p className="text-xs font-semibold text-[#414651] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#374151]" /> AI Summary
          </p>
          <p className="text-sm text-[#535862] leading-relaxed">{report.summary}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {mockMetrics.map((m) => (
            <div key={m.label} className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#A4A7AE]">{m.label}</p>
                {trendIcon(m.trend)}
              </div>
              <p className="text-xl font-bold text-[#111827]">{m.value}</p>
              <p className={cn("text-xs font-medium mt-0.5",
                m.trend === "up" ? "text-[#374151]" :
                m.trend === "down" ? "text-[#374151]" : "text-[#A4A7AE]"
              )}>{m.delta} vs last period</p>
            </div>
          ))}
        </div>

        {/* Theme Bars */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4">
          <p className="text-xs font-semibold text-[#414651] mb-3">Top Themes</p>
          <div className="space-y-3">
            {themes.map((t, i) => (
              <div key={t.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#535862]">{t.name}</span>
                  <span className="text-xs font-semibold text-[#111827]">{t.pct}%</span>
                </div>
                <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#E83069]"
                    initial={{ width: 0 }}
                    animate={{ width: `${t.pct}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Chart (simplified bars) */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4">
          <p className="text-xs font-semibold text-[#414651] mb-3">Sentiment Distribution</p>
          <div className="flex items-end gap-2 h-24">
            {[
              { label: "Positive", pct: 46, color: "bg-[#D1D5DB]" },
              { label: "Neutral", pct: 28, color: "bg-[#F5F5F5]" },
              { label: "Negative", pct: 26, color: "bg-[#E5E7EB]" },
            ].map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-[#414651]">{b.pct}%</span>
                <motion.div
                  className={cn("w-full rounded-t-lg", b.color)}
                  initial={{ height: 0 }}
                  animate={{ height: `${b.pct * 1.6}px` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <span className="text-[10px] text-[#A4A7AE]">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Datasets */}
        <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-4">
          <p className="text-xs font-semibold text-[#414651] mb-2">Source Datasets</p>
          <div className="flex flex-wrap gap-1.5">
            {report.datasets.map((ds) => (
              <span key={ds} className="text-xs px-2.5 py-1 bg-[#FFFAF5] text-[#535862] rounded-full border border-[#F5F5F5]">{ds}</span>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-5 text-xs text-[#A4A7AE] pb-4">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {report.pages > 0 ? `${report.pages} pages` : "Generating"}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {report.generatedAt}</span>
          {report.recipients > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {report.recipients} recipients</span>}
        </div>
      </div>
    </div>
  );
}

// ── Generate Report Modal ──────────────────────────────────────
function GenerateReportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    type: "",
    datasets: [] as string[],
    format: "pdf",
    includeCharts: true,
    includeThemes: true,
    includeSentiment: true,
    schedule: "now",
    recipients: "",
  });

  const reportTypes = [
    { value: "executive", label: "Executive Summary", desc: "High-level insights for leadership", icon: <Star className="w-5 h-5 text-[#374151]" />, color: "border-[#E5E7EB] hover:border-[#D1D5DB]" },
    { value: "sentiment", label: "Sentiment Analysis", desc: "Deep dive into emotion and tone data", icon: <TrendingUp className="w-5 h-5 text-[#374151]" />, color: "border-[#E5E7EB] hover:border-[#D1D5DB]" },
    { value: "theme", label: "Theme Report", desc: "Emerging topics and cluster analysis", icon: <Sparkles className="w-5 h-5 text-[#4B5563]" />, color: "border-[#E5E7EB] hover:border-[#D1D5DB]" },
    { value: "comparison", label: "Dataset Comparison", desc: "Side-by-side cross-dataset analysis", icon: <Layers className="w-5 h-5 text-[#374151]" />, color: "border-[#E5E7EB] hover:border-[#D1D5DB]" },
    { value: "quality", label: "Quality Assessment", desc: "Data health, completeness, confidence", icon: <BarChart2 className="w-5 h-5 text-[#374151]" />, color: "border-[#E5E7EB] hover:border-[#D1D5DB]" },
    { value: "custom", label: "Custom Report", desc: "Build with your own prompt instructions", icon: <Zap className="w-5 h-5 text-[#374151]" />, color: "border-[#E5E7EB] hover:border-[#D1D5DB]" },
  ];

  const datasets = ["Houston Parking", "Austin Parking", "Versant NBC Dispute", "Northwest College 2026", "ECC 2026 Dashboard", "Ulta dstest"];
  const toggleDataset = (ds: string) =>
    setForm((f) => ({ ...f, datasets: f.datasets.includes(ds) ? f.datasets.filter((d) => d !== ds) : [...f.datasets, ds] }));

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              <h2 className="text-base font-semibold text-[#111827]">Generate Report</h2>
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
                <p className="text-sm font-medium text-[#414651] mb-3">Select report type</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {reportTypes.map((t) => (
                    <button key={t.value} onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                      className={cn("text-left p-3.5 rounded-xl border-2 transition-all bg-white",
                        form.type === t.value ? "border-[#E83069] bg-[#F3F4F6]" : `border-transparent ${t.color} bg-[#FFFAF5]`)}>
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
                  <label className="text-xs font-medium text-[#535862] block mb-1.5">Report Name *</label>
                  <input type="text" placeholder="e.g. Q1 Sentiment Executive Summary" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#E9EAEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E83069]/20 focus:border-[#E83069] transition" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-2">Source Datasets</label>
                  <div className="flex flex-wrap gap-2">
                    {datasets.map((ds) => (
                      <button key={ds} onClick={() => toggleDataset(ds)}
                        className={cn("text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                          form.datasets.includes(ds) ? "bg-[#E83069] text-white border-[#E83069]" : "bg-white text-[#535862] border-[#E9EAEB] hover:border-[#D1D5DB]")}>
                        {ds}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-2">Include sections</label>
                  <div className="space-y-2">
                    {[
                      { key: "includeCharts" as const, label: "Charts & visualizations" },
                      { key: "includeThemes" as const, label: "Theme analysis" },
                      { key: "includeSentiment" as const, label: "Sentiment breakdown" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#FFFAF5] cursor-pointer">
                        <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 rounded accent-[#E83069]" />
                        <span className="text-sm text-[#414651]">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-1.5">Output format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ value: "pdf", label: "PDF", icon: "📄" }, { value: "slides", label: "Slides", icon: "📊" }, { value: "doc", label: "Doc", icon: "📝" }].map((f) => (
                      <button key={f.value} onClick={() => setForm((prev) => ({ ...prev, format: f.value }))}
                        className={cn("p-3 rounded-xl border-2 text-center transition-all",
                          form.format === f.value ? "border-[#E83069] bg-[#F3F4F6]" : "border-[#F5F5F5] hover:border-[#E9EAEB]")}>
                        <div className="text-xl mb-1">{f.icon}</div>
                        <p className="text-xs font-medium text-[#414651]">{f.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-1.5">Schedule</label>
                  <select value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#E9EAEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E83069]/20 bg-white">
                    <option value="now">Generate now</option>
                    <option value="daily">Daily at 8 AM</option>
                    <option value="weekly">Every Monday</option>
                    <option value="monthly">First of month</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#535862] block mb-1.5">Email recipients (optional)</label>
                  <input type="text" placeholder="email@company.com, ..." value={form.recipients}
                    onChange={(e) => setForm((f) => ({ ...f, recipients: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#E9EAEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E83069]/20 focus:border-[#E83069] transition" />
                </div>
                <div className="bg-[#FFFAF5] rounded-xl p-4 border border-[#E5E7EB]">
                  <p className="text-xs font-semibold text-[#111827] mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI will generate</p>
                  <div className="space-y-1 text-xs text-[#535862]">
                    <p>• {form.name || "Untitled report"}</p>
                    <p>• {form.datasets.length} dataset{form.datasets.length !== 1 ? "s" : ""} analyzed</p>
                    <p>• Format: {form.format.toUpperCase()}</p>
                    <p>• Delivery: {form.schedule === "now" ? "Immediately" : form.schedule}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#F5F5F5] flex items-center justify-between">
            <button onClick={() => step > 1 ? setStep((s) => s - 1) : onClose()} className="text-sm text-[#717680] hover:text-[#414651] font-medium">
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={() => step < 3 ? setStep((s) => s + 1) : onClose()}
              disabled={step === 1 && !form.type}
              className={cn("px-5 py-2 text-sm rounded-xl font-semibold transition-all flex items-center gap-2 bg-[#E83069] text-white hover:bg-[#C71E52] shadow-sm hover:shadow-md",
                step === 1 && !form.type ? "opacity-40 cursor-not-allowed" : "")}
            >
              {step === 3 ? <><Sparkles className="w-3.5 h-3.5" /> Generate</> : "Continue"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Report Card ────────────────────────────────────────────────
function ReportCard({
  report,
  onDiscuss,
}: {
  report: Report;
  onDiscuss: (report: Report) => void;
}) {
  const type = REPORT_TYPE_CONFIG[report.type];
  const status = STATUS_CONFIG[report.status];
  const [starred, setStarred] = useState(report.starred);
  const formatIcon = report.format === "pdf" ? "📄" : report.format === "slides" ? "📊" : "📝";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{formatIcon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#111827] truncate">{report.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", type.color)}>
                {type.icon} {type.label}
              </span>
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", status.bg, status.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button onClick={() => setStarred((s) => !s)} className={cn("w-7 h-7 flex items-center justify-center rounded-lg transition-colors", starred ? "text-[#6B7280]" : "text-[#D5D7DA] hover:text-[#A4A7AE]")}>
            <Star className="w-4 h-4" fill={starred ? "currentColor" : "none"} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] text-[#A4A7AE]">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-[#717680] leading-relaxed mb-3">{report.summary}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {report.datasets.map((ds) => (
          <span key={ds} className="text-xs px-2 py-0.5 bg-[#FFFAF5] text-[#535862] rounded-full border border-[#F5F5F5]">{ds}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-[#A4A7AE] mb-4 pt-3 border-t border-[#FAFAFA]">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {report.generatedAt}</span>
        {report.pages > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {report.pages} pages</span>}
        {report.recipients > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {report.recipients} recipients</span>}
      </div>

      <div className="flex items-center gap-2">
        {/* Primary CTA: Discuss with Asa */}
        <button
          onClick={(e) => { e.stopPropagation(); onDiscuss(report); }}
          disabled={report.status !== "ready"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all",
            report.status === "ready"
              ? "bg-[#E83069] text-white hover:bg-[#C71E52]"
              : "bg-[#FFFAF5] text-[#A4A7AE] cursor-not-allowed"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Discuss with Asa
        </button>

        {/* Download PDF */}
        <button
          onClick={(e) => { e.stopPropagation(); if (report.status === "ready") downloadReportAsPdf(report); }}
          disabled={report.status !== "ready"}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl transition-all",
            report.status === "ready"
              ? "bg-[#FFFAF5] text-[#535862] hover:bg-[#F5F5F5]"
              : "bg-[#FFFAF5] text-[#A4A7AE] cursor-not-allowed"
          )}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Share */}
        <button
          disabled={report.status !== "ready"}
          className={cn(
            "flex items-center justify-center py-2 px-3 text-xs font-medium rounded-xl transition-all",
            report.status === "ready"
              ? "bg-[#FFFAF5] text-[#535862] hover:bg-[#F5F5F5]"
              : "bg-[#FFFAF5] text-[#A4A7AE] cursor-not-allowed"
          )}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function ReportsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | Report["type"] | Report["status"]>("all");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filtered = REPORTS.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.datasets.some((d) => d.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === "all" || r.type === filter || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: "Total Reports", value: REPORTS.length, icon: FileText, color: "text-[#374151]", bg: "bg-[#FFFAF5]" },
    { label: "Ready", value: REPORTS.filter((r) => r.status === "ready").length, icon: CheckCircle, color: "text-[#374151]", bg: "bg-[#F3F4F6]" },
    { label: "Generating", value: REPORTS.filter((r) => r.status === "generating").length, icon: RefreshCw, color: "text-[#4B5563]", bg: "bg-[#FFFAF5]" },
    { label: "Starred", value: REPORTS.filter((r) => r.starred).length, icon: Star, color: "text-[#6B7280]", bg: "bg-[#F3F4F6]" },
  ];

  const filterTabs = [
    { label: "All", value: "all" },
    { label: "Executive", value: "executive" },
    { label: "Sentiment", value: "sentiment" },
    { label: "Comparison", value: "comparison" },
    { label: "Theme", value: "theme" },
    { label: "Ready", value: "ready" },
    { label: "Drafts", value: "draft" },
  ] as const;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#FFFAF5]/60">
      <Header />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Left Panel — Copilot (35%) ────────────────────── */}
        <div className="w-[36%] min-w-[340px] max-w-[500px] flex-shrink-0 flex flex-col overflow-hidden border-r border-[#E9EAEB] shadow-[8px_0_24px_rgba(10,13,18,0.06)]">
          <PersistentCopilot
            key="reports-copilot"
            initialMessages={INITIAL_COPILOT_MSGS}
            chips={COPILOT_CHIPS}
            getReply={getReportReply}
            contextKey={selectedReport?.id}
            contextMessage={selectedReport ? REPORT_CONTEXT_MESSAGES[selectedReport.id] : undefined}
            onReset={() => setSelectedReport(null)}
          />
        </div>

        {/* ── Right Panel (65%) ─────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <ReportDetailView report={selectedReport} onBack={() => setSelectedReport(null)} />
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
                      <h1 className="text-2xl font-bold text-[#111827]">Reports</h1>
                      <p className="text-sm text-[#717680] mt-1">AI-generated analyses, summaries, and executive presentations</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setShowModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#E83069] text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-[#C71E52] hover:shadow-md transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Report
                    </motion.button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3 mt-5">
                    {stats.map((s) => (
                      <div key={s.label} className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-3.5 flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                          <s.icon className={cn("w-4 h-4", s.color)} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#111827]">{s.value}</p>
                          <p className="text-xs text-[#A4A7AE]">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Search + Filter */}
                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-[#E9EAEB] shadow-sm">
                      <Search className="w-4 h-4 text-[#A4A7AE]" />
                      <input type="text" placeholder="Search reports..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="text-sm bg-transparent outline-none text-[#414651] placeholder:text-[#A4A7AE] w-40" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {filterTabs.map((f) => (
                        <button key={f.value} onClick={() => setFilter(f.value)}
                          className={cn("px-3 py-1.5 text-xs rounded-xl font-medium transition-all",
                            filter === f.value ? "bg-[#E83069] text-white shadow-sm" : "bg-white text-[#717680] border border-[#E9EAEB] hover:border-[#D1D5DB] hover:text-[#1F2937]")}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reports Grid */}
                <div className="flex-1 overflow-y-auto px-6 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((report) => (
                      <ReportCard key={report.id} report={report} onDiscuss={(r) => setSelectedReport(r)} />
                    ))}
                  </div>
                  {filtered.length === 0 && (
                    <div className="text-center py-20">
                      <FileText className="w-10 h-10 text-[#D5D7DA] mx-auto mb-3" />
                      <p className="text-[#717680] font-medium">No reports found</p>
                      <p className="text-[#A4A7AE] text-sm mt-1">Try a different filter or generate a new report</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {showModal && <GenerateReportModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
