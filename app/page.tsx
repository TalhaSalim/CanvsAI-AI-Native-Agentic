"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion";
import { useSearchParams } from "next/navigation";
import SharedHeader from "./components/Header";
import FloatingCopilot from "./components/FloatingCopilot";
import LoadingScreen from "./components/LoadingScreen";
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  Plus,
  Upload,
  Bot,
  GitCompare,
  FileText,
  Activity,
  AlertTriangle,
  Clock,
  Database,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ArrowRight,
  MoreHorizontal,
  Shield,
  RefreshCw,
  Filter,
  Layers,
  Flame,
  Target,
  AlertCircle,
  Pause,
  GitMerge,
  Send,
  ChevronRight,
  Loader2,
  Hash,
  Inbox,
  Flag,
  Play,
  Lightbulb,
  SlidersHorizontal,
  CheckCircle,
  Timer,
  Zap,
  BarChart2,
  X,
  Mic,
  MicOff,
  ChevronLeft,
  TrendingDown,
  ExternalLink,
  Star,
  Menu,
  ChevronsUpDown,
  Maximize2,
  MoreVertical,
  Download,
  Users,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Dataset {
  id: string;
  name: string;
  status: "active" | "processing" | "needs_review" | "archived";
  source: string;
  owner: string;
  ownerInitials: string;
  responses: number;
  questions: number;
  waves: number;
  emotionRate: number;
  sentiment: { positive: number; negative: number; neutral: number };
  aiSummary: string;
  topThemes: string[];
  risks: string[];
  lastUpdated: string;
  badge?: string;
  badgeType?: "insight" | "missing" | "healthy" | "testing" | "stable";
}

interface InsightItem {
  id: string;
  type: "spike" | "missing" | "emerging" | "suggestion" | "report" | "anomaly";
  title: string;
  description: string;
  dataset: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
  actionLabel: string;
}

interface AgentData {
  id: string;
  name: string;
  description: string;
  status: "running" | "scheduled" | "idle" | "paused";
  lastRun: string;
  schedule: string;
  datasets: number;
  iconKey: string;
}

interface ActivityItem {
  id: string;
  type: "upload" | "insight" | "report" | "anomaly" | "comparison" | "agent";
  description: string;
  dataset: string;
  timestamp: string;
  user?: string;
}

type PanelMode = "dataset" | "compare" | "report" | "agent";

interface PanelState {
  mode: PanelMode;
  dataset?: Dataset;
}

interface PanelChatMsg {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

type CopilotCtx = "default" | "dataset" | "compare" | "report" | "agent";

interface CopilotCtxData {
  context: CopilotCtx;
  dataset?: Dataset;
  datasets?: Dataset[];
}

interface CopilotMsg {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  proactive?: boolean;
  richCard?: "dataset";
  richDataset?: Dataset;
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const DATASETS: Dataset[] = [
  {
    id: "1",
    name: "Houston Parking — After Prompt Sync",
    status: "needs_review",
    source: "Survey Platform",
    owner: "J. Martinez",
    ownerInitials: "JM",
    responses: 2847,
    questions: 12,
    waves: 3,
    emotionRate: 78,
    sentiment: { positive: 31, negative: 48, neutral: 21 },
    aiSummary:
      "Significant increase in anger sentiment (22%) following the April prompt sync. Payment app confusion is emerging as a dominant theme, particularly among 45+ users.",
    topThemes: ["Payment confusion", "Wait time frustration", "App usability", "Staff interaction"],
    risks: ["Anger sentiment spike +22%", "Wave 3 data may be skewed"],
    lastUpdated: "2 hours ago",
    badge: "New Insight",
    badgeType: "insight",
  },
  {
    id: "2",
    name: "Versant NBC Dispute",
    status: "active",
    source: "Canvs Upload",
    owner: "A. Chen",
    ownerInitials: "AC",
    responses: 5312,
    questions: 8,
    waves: 2,
    emotionRate: 64,
    sentiment: { positive: 22, negative: 52, neutral: 26 },
    aiSummary:
      "Sentiment has stabilized following media coverage normalization. Primary concerns remain around contract transparency, though anger levels have decreased 18% from peak.",
    topThemes: ["Contract fairness", "Media coverage", "Brand trust", "Resolution expectations"],
    risks: ["Ongoing negative bias: 52%"],
    lastUpdated: "1 day ago",
    badge: "Stable",
    badgeType: "stable",
  },
  {
    id: "3",
    name: "Northwest College 2026 Qualitative",
    status: "needs_review",
    source: "Qualtrics",
    owner: "S. Park",
    ownerInitials: "SP",
    responses: 1203,
    questions: 18,
    waves: 3,
    emotionRate: 55,
    sentiment: { positive: 58, negative: 24, neutral: 18 },
    aiSummary:
      "Wave 4 responses are missing — collection may have stalled. Available data shows strong positive sentiment around campus experience with concerns about financial aid clarity.",
    topThemes: ["Campus experience", "Financial aid", "Faculty quality", "Career services"],
    risks: ["Missing Wave 4 data", "Sample size below target"],
    lastUpdated: "3 days ago",
    badge: "Missing Data",
    badgeType: "missing",
  },
  {
    id: "4",
    name: "ECC 2026 Qualitative Dashboard",
    status: "active",
    source: "Qualtrics",
    owner: "M. Torres",
    ownerInitials: "MT",
    responses: 4891,
    questions: 15,
    waves: 4,
    emotionRate: 71,
    sentiment: { positive: 64, negative: 21, neutral: 15 },
    aiSummary:
      "Strong positive trend with high emotion classification confidence. Academic quality and faculty responsiveness are top drivers. Minor concerns around facilities.",
    topThemes: ["Academic quality", "Faculty support", "Facilities", "Student community"],
    risks: [],
    lastUpdated: "5 hours ago",
    badge: "Healthy",
    badgeType: "healthy",
  },
  {
    id: "5",
    name: "Ulta dstest — Take 3",
    status: "processing",
    source: "Direct Upload",
    owner: "T. Williams",
    ownerInitials: "TW",
    responses: 312,
    questions: 6,
    waves: 1,
    emotionRate: 42,
    sentiment: { positive: 45, negative: 33, neutral: 22 },
    aiSummary:
      "Small test dataset currently being processed. Early signals show product satisfaction themes. Classification confidence is moderate — may need more data.",
    topThemes: ["Product quality", "Price point", "Brand perception"],
    risks: ["Low sample size", "Moderate confidence only"],
    lastUpdated: "Processing...",
    badge: "Testing",
    badgeType: "testing",
  },
];

const INSIGHTS: InsightItem[] = [
  {
    id: "1",
    type: "spike",
    title: "Anger Sentiment Spike Detected",
    description:
      "Houston Parking shows a 22% increase in anger sentiment following the April prompt sync. Largest emotion shift in 90 days.",
    dataset: "Houston Parking",
    timestamp: "12 min ago",
    priority: "high",
    actionLabel: "Investigate",
  },
  {
    id: "2",
    type: "missing",
    title: "Missing Wave 4 Responses",
    description:
      "Northwest College 2026 is missing Wave 4 data. Expected 400+ responses not collected. Collection may have stalled.",
    dataset: "Northwest College",
    timestamp: "1 hour ago",
    priority: "high",
    actionLabel: "Alert Team",
  },
  {
    id: "3",
    type: "emerging",
    title: "Emerging Theme: Payment App Confusion",
    description:
      '"Payment app confusion" has emerged as a new theme in Houston Parking data, appearing in 34% of negative verbatims across wave 3.',
    dataset: "Houston Parking",
    timestamp: "2 hours ago",
    priority: "medium",
    actionLabel: "Explore Theme",
  },
  {
    id: "4",
    type: "suggestion",
    title: "Cross-Dataset Opportunity Detected",
    description:
      "62% thematic overlap found between Houston Parking and Austin Parking datasets. AI recommends a comparative analysis.",
    dataset: "Multiple Datasets",
    timestamp: "3 hours ago",
    priority: "medium",
    actionLabel: "Compare Now",
  },
  {
    id: "5",
    type: "report",
    title: "Executive Report Draft Ready",
    description:
      "AI has prepared a preliminary executive summary for NBC Dispute dataset. Estimated quality score: 87/100.",
    dataset: "Versant NBC Dispute",
    timestamp: "5 hours ago",
    priority: "low",
    actionLabel: "Review Draft",
  },
  {
    id: "6",
    type: "anomaly",
    title: "Classification Confidence Low",
    description:
      "Ulta dstest has 28% of responses below confidence threshold. Manual review or additional labeling may be needed.",
    dataset: "Ulta dstest",
    timestamp: "8 hours ago",
    priority: "low",
    actionLabel: "Review",
  },
];

const AGENTS: AgentData[] = [
  {
    id: "1",
    name: "Sentiment Monitor",
    description:
      "Continuously tracks emotion and sentiment shifts across all active datasets, alerting when thresholds are exceeded.",
    status: "running",
    lastRun: "2 min ago",
    schedule: "Every 15 minutes",
    datasets: 4,
    iconKey: "activity",
  },
  {
    id: "2",
    name: "Theme Discovery",
    description:
      "Automatically identifies emerging and declining themes across datasets, clustering verbatims into meaningful topics.",
    status: "scheduled",
    lastRun: "6 hours ago",
    schedule: "Daily at 6 AM",
    datasets: 5,
    iconKey: "layers",
  },
  {
    id: "3",
    name: "Data Quality Agent",
    description:
      "Monitors data completeness, detects duplicates, flags low-confidence classifications, and identifies collection anomalies.",
    status: "running",
    lastRun: "14 min ago",
    schedule: "Continuous",
    datasets: 5,
    iconKey: "shield",
  },
  {
    id: "4",
    name: "Weekly Report Generator",
    description:
      "Automatically compiles weekly insight summaries for each active dataset and distributes to stakeholders.",
    status: "scheduled",
    lastRun: "6 days ago",
    schedule: "Every Monday 9 AM",
    datasets: 3,
    iconKey: "file-text",
  },
];

const ACTIVITIES: ActivityItem[] = [
  { id: "1",  type: "insight",    description: "Anger sentiment spike detected — up 22% post prompt sync",                 dataset: "Houston Parking",         timestamp: "12 min ago",   user: "AI" },
  { id: "2",  type: "upload",     description: "847 new responses ingested and classified in real-time",                   dataset: "ECC 2026 Dashboard",      timestamp: "1 hr ago",     user: "M. Torres" },
  { id: "3",  type: "agent",      description: "Sentiment Monitor fired alert: threshold breach on anger >20%",            dataset: "Houston Parking",         timestamp: "1 hr ago",     user: "Sentinel Agent" },
  { id: "4",  type: "comparison", description: "Houston vs Austin comparison queued — 62% thematic overlap flagged",       dataset: "Houston + Austin Parking", timestamp: "2 hrs ago",   user: "AI" },
  { id: "5",  type: "report",     description: "Executive summary draft created with 87% confidence score",                dataset: "Versant NBC Dispute",     timestamp: "5 hrs ago",    user: "AI" },
  { id: "6",  type: "insight",    description: "New emerging theme detected: 'Payment app confusion' in 34% of negatives", dataset: "Houston Parking",         timestamp: "6 hrs ago",    user: "AI" },
  { id: "7",  type: "anomaly",    description: "Classification confidence below threshold on 28% of new responses",        dataset: "Ulta dstest",             timestamp: "8 hrs ago",    user: "Quality Agent" },
  { id: "8",  type: "upload",     description: "Test dataset uploaded — Wave 1 processing initiated",                      dataset: "Ulta dstest",             timestamp: "10 hrs ago",   user: "T. Williams" },
  { id: "9",  type: "agent",      description: "Data Quality Agent flagged 14 duplicate verbatims for review",             dataset: "ECC 2026 Dashboard",      timestamp: "12 hrs ago",   user: "Quality Agent" },
  { id: "10", type: "insight",    description: "NBC Dispute sentiment stabilizing — anger down 18% from peak",             dataset: "Versant NBC Dispute",     timestamp: "14 hrs ago",   user: "AI" },
  { id: "11", type: "comparison", description: "ECC vs Northwest College: 44% academic theme overlap confirmed",           dataset: "ECC + Northwest College", timestamp: "1 day ago",    user: "AI" },
  { id: "12", type: "report",     description: "Weekly insight digest distributed to 5 stakeholders",                      dataset: "All datasets",            timestamp: "1 day ago",    user: "Report Agent" },
  { id: "13", type: "upload",     description: "Wave 3 responses received — 1,203 responses processed",                   dataset: "Northwest College 2026",  timestamp: "2 days ago",   user: "S. Park" },
  { id: "14", type: "agent",      description: "Theme Discovery completed weekly scan — 6 new themes surfaced",            dataset: "All datasets",            timestamp: "2 days ago",   user: "Agent" },
  { id: "15", type: "insight",    description: "Cross-dataset digital confusion signal rising across 3 datasets",          dataset: "Multiple",                timestamp: "3 days ago",   user: "AI" },
  { id: "16", type: "anomaly",    description: "Survey data spike on March 8 — possible bot responses flagged",            dataset: "ECC 2026 Dashboard",      timestamp: "4 days ago",   user: "Quality Agent" },
];

const PROMPT_SUGGESTIONS = [
  "Why is Houston Parking sentiment negative this week?",
  "Compare Northwest College vs ECC sentiment trends",
  "What emerging themes span all datasets?",
  "Generate executive summary for NBC Dispute",
];

// ─────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────

function BoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-[#1A1A1A]">{part.slice(2, -2)}</strong>;
        }
        return part.split("\n").map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
        ));
      })}
    </>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────
// SMALL HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────

function LivePulse({ label = "Live", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-[#F5F5F5] text-[#111111] border border-[#CCCCCC]", className)}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#666666] opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#333333]" />
      </span>
      {label}
    </span>
  );
}

function AIBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-white text-[#e83069] border border-[#e83069]">
      <Sparkles className="w-3 h-3" />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: Dataset["status"] }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-white text-[#333333] border-[#E2E2E2]" },
    processing: { label: "Processing", cls: "bg-white text-[#2A2A2A] border-[#E2E2E2]" },
    needs_review: { label: "Needs Review", cls: "bg-white text-[#444444] border-[#E2E2E2]" },
    archived: { label: "Archived", cls: "bg-[#FFFAF5] text-[#444444] border-[#E2E2E2]" },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border", cls)}>
      {status === "processing" && <Loader2 className="w-3 h-3 animate-spin text-[#22c55e]" />}
      {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
      {status === "needs_review" && <AlertCircle className="w-3 h-3 text-[#ef4444]" />}
      {label}
    </span>
  );
}

function DatasetBadge({ badge, type }: { badge: string; type?: Dataset["badgeType"] }) {
  const cls =
    type === "insight" ? "bg-[#E8E8E8] text-[#444444] border-[#AAAAAA]" :
    type === "missing" ? "bg-[#F7F7F7] text-[#444444] border-[#F0F0F0]" :
    type === "healthy" ? "bg-[#F2F2F2] text-[#333333] border-[#DDDDDD]" :
    type === "testing" ? "bg-[#EEEEEE] text-[#2A2A2A] border-[#888888]" :
    "bg-[#FFFAF5] text-[#444444] border-[#E2E2E2]";
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border", cls)}>
      {badge}
    </span>
  );
}

function SentimentBar({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-[#666666]">
        <span>Sentiment</span>
        <div className="flex gap-3">
          <span style={{ color: "#10b981" }} className="font-semibold">+{positive}%</span>
          <span style={{ color: "#ef4444" }} className="font-semibold">−{negative}%</span>
          <span style={{ color: "#68a3ff" }} className="font-semibold">{neutral}%</span>
        </div>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px bg-[#F5F5F5]">
        <motion.div
          className="rounded-l-full"
          style={{ backgroundColor: "#10b981" }}
          initial={{ width: 0 }}
          animate={{ width: `${positive}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
        />
        <motion.div
          style={{ backgroundColor: "#ef4444" }}
          initial={{ width: 0 }}
          animate={{ width: `${negative}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
        />
        <motion.div
          className="rounded-r-full"
          style={{ backgroundColor: "#68a3ff" }}
          initial={{ width: 0 }}
          animate={{ width: `${neutral}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
        />
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  badge,
  action,
}: {
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#1A1A1A]">{title}</h2>
          <p className="text-xs text-[#666666]">{subtitle}</p>
        </div>
        {badge}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────

// Header is now the shared component imported from ./components/Header
const Header = SharedHeader;

// ─────────────────────────────────────────────────────────────
// AI COMMAND CENTER
// ─────────────────────────────────────────────────────────────

function AICommandCenter({ onOpenPanel }: { onOpenPanel: (state: PanelState) => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="bg-gradient-to-b from-[#FFEEDD] via-[#FFF5EE] to-[#FFFAF5] pt-8 pb-0 border-b border-[#F5F5F5]">
      <div className="max-w-[1600px] mx-auto px-6">
        {/* Action bar */}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// INSIGHT FEED
// ─────────────────────────────────────────────────────────────

const insightTypeCfg = {
  spike:      { icon: TrendingUp,   color: "text-[#e83069]", bg: "bg-white shadow-sm border border-[#E2E2E2]", border: "border-[#EEEEEE]",   label: "Sentiment Spike" },
  missing:    { icon: AlertTriangle, color: "text-[#ef4444]", bg: "bg-white shadow-sm border border-[#E2E2E2]", border: "border-[#F0F0F0]",  label: "Missing Data" },
  emerging:   { icon: Flame,         color: "text-[#f59e0b]", bg: "bg-white shadow-sm border border-[#E2E2E2]", border: "border-[#E0E0E0]", label: "Emerging Theme" },
  suggestion: { icon: Lightbulb,     color: "text-[#6366f1]", bg: "bg-white shadow-sm border border-[#E2E2E2]", border: "border-[#DDDDDD]", label: "AI Suggestion" },
  report:     { icon: FileText,       color: "text-[#0ea5e9]", bg: "bg-white shadow-sm border border-[#E2E2E2]", border: "border-[#AAAAAA]", label: "Report Ready" },
  anomaly:    { icon: AlertCircle,    color: "text-[#f97316]", bg: "bg-white shadow-sm border border-[#E2E2E2]", border: "border-[#E2E2E2]",  label: "Anomaly" },
};

const priorityCfg = {
  high:   "bg-white text-[#333333] border-[#E2E2E2]",
  medium: "bg-white text-[#555555] border-[#E2E2E2]",
  low:    "bg-white text-[#666666] border-[#E2E2E2]",
};

function InsightCard({ item, onClick }: { item: InsightItem; onClick?: (item: InsightItem) => void }) {
  const cfg = insightTypeCfg[item.type];
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.1)" }}
      onClick={() => onClick?.(item)}
      className="bg-white rounded-2xl border border-[#F5F5F5] p-4 flex flex-col gap-3 min-w-[280px] max-w-[300px] flex-shrink-0 cursor-pointer shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
          <cfg.icon className={cn("w-4 h-4", cfg.color)} />
        </div>
        <span className={cn("text-xs px-1.5 py-0.5 rounded-full border font-medium", priorityCfg[item.priority])}>
          {item.priority}
        </span>
      </div>
      <div>
        <div className={cn("text-xs font-semibold mb-1", cfg.color)}>{cfg.label}</div>
        <div className="text-sm font-semibold text-[#222222] leading-snug mb-1.5">{item.title}</div>
        <p className="text-xs text-[#666666] leading-relaxed line-clamp-3">{item.description}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#FAFAFA]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c55e]" />
          </span>
          <span className="text-xs text-[#999999] truncate">{item.dataset}</span>
        </div>
        <span className="text-xs text-[#999999] flex-shrink-0">{item.timestamp}</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// DATASET INSIGHT MODAL — realtime animated charts
// ─────────────────────────────────────────────────────────────

function DatasetInsightModal({ insight, onClose }: { insight: InsightItem; onClose: () => void }) {
  const baseDataset = DATASETS.find(d =>
    d.name.toLowerCase().includes(insight.dataset.split(" ")[0].toLowerCase())
  ) ?? DATASETS[0];

  const [sentiment, setSentiment] = useState({
    positive: baseDataset.sentiment.positive,
    negative: baseDataset.sentiment.negative,
    neutral:  baseDataset.sentiment.neutral,
  });
  const [emotionRate, setEmotionRate]     = useState(baseDataset.emotionRate);
  const [responseCount, setResponseCount] = useState(baseDataset.responses);
  const [wavePoints, setWavePoints]       = useState<number[]>([32, 41, 38, 50, 44, 47, 53, 49]);
  const [liveEvents, setLiveEvents]       = useState<Array<{ id: string; text: string; kind: string }>>([]);

  useEffect(() => {
    const eventMessages = [
      { text: "New response classified: Anger",         kind: "alert"   },
      { text: "Theme cluster updated: Payment App",     kind: "info"    },
      { text: "Confidence score recalculated",          kind: "info"    },
      { text: "Wave 3 batch fully processed",           kind: "success" },
      { text: "Anomaly detected in verbatim cluster",   kind: "alert"   },
      { text: "Emotion label: Frustration (+12%)",      kind: "alert"   },
      { text: "Cross-dataset signal detected",          kind: "info"    },
      { text: "New response: Joy sentiment",            kind: "success" },
      { text: "Classification threshold adjusted",      kind: "info"    },
      { text: "Sentiment spike confirmed",              kind: "alert"   },
    ];
    let eventIdx = 0;

    const sentimentTimer = setInterval(() => {
      setSentiment(prev => ({
        positive: Math.max(5, Math.min(90, prev.positive + (Math.random() - 0.48) * 3.5)),
        negative: Math.max(5, Math.min(90, prev.negative + (Math.random() - 0.52) * 2.8)),
        neutral:  Math.max(5, Math.min(90, prev.neutral  + (Math.random() - 0.5)  * 2.0)),
      }));
    }, 1400);

    const emotionTimer = setInterval(() => {
      setEmotionRate(prev => Math.max(40, Math.min(97, prev + (Math.random() - 0.5) * 3)));
    }, 1800);

    const responseTimer = setInterval(() => {
      setResponseCount(prev => prev + Math.floor(Math.random() * 4 + 1));
    }, 2200);

    const waveTimer = setInterval(() => {
      setWavePoints(prev => [...prev.slice(1), Math.floor(28 + Math.random() * 42)]);
    }, 700);

    const eventTimer = setInterval(() => {
      const ev = eventMessages[eventIdx % eventMessages.length];
      eventIdx++;
      setLiveEvents(prev => [{ id: Date.now().toString(), text: ev.text, kind: ev.kind }, ...prev].slice(0, 6));
    }, 1800);

    return () => {
      clearInterval(sentimentTimer);
      clearInterval(emotionTimer);
      clearInterval(responseTimer);
      clearInterval(waveTimer);
      clearInterval(eventTimer);
    };
  }, []);

  const cfg = insightTypeCfg[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
              <cfg.icon className={cn("w-5 h-5", cfg.color)} />
            </div>
            <div>
              <div className={cn("text-xs font-semibold mb-0.5", cfg.color)}>{cfg.label}</div>
              <h2 className="text-base font-bold text-[#1A1A1A] leading-tight">{insight.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F0FDF4] rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c55e]" />
              </span>
              <span className="text-xs font-semibold text-[#16a34a]">Live</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#F5F5F5] hover:bg-[#EBEBEB] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-[#555555]" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-5">

            {/* ── Left column ── */}
            <div className="space-y-4">

              {/* Insight description */}
              <div className="bg-[#FAFAFA] rounded-2xl p-4 border border-[#F0F0F0]">
                <p className="text-sm text-[#444444] leading-relaxed">{insight.description}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#EEEEEE]">
                  <span className="text-xs text-[#999999]">Dataset: <span className="font-medium text-[#333333]">{insight.dataset}</span></span>
                  <span className="text-xs text-[#BBBBBB]">{insight.timestamp}</span>
                </div>
              </div>

              {/* Realtime sentiment bars */}
              <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-[#222222] flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-[#666666]" /> Sentiment Breakdown
                  </div>
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-[10px] font-medium text-[#22c55e]"
                  >↻ live</motion.span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Positive", val: sentiment.positive, from: "#22c55e", to: "#16a34a", text: "text-[#16a34a]" },
                    { label: "Negative", val: sentiment.negative, from: "#ef4444", to: "#dc2626", text: "text-[#dc2626]" },
                    { label: "Neutral",  val: sentiment.neutral,  from: "#94a3b8", to: "#64748b", text: "text-[#64748b]" },
                  ].map(({ label, val, from, to, text }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-[#666666] w-14">{label}</span>
                      <div className="flex-1 h-2.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(to right, ${from}, ${to})` }}
                          animate={{ width: `${Math.round(val)}%` }}
                          transition={{ duration: 0.9, ease: "easeInOut" }}
                        />
                      </div>
                      <motion.span
                        key={Math.round(val)}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("text-xs font-bold w-8 text-right", text)}
                      >{Math.round(val)}%</motion.span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emotion rate */}
              <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#222222]">Emotion Classification Rate</span>
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="text-sm font-bold text-[#e83069]"
                  >{Math.round(emotionRate)}%</motion.span>
                </div>
                <div className="h-3 bg-[#F5F5F5] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(to right, #e83069, #f97316)" }}
                    animate={{ width: `${Math.round(emotionRate)}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                </div>
                <p className="text-[10px] text-[#AAAAAA] mt-1.5">
                  {Math.round(emotionRate)}% of responses contain classifiable emotion signals
                </p>
              </div>

              {/* Live response counter */}
              <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
                <div className="text-xs font-semibold text-[#222222] mb-2">Live Responses</div>
                <div className="flex items-end gap-1.5">
                  <motion.span
                    key={responseCount}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-3xl font-bold text-[#1A1A1A] tabular-nums"
                  >{responseCount.toLocaleString()}</motion.span>
                  <span className="text-sm text-[#999999] pb-0.5">responses</span>
                </div>
                <p className="text-[10px] text-[#BBBBBB] mt-1">Classified and processed in realtime</p>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-4">

              {/* Waveform sparkline */}
              <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#222222]">Live Signal Stream</span>
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="text-[10px] font-semibold text-[#e83069]"
                  >● streaming</motion.span>
                </div>
                <div className="flex items-end gap-0.5 h-20">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {wavePoints.map((val, i) => (
                      <motion.div
                        key={`${i}-${val}`}
                        layout
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.25 }}
                        style={{ height: `${val * 1.8}px`, transformOrigin: "bottom" }}
                        className={cn(
                          "flex-1 rounded-sm",
                          i === wavePoints.length - 1 ? "bg-[#e83069]"
                          : i >= wavePoints.length - 3 ? "bg-[#f97316] opacity-80"
                          : "bg-[#E8E8E8]"
                        )}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Theme intensity */}
              <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
                <div className="text-xs font-semibold text-[#222222] mb-3">Theme Intensity</div>
                <div className="space-y-2.5">
                  {baseDataset.topThemes.map((theme, i) => {
                    const base = 88 - i * 14;
                    return (
                      <div key={theme} className="flex items-center gap-2">
                        <span className="text-xs text-[#444444] w-32 truncate">{theme}</span>
                        <div className="flex-1 h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: "linear-gradient(to right, #e83069, #f97316)" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${base}%` }}
                            transition={{ duration: 1.2, delay: i * 0.12, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-xs text-[#999999] w-8 text-right">{base}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live event stream */}
              <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#222222]">Event Stream</span>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e83069] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#e83069]" />
                  </span>
                </div>
                <div className="space-y-1.5 min-h-[96px]">
                  <AnimatePresence initial={false}>
                    {liveEvents.map(ev => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 text-xs py-0.5"
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          ev.kind === "alert"   ? "bg-[#ef4444]"
                          : ev.kind === "success" ? "bg-[#22c55e]"
                          : "bg-[#f97316]"
                        )} />
                        <span className="text-[#333333] flex-1 leading-tight">{ev.text}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {liveEvents.length === 0 && (
                    <p className="text-xs text-[#CCCCCC]">Waiting for events…</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InsightFeed({ onAction }: { onAction?: (item: InsightItem) => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-6 bg-white border-b border-[#F5F5F5]">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E83069] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Live Insight Feed</h2>
              <p className="text-xs text-[#666666]">Proactive AI findings across all datasets</p>
            </div>
            <LivePulse />
          </div>
          <button className="text-xs text-[#666666] hover:text-[#333333] flex items-center gap-1 transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
        >
          {INSIGHTS.map((item) => (
            <InsightCard key={item.id} item={item} onClick={onAction} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// PLATFORM ICONS
// ─────────────────────────────────────────────────────────────

type PlatformKey = "twitter" | "reddit" | "tiktok" | "netflix" | "appletv" | "hbomax" | "facebook" | "youtube";

const PLATFORM_LIST: PlatformKey[] = ["twitter", "reddit", "tiktok", "netflix", "appletv", "hbomax", "facebook", "youtube"];

function getPlatform(datasetId: string): PlatformKey {
  const seed = datasetId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PLATFORM_LIST[seed % PLATFORM_LIST.length];
}

function PlatformIcon({ datasetId }: { datasetId: string }) {
  const platform = getPlatform(datasetId);
  const configs: Record<PlatformKey, { bg: string; node: React.ReactNode }> = {
    twitter: {
      bg: "#000000",
      node: (
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    reddit: {
      bg: "#FF4500",
      node: (
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      ),
    },
    tiktok: {
      bg: "#010101",
      node: (
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l-.01-8.29a8.12 8.12 0 0 0 4.74 1.51V5.08a4.84 4.84 0 0 1-1-.39z" />
        </svg>
      ),
    },
    netflix: {
      bg: "#E50914",
      node: (
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.988a66.003 66.003 0 0 0 3.624.006L8.882.006H5.398zm.875 0l8.015 24H17.6C19.951 24 22 22.83 22 21.257V2.743C22 1.17 20.951 0 18.6 0h-5.253v.006c1.688 4.773 3.37 9.547 4.943 14.32V0H7.574zm-2.176 0H2.015C.567 0 0 1.17 0 2.743v18.514C0 22.83.567 24 2.015 24h1.38L3.4 23.994C2.43 21.315 1.386 18.5.414 15.606V24h3.046l.638-1.88V0z" />
        </svg>
      ),
    },
    appletv: {
      bg: "#1C1C1E",
      node: (
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
        </svg>
      ),
    },
    hbomax: {
      bg: "#6C2FAF",
      node: (
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M1 2.5h4v7.75h4V2.5h4v18.25h-4v-7.5H5v7.5H1zm12 0h4l2.5 7 2.5-7h4l-4.5 9.125L23.5 20.75h-4L17 13.625 14.5 20.75h-4l4.5-9.125z" />
        </svg>
      ),
    },
    facebook: {
      bg: "#1877F2",
      node: (
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    youtube: {
      bg: "#FF0000",
      node: (
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
          <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
        </svg>
      ),
    },
  };
  const cfg = configs[platform];
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.node}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DATASET CARD
// ─────────────────────────────────────────────────────────────

function DatasetCard({ dataset, index, isSelected, onSelect, onAsk, onCompare, onReport, onAgent }: {
  dataset: Dataset;
  index: number;
  isSelected?: boolean;
  onSelect?: (d: Dataset) => void;
  onAsk?: (d: Dataset) => void;
  onCompare?: (d: Dataset) => void;
  onReport?: (d: Dataset) => void;
  onAgent?: (d: Dataset) => void;
}) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const dropItems = [
    { icon: MessageSquare, label: "Ask About Dataset", action: () => { onAsk?.(dataset); setDropOpen(false); } },
    { icon: GitCompare,    label: "Compare Datasets",  action: () => { onCompare?.(dataset); setDropOpen(false); } },
    { icon: FileText,      label: "Generate Report",   action: () => { onReport?.(dataset); setDropOpen(false); } },
    { icon: Bot,           label: "Configure Agent",   action: () => { onAgent?.(dataset); setDropOpen(false); } },
    null, // divider
    { icon: ExternalLink,  label: "View Full Details", action: () => { onSelect?.(dataset); setDropOpen(false); } },
    { icon: RefreshCw,     label: "Refresh Data",      action: () => { setDropOpen(false); } },
  ];

  return (
    <motion.div
      variants={fadeInUp}
      onClick={() => onSelect?.(dataset)}
      whileHover={{ y: -3, boxShadow: isSelected ? "0 0 0 3px rgba(232,48,105,0.2),0 16px 32px rgba(232,48,105,0.15)" : "0 20px 40px rgba(0,0,0,0.08)" }}
      className={cn(
        "rounded-2xl border shadow-sm overflow-hidden flex flex-col cursor-pointer transition-all duration-200 h-full",
        isSelected
          ? "bg-gradient-to-b from-[#FFFAF5] to-white border-[#E83069] shadow-[0_0_0_3px_rgba(232,48,105,0.12)]"
          : "bg-white border-[#F5F5F5]"
      )}
    >
      {isSelected && (
        <div className="h-0.5 w-full bg-gradient-to-r from-[#555555] via-[#333333] to-[#555555]" />
      )}
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <PlatformIcon datasetId={dataset.id} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#1A1A1A] leading-tight truncate">{dataset.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-[#999999]">{dataset.source}</span>
                <span className="text-[#E2E2E2] text-xs">·</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#AAAAAA] to-[#888888] flex items-center justify-center text-white text-[9px] font-bold">
                    {dataset.ownerInitials[0]}
                  </div>
                  <span className="text-xs text-[#999999]">{dataset.owner}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div ref={dropRef} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setDropOpen((v) => !v); }}
                className="w-6 h-6 rounded-lg hover:bg-[#F5F5F5] flex items-center justify-center text-[#999999] transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {dropOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-[calc(100%+4px)] w-52 bg-white border border-[#E9EAEB] rounded-xl shadow-[0px_8px_24px_rgba(10,13,18,0.12)] z-50 overflow-hidden py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {dropItems.map((item, i) =>
                      item === null ? (
                        <div key={`div-${i}`} className="my-1 h-px bg-[#F3F4F6]" />
                      ) : (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#374151] hover:bg-[#FFFAF5] transition-colors text-left"
                        >
                          <item.icon className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />
                          {item.label}
                        </button>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <StatusBadge status={dataset.status} />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          {[
            { label: "Responses", value: dataset.responses.toLocaleString(), icon: MessageSquare },
            { label: "Questions", value: String(dataset.questions), icon: Hash },
            { label: "Waves", value: String(dataset.waves), icon: Layers },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#FFFAF5] rounded-xl p-2.5 text-center">
              <div className="text-base font-bold text-[#222222]">{value}</div>
              <div className="text-xs text-[#999999] flex items-center justify-center gap-1 mt-0.5">
                <Icon className="w-3 h-3" />
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Sentiment */}
        <div className="mb-4">
          <SentimentBar {...dataset.sentiment} />
        </div>

        {/* Emotion rate */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-[#F5F5F5] rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full rounded-full" style={{ backgroundColor: "#e93169" }}
              initial={{ width: 0 }}
              animate={{ width: `${dataset.emotionRate}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 + index * 0.08 }}
            />
          </div>
          <span className="text-xs font-semibold text-[#111111]">{dataset.emotionRate}%</span>
          <span className="text-xs text-[#999999]">emotion rate</span>
        </div>

        {/* AI Summary */}
        <div className="bg-white rounded-xl p-3 mb-3 border border-[#DDDDDD]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3 h-3 text-[#e93169]" />
            <span className="text-xs font-semibold text-[#444444]">AI Summary</span>
          </div>
          <p className="text-xs text-[#333333] leading-relaxed">{dataset.aiSummary}</p>
        </div>

        {/* Top themes */}
        <div className="mb-3">
          <div className="text-xs font-medium text-[#666666] mb-1.5">Top Themes</div>
          <div className="flex flex-wrap gap-1">
            {dataset.topThemes.map((theme) => (
              <span key={theme} className="text-xs px-2 py-0.5 bg-[#fff0e4] hover:bg-[#ffe4cc] text-[#1A1A1A] rounded-full cursor-pointer transition-colors">
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Risks */}
        {dataset.risks.length > 0 && (
          <div className="mb-4 space-y-1">
            {dataset.risks.map((risk) => (
              <div key={risk} className="flex items-center gap-1.5 text-xs text-[#333333] bg-white rounded-lg px-2.5 py-1.5 border border-[#EBEBEB]">
                <Flag className="w-3 h-3 flex-shrink-0 text-[#ef4444]" />
                {risk}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — stopPropagation prevents card-body onClick from firing */}
      <div className="mt-auto px-4 py-3 bg-[#FFFAF5]/60 border-t border-[#F5F5F5] flex items-center gap-2 flex-wrap">
        <button
          onClick={(e) => { e.stopPropagation(); onAsk?.(dataset); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-[#e83069] hover:bg-[#c71e52] rounded-lg transition-colors"
        >
          <AsaLogoIcon className="w-3 h-3" />
          Ask Dataset
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCompare?.(dataset); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#1A1A1A] bg-white hover:bg-[#F5F5F5] border border-[#E2E2E2] rounded-lg transition-colors"
        >
          <GitCompare className="w-3 h-3" />
          Compare
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReport?.(dataset); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#1A1A1A] bg-white hover:bg-[#F5F5F5] border border-[#E2E2E2] rounded-lg transition-colors"
        >
          <FileText className="w-3 h-3" />
          Report
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAgent?.(dataset); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#1A1A1A] bg-white hover:bg-[#F5F5F5] border border-[#E2E2E2] rounded-lg transition-colors"
        >
          <Bot className="w-3 h-3" />
          Agent
        </button>
        <div className="ml-auto text-xs text-[#999999]">{dataset.lastUpdated}</div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// DATASET GRID
// ─────────────────────────────────────────────────────────────

const TABS = ["All", "Active", "Needs Review", "Processing"];

function DatasetGrid({ onOpenPanel, selectedDatasetId, onSelectDataset, onAddDataset }: {
  onOpenPanel: (state: PanelState) => void;
  selectedDatasetId?: string;
  onSelectDataset?: (d: Dataset) => void;
  onAddDataset?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("All");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const filtered =
    activeTab === "All"
      ? DATASETS
      : DATASETS.filter((d) => {
          if (activeTab === "Active") return d.status === "active";
          if (activeTab === "Needs Review") return d.status === "needs_review";
          if (activeTab === "Processing") return d.status === "processing";
          return true;
        });

  return (
    <section ref={ref} className="py-8">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader
            icon={Database}
            iconBg="bg-gradient-to-br from-[#111111] to-[#555555]"
            title="Dataset Intelligence"
            subtitle="AI-powered dataset objects with live insights"
          />
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex bg-white rounded-xl p-0.5 gap-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                    activeTab === tab
                      ? "bg-white text-[#1A1A1A] shadow-sm"
                      : "text-[#666666] hover:text-[#333333]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button onClick={onAddDataset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#111111] text-white rounded-xl hover:bg-[#0D0D0D] transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              Add Dataset
            </button>
          </div>
        </div>

        {/* Outer div defines the containing-block width so calc(50%) resolves correctly */}
        <div className="w-full overflow-hidden">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide items-stretch"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((dataset, i) => (
                <div key={dataset.id} className="w-[calc(50%-8px)] flex-shrink-0 flex flex-col">
                  <DatasetCard
                    dataset={dataset}
                    index={i}
                    isSelected={selectedDatasetId === dataset.id}
                    onSelect={onSelectDataset}
                    onAsk={(d) => onOpenPanel({ mode: "dataset", dataset: d })}
                    onCompare={(d) => onOpenPanel({ mode: "compare", dataset: d })}
                    onReport={(d) => onOpenPanel({ mode: "report", dataset: d })}
                    onAgent={(d) => onOpenPanel({ mode: "agent", dataset: d })}
                  />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// CROSS-DATASET INTELLIGENCE
// ─────────────────────────────────────────────────────────────

function CrossDatasetSection({ onOpenPanel }: {
  onOpenPanel?: (s: { mode: PanelMode; dataset?: Dataset }) => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const correlations = [
    {
      title: "Houston ↔ Austin Parking",
      overlap: 62,
      description: "62% thematic overlap detected. Both datasets show payment friction and wait time frustration as dominant pain points.",
      insight: "A structured regional comparison could surface city-specific factors driving satisfaction differences and help prioritize interventions.",
      tags: ["Payment friction", "Wait times", "App usability"],
      action: "Compare Now",
      resultMode: "compare" as PanelMode,
    },
    {
      title: "ECC ↔ Northwest College",
      overlap: 44,
      description: "44% overlap in academic experience themes. ECC shows significantly stronger financial aid satisfaction across all waves.",
      insight: "Divergence in financial aid sentiment may indicate structural program differences worth investigating before the next enrollment cycle.",
      tags: ["Academic quality", "Financial aid", "Faculty support"],
      action: "Run Comparison",
      resultMode: "compare" as PanelMode,
    },
    {
      title: "Digital Confusion — Multi-Dataset Signal",
      overlap: null,
      description: "Across 3 of 5 datasets, 'digital confusion' themes are increasing. This cross-dataset signal indicates a broader UX challenge.",
      insight: "AI recommends a cross-dataset theme deep-dive to quantify and scope the digital experience issue across all client groups.",
      tags: ["Digital confusion", "App usability", "Complexity"],
      action: "Analyze Trend",
      resultMode: "dataset" as PanelMode,
    },
  ];

  return (
    <section ref={ref} className="py-8 bg-white border-t border-b border-[#F5F5F5]">
      <div className="max-w-[1600px] mx-auto px-6">
        <SectionHeader
          icon={GitMerge}
          iconBg="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D]"
          title="Cross-Dataset Intelligence"
          subtitle="AI-detected correlations and patterns spanning multiple datasets"
          badge={<AIBadge label="AI Detected" />}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {correlations.map((corr, i) => (
            <motion.div
              key={corr.title}
              variants={fadeInUp}
              whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(100,100,100,0.1)" }}
              className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-[#222222] mb-2">{corr.title}</div>
                  {corr.overlap !== null && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-[#F5F5F5] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#444444] to-[#3A3A3A] rounded-full"
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${corr.overlap}%` } : {}}
                          transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#333333]">{corr.overlap}% overlap</span>
                    </div>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#F2F2F2] border border-[#EEEEEE] flex items-center justify-center flex-shrink-0">
                  <GitMerge className="w-4 h-4 text-[#3A3A3A]" />
                </div>
              </div>

              <p className="text-xs text-[#444444] leading-relaxed">{corr.description}</p>

              <div className="bg-white border border-[#DDDDDD] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#e93169]" />
                  <span className="text-xs font-semibold text-[#444444]">Quick Thought</span>
                </div>
                <p className="text-xs text-[#333333] leading-relaxed">{corr.insight}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {corr.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-[#F5F5F5] text-[#666666] rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onOpenPanel?.({ mode: corr.resultMode })}
                className="mt-auto flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-semibold text-[#2A2A2A] bg-white hover:bg-[#F5F5F5] rounded-xl border border-[#E2E2E2] transition-colors">
                {corr.action}
                <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// AGENT PANEL
// ─────────────────────────────────────────────────────────────

const agentStatusCfg = {
  running:   { label: "Running",   cls: "bg-[#F2F2F2] text-[#333333] border-[#DDDDDD]", dot: "bg-[#444444]", pulse: true },
  scheduled: { label: "Scheduled", cls: "bg-[#EEEEEE] text-[#2A2A2A] border-[#888888]",         dot: "bg-[#444444]",    pulse: false },
  idle:      { label: "Idle",      cls: "bg-[#FFFAF5] text-[#444444] border-[#E2E2E2]",       dot: "bg-[#999999]",   pulse: false },
  paused:    { label: "Paused",    cls: "bg-[#F7F7F7] text-[#444444] border-[#F0F0F0]",        dot: "bg-[#AAAAAA]",   pulse: false },
};

const agentIconMap: Record<string, React.FC<{ className?: string }>> = {
  activity: Activity,
  layers: Layers,
  shield: Shield,
  "file-text": FileText,
};

function AgentPanel({ onCreateAgent }: { onCreateAgent?: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-8">
      <div className="max-w-[1600px] mx-auto px-6">
        <SectionHeader
          icon={Bot}
          iconBg="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D]"
          title="Agent Workflows"
          subtitle="Autonomous AI agents operating across your datasets"
          action={
            <button
              onClick={onCreateAgent}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1A1A1A] text-white rounded-xl hover:bg-[#2D2D2D] transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              New Agent
            </button>
          }
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {AGENTS.map((agent) => {
            const sCfg = agentStatusCfg[agent.status];
            const AgentIcon = agentIconMap[agent.iconKey] || Bot;

            return (
              <motion.div
                key={agent.id}
                variants={fadeInUp}
                whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(100,100,100,0.1)" }}
                className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5F5F5] to-[#DDDDDD] border border-[#DDDDDD] flex items-center justify-center">
                    <AgentIcon className="w-5 h-5 text-[#444444]" />
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border", sCfg.cls)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", sCfg.dot, sCfg.pulse ? "animate-pulse" : "")} />
                    {sCfg.label}
                  </span>
                </div>

                <div>
                  <div className="text-sm font-semibold text-[#222222] mb-1">{agent.name}</div>
                  <p className="text-xs text-[#666666] leading-relaxed">{agent.description}</p>
                </div>

                <div className="space-y-1.5 text-xs text-[#666666]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-[#999999]" />
                    <span>Last run: {agent.lastRun}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 text-[#999999]" />
                    <span>{agent.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-3 h-3 text-[#999999]" />
                    <span>{agent.datasets} datasets monitored</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[#F5F5F5]">
                  {agent.status === "running" ? (
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#555555] bg-white hover:bg-[#F5F5F5] rounded-lg border border-[#E2E2E2] transition-colors">
                      <Pause className="w-3 h-3" />
                      Pause
                    </button>
                  ) : (
                    <button className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#333333] bg-white hover:bg-[#F5F5F5] rounded-lg border border-[#E2E2E2] transition-colors">
                      <Play className="w-3 h-3" />
                      Run Now
                    </button>
                  )}
                  <button className="flex items-center justify-center px-2.5 py-1.5 text-xs text-[#666666] bg-white hover:bg-[#F5F5F5] rounded-lg border border-[#E2E2E2] transition-colors">
                    <Settings className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// HEALTH SECTION
// ─────────────────────────────────────────────────────────────

function HealthSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const metrics = [
    {
      label: "Data Completeness",
      value: 83,
      status: "good" as const,
      description: "4 of 5 datasets have >80% response completeness. Northwest College Wave 4 is outstanding.",
      issue: "Northwest College Wave 4 missing",
    },
    {
      label: "Classification Confidence",
      value: 78,
      status: "warning" as const,
      description: "Most datasets perform well. Ulta dstest is pulling down the average with moderate confidence.",
      issue: "1 dataset below threshold",
    },
    {
      label: "Duplicate Detection",
      value: 97,
      status: "excellent" as const,
      description: "Deduplication running across all datasets with minimal overlap detected. No action required.",
      issue: null,
    },
    {
      label: "Data Freshness",
      value: 65,
      status: "warning" as const,
      description: "2 datasets have not received new data in 3+ days. Collection timelines may be at risk.",
      issue: "Northwest College, NBC Dispute",
    },
  ];

  const statusColors = {
    excellent: { bar: "from-[#777777] to-[#777777]", text: "text-[#333333]", badge: "bg-[#F2F2F2] text-[#333333] border-[#DDDDDD]" },
    good:      { bar: "from-[#444444] to-[#111111]",   text: "text-[#333333]",    badge: "bg-[#EEEEEE] text-[#2A2A2A] border-[#888888]" },
    warning:   { bar: "from-[#FF6B35] to-[#E83069]",  text: "text-[#555555]",   badge: "bg-[#F7F7F7] text-[#444444] border-[#F0F0F0]" },
    critical:  { bar: "from-[#888888] to-[#888888]",      text: "text-[#333333]",    badge: "bg-[#F2F2F2] text-[#333333] border-[#EEEEEE]" },
  };

  return (
    <section ref={ref} className="py-8 bg-white border-t border-b border-[#F5F5F5]">
      <div className="max-w-[1600px] mx-auto px-6">
        <SectionHeader
          icon={Shield}
          iconBg="bg-gradient-to-br from-[#444444] to-[#333333]"
          title="Dataset Health & Quality"
          subtitle="Operational intelligence across data integrity dimensions"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {metrics.map((metric, i) => {
            const colors = statusColors[metric.status];
            return (
              <motion.div
                key={metric.label}
                variants={fadeInUp}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-semibold text-[#222222]">{metric.label}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", colors.badge)}>
                    {metric.status}
                  </span>
                </div>
                <div className={cn("text-3xl font-bold mb-3", colors.text)}>{metric.value}%</div>
                <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden mb-3">
                  <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-r", colors.bar)}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${metric.value}%` } : {}}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 + i * 0.1 }}
                  />
                </div>
                <p className="text-xs text-[#666666] leading-relaxed mb-2">{metric.description}</p>
                {metric.issue && (
                  <div className="flex items-center gap-1.5 text-xs text-[#555555] bg-[#F7F7F7] rounded-lg px-2.5 py-1.5 border border-[#F0F0F0]">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {metric.issue}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// DATASET HEALTH CARDS — per-dataset, used in detail panel
// ─────────────────────────────────────────────────────────────

function DatasetHealthCards({ dataset }: { dataset: Dataset }) {
  const completeness = Math.min(99, Math.round((dataset.responses / (dataset.waves * 1000)) * 100));
  const confidence   = dataset.emotionRate;
  const dedup        = 92 + (parseInt(dataset.id) * 2) % 7;
  const freshness    = dataset.lastUpdated.includes("hour")    ? 88
                     : dataset.lastUpdated.includes("day")     ? 60
                     : dataset.lastUpdated.includes("Process") ? 48
                     : 75;

  const metrics = [
    {
      label: "Data Completeness",
      value: completeness,
      description: `${dataset.name} has ${completeness}% response completeness across ${dataset.waves} wave${dataset.waves > 1 ? "s" : ""}.`,
      issue: completeness < 85 ? `${dataset.responses.toLocaleString()} of target responses collected` : null,
    },
    {
      label: "Classification Confidence",
      value: confidence,
      description: `${Math.round(confidence)}% of responses in ${dataset.name} contain classifiable emotion signals.`,
      issue: confidence < 65 ? "Below confidence threshold — manual review recommended" : null,
    },
    {
      label: "Duplicate Detection",
      value: dedup,
      description: `Deduplication running across ${dataset.name} with minimal overlap detected.`,
      issue: null,
    },
    {
      label: "Data Freshness",
      value: freshness,
      description: `Last updated: ${dataset.lastUpdated}. ${freshness < 70 ? "Collection timeline may be at risk." : "Data is current."}`,
      issue: freshness < 70 ? `${dataset.name} — data aging detected` : null,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-3">
        <Shield className="w-3.5 h-3.5 text-[#333333]" />
        <span className="text-xs font-semibold text-[#222222]">Dataset Health & Quality</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="bg-white rounded-xl border border-[#EEEEEE] p-3 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#222222] leading-tight">{m.label}</span>
              <span className="text-[11px] font-bold text-[#111111]">{m.value}%</span>
            </div>
            <div className="h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full bg-[#111111]"
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 + i * 0.08 }}
              />
            </div>
            <p className="text-[10px] text-[#666666] leading-relaxed line-clamp-2">{m.description}</p>
            {m.issue && (
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#444444] bg-[#F5F5F5] rounded-lg px-2 py-1 border border-[#EBEBEB]">
                <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{m.issue}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ACTIVITY TIMELINE
// ─────────────────────────────────────────────────────────────

const activityCfg = {
  upload:     { icon: Upload,    color: "text-[#3A3A3A]",   bg: "bg-[#EEEEEE]",   border: "border-[#AAAAAA]" },
  insight:    { icon: Sparkles,  color: "text-[#555555]", bg: "bg-[#E8E8E8]", border: "border-[#DDDDDD]" },
  report:     { icon: FileText,  color: "text-[#333333]", bg: "bg-[#F5F5F5]", border: "border-[#DDDDDD]" },
  anomaly:    { icon: AlertTriangle, color: "text-[#666666]", bg: "bg-[#F7F7F7]", border: "border-[#F0F0F0]" },
  comparison: { icon: GitCompare, color: "text-[#3A3A3A]",  bg: "bg-[#F2F2F2]",   border: "border-[#EEEEEE]" },
  agent:      { icon: Bot,       color: "text-[#555555]", bg: "bg-[#F5F5F5]", border: "border-[#DDDDDD]" },
};

function ActivityTimeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div className="bg-white rounded-2xl border border-[#F5F5F5] shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#666666]" />
          <h3 className="text-sm font-semibold text-[#222222]">Activity Timeline</h3>
        </div>
        <button className="text-xs text-[#999999] hover:text-[#444444] flex items-center gap-1 transition-colors">
          All events <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {ACTIVITIES.map((activity, i) => {
          const cfg = activityCfg[activity.type];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.05 * i }}
              className="flex items-start gap-3 group"
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border", cfg.bg, cfg.border)}>
                <cfg.icon className={cn("w-3.5 h-3.5", cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#333333] leading-snug group-hover:text-[#1A1A1A] transition-colors">{activity.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-[#999999]">{activity.dataset}</span>
                  {activity.user && (
                    <>
                      <span className="text-[#E2E2E2] text-xs">·</span>
                      <span className="text-xs text-[#999999]">{activity.user}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#999999] flex-shrink-0">{activity.timestamp}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUGGESTED ACTIONS
// ─────────────────────────────────────────────────────────────

function SuggestedActions({ onOpenPanel }: {
  onOpenPanel?: (s: { mode: PanelMode; dataset?: Dataset }) => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const actions = [
    {
      icon: GitCompare,
      title: "Compare Houston vs Austin Parking",
      description: "62% thematic overlap detected. Run a structured comparison to surface regional differences.",
      tags: ["High Impact", "2 datasets"],
      color: "text-[#111111]",
      bg: "from-[#FFF5EE]/80 to-[#FFEEDD]/80",
      border: "border-[#DDDDDD]",
      cta: "Start",
      resultMode: "compare" as PanelMode,
      datasetHint: DATASETS[0],
    },
    {
      icon: FileText,
      title: "Review NBC Dispute Executive Summary",
      description: "AI draft ready with 87% confidence. Export for stakeholder distribution.",
      tags: ["Report Ready", "~5 min"],
      color: "text-[#444444]",
      bg: "from-[#FFFAF5]/80 to-[#FFFAF5]/80",
      border: "border-[#DDDDDD]",
      cta: "Review",
      resultMode: "report" as PanelMode,
      datasetHint: DATASETS[1],
    },
    {
      icon: AlertTriangle,
      title: "Investigate Houston Sentiment Shift",
      description: "Anger sentiment +22% after prompt sync. Trace verbatims and isolate root cause.",
      tags: ["High Priority", "Sentiment"],
      color: "text-[#555555]",
      bg: "from-[#FFFAF5]/80 to-[#FFFAF5]/80",
      border: "border-[#F0F0F0]",
      cta: "Investigate",
      resultMode: "dataset" as PanelMode,
      datasetHint: DATASETS[0],
    },
    {
      icon: Inbox,
      title: "Alert on Northwest College Wave 4",
      description: "Data collection stalled. Notify the collection team or extend the deadline.",
      tags: ["Missing Data", "Action Needed"],
      color: "text-[#333333]",
      bg: "from-[#FFFAF5]/80 to-[#FFF5EE]/80",
      border: "border-[#EBEBEB]",
      cta: "Alert",
      resultMode: "dataset" as PanelMode,
      datasetHint: DATASETS[3],
    },
  ];

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-[#666666]" />
        <h3 className="text-sm font-semibold text-[#222222]">Suggested Next Actions</h3>
        <AIBadge label="AI Recommended" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08 * i }}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            onClick={() => onOpenPanel?.({ mode: action.resultMode, dataset: action.datasetHint })}
            className={cn(
              "flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-br border cursor-pointer transition-all hover:shadow-sm",
              action.bg,
              action.border
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/80 shadow-sm border border-white/60">
                <action.icon className={cn("w-4 h-4", action.color)} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenPanel?.({ mode: action.resultMode, dataset: action.datasetHint }); }}
                className={cn(
                  "flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white border transition-colors",
                  action.border,
                  action.color
                )}
              >
                {action.cta}
              </button>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#222222] mb-1 leading-snug">{action.title}</div>
              <p className="text-xs text-[#666666] leading-relaxed">{action.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL COPILOT  (inline right-panel chat)
// ─────────────────────────────────────────────────────────────

function PanelCopilot({ panelState }: { panelState: PanelState }) {
  const [messages, setMessages] = useState<PanelChatMsg[]>(() => {
    const init: Record<PanelMode, string> = {
      dataset: panelState.dataset
        ? `I'm analysing **${panelState.dataset.name}** for you. I can see sentiment trends, emotion data, top themes, and AI flags. What would you like to explore?`
        : "Select a dataset to begin analysis.",
      compare:  panelState.dataset
        ? `Ready to compare **${panelState.dataset.name}** against another dataset. I'll surface thematic overlaps, sentiment gaps, and regional differences. Which dataset should I compare it to?`
        : "I can compare any two datasets side-by-side. Which two would you like to compare?",
      report:   panelState.dataset
        ? `I've loaded the draft report for **${panelState.dataset.name}**. I can refine sections, adjust the tone, add executive highlights, or generate a PDF. What would you like to do?`
        : "I can generate a new report or refine an existing draft. Tell me which dataset to focus on.",
      agent:    panelState.dataset
        ? `Showing agent workflows for **${panelState.dataset.name}**. I can configure triggers, adjust thresholds, or set up a new agent for this dataset. What do you need?`
        : "I can help you configure, review, or create agent workflows. Which dataset or agent would you like to manage?",
    };
    return [{
      id: "init",
      role: "ai",
      content: init[panelState.mode],
      timestamp: "just now",
    }];
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions: Record<PanelMode, string[]> = {
    dataset: [
      "What's driving the negative sentiment?",
      "Show me top themes breakdown",
      "Which wave has the most anger?",
      "Summarise key risks",
    ],
    compare: [
      "What themes overlap most?",
      "Where does sentiment diverge?",
      "Which dataset is performing better?",
      "Highlight regional differences",
    ],
    report: [
      "Add an executive summary",
      "Make tone more formal",
      "Export as PDF",
      "Add theme visualisations",
    ],
    agent: [
      "What agents are running?",
      "Set alert threshold to 15%",
      "Create a new sentiment monitor",
      "Show agent run history",
    ],
  };

  const getMockReply = (q: string, mode: PanelMode, ds?: Dataset): string => {
    const ql = q.toLowerCase();
    if (mode === "dataset" && ds) {
      if (ql.includes("negative") || ql.includes("sentiment")) return `The primary driver of negative sentiment in **${ds.name}** is **${ds.topThemes[0]}** (appearing in ${ds.sentiment.negative}% of responses). Secondary factors include ${ds.topThemes[1] ?? "wait times"} and ${ds.topThemes[2] ?? "app usability"}. Anger is the dominant emotion at ~${ds.emotionRate}% emotion rate.`;
      if (ql.includes("theme")) return `Top themes in **${ds.name}**:\n1. **${ds.topThemes[0]}** — most mentioned\n2. **${ds.topThemes[1] ?? "Unresolved complaints"}** — growing\n3. **${ds.topThemes[2] ?? "Digital experience"}** — emerging\n\nTheme Discovery agent last updated these 6 hours ago.`;
      if (ql.includes("wave")) return `Wave 1 baseline shows positive sentiment at ${ds.sentiment.positive + 5}%. Wave 2 shows a dip following the prompt sync. Wave 3 records the highest anger rate at ${ds.emotionRate}%. Recommend comparing Wave 1 vs Wave 3 verbatims.`;
      if (ql.includes("risk")) return `**${ds.name}** has ${ds.risks.length} active risk flags:\n${ds.risks.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nI recommend investigating the ${ds.risks[0]} before the next stakeholder review.`;
      return `Based on the data in **${ds.name}**, the overall emotion rate is ${ds.emotionRate}% with ${ds.sentiment.positive}% positive and ${ds.sentiment.negative}% negative sentiment. Would you like me to dig into a specific theme or time period?`;
    }
    if (mode === "compare") {
      if (ql.includes("overlap")) return "**Houston Parking** and **Austin Parking** share 62% thematic overlap. The top shared themes are: Payment friction, Wait times, and App usability. However, Austin shows 15% more satisfaction with staff interactions.";
      if (ql.includes("diverge") || ql.includes("differ")) return "Key divergence points:\n- **Anger**: Houston 48% vs Austin 31% — 17pt gap\n- **App usability**: Houston -34% vs Austin -19%\n- **Staff interaction**: Austin leads by +22pts\n\nThis suggests the payment app rollout impact is stronger in Houston.";
      return "Comparison analysis is ready. I've mapped thematic overlap at 62% and identified 3 key divergence points. Would you like a detailed breakdown or a PDF comparison report?";
    }
    if (mode === "report") {
      if (ql.includes("pdf") || ql.includes("export")) { toast.success("Generating PDF report…", { description: "Ready in ~30 seconds", duration: 3000 }); return "PDF export initiated. Your report will be ready in ~30 seconds and sent to your email. It includes sentiment overview, theme analysis, wave comparison, and executive recommendations."; }
      if (ql.includes("summary") || ql.includes("executive")) return "**Executive Summary added:**\n\n*Sentiment has stabilised at 54% negative following peak media coverage. The primary driver — contract transparency concerns — is declining. Recommend distributing this summary to stakeholders with the resolution expectations data highlighted.*";
      return "Report is at 87% confidence. I can refine the executive summary, adjust the analysis depth, or add a competitive context section. What would you like to improve?";
    }
    if (mode === "agent") {
      if (ql.includes("running") || ql.includes("status")) return "Currently **2 agents running**:\n1. **Sentiment Monitor** — last triggered 2 min ago, watching 4 datasets\n2. **Data Quality Agent** — flagged 14 items in last pass\n\n**1 scheduled**: Theme Discovery runs daily at 6 AM.";
      if (ql.includes("threshold") || ql.includes("alert")) return "Alert threshold updated to **15%** sentiment shift. The Sentiment Monitor will now trigger notifications whenever any dataset crosses this boundary. Currently watching Houston Parking, ECC, Northwest College, and NBC Dispute.";
      if (ql.includes("create") || ql.includes("new")) return "To create a new sentiment monitor, I need: (1) which datasets to watch, (2) the emotion/sentiment threshold, and (3) your preferred notification channel. Reply with these details or click **New Agent** to open the full builder.";
      return "Agent workflows are healthy. 2 running, 1 scheduled, 1 idle. Sentinel Agent triggered 3 alerts today. Would you like to review alert history or adjust any agent configuration?";
    }
    return "I'm here to help. Ask me anything about the data shown on the left.";
  };

  const send = () => {
    const q = input.trim();
    if (!q) return;
    const userMsg: PanelChatMsg = { id: Date.now().toString(), role: "user", content: q, timestamp: "just now" };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getMockReply(q, panelState.mode, panelState.dataset);
      setMessages((m) => [...m, { id: (Date.now() + 1).toString(), role: "ai", content: reply, timestamp: "just now" }]);
      setTyping(false);
    }, 1100);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F5F5F5] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1A1A1A]">Canvs Copilot</div>
            <div className="text-xs text-[#666666]">
              {panelState.mode === "dataset" && (panelState.dataset ? `Analysing ${panelState.dataset.name}` : "Dataset analysis")}
              {panelState.mode === "compare" && "Cross-dataset comparison"}
              {panelState.mode === "report" && (panelState.dataset ? `Report: ${panelState.dataset.name}` : "Report generation")}
              {panelState.mode === "agent" && "Agent workflow management"}
            </div>
          </div>
          <LivePulse className="ml-auto" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "ai" && (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-[#111111] text-white rounded-tr-sm"
                  : "bg-[#F5F5F5] text-[#222222] rounded-tl-sm"
              )}
            >
              {msg.content.split("**").map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-[#F5F5F5] rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <div className="flex gap-1 items-center h-4">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#999999]"
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0">
        {suggestions[panelState.mode].map((s) => (
          <button
            key={s}
            onClick={() => { setInput(s); setTimeout(() => { const q = s; const userMsg: PanelChatMsg = { id: Date.now().toString(), role: "user", content: q, timestamp: "just now" }; setMessages((m) => [...m, userMsg]); setTyping(true); setTimeout(() => { const reply = getMockReply(q, panelState.mode, panelState.dataset); setMessages((m) => [...m, { id: (Date.now() + 1).toString(), role: "ai", content: reply, timestamp: "just now" }]); setTyping(false); }, 1100); }, 50); }}
            className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-[#FFFAF5] hover:bg-[#F5F5F5] border border-[#E2E2E2] rounded-full text-[#444444] transition-colors whitespace-nowrap"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#FFFAF5] border border-[#E2E2E2] rounded-2xl px-3.5 py-2.5 focus-within:border-[#333333] focus-within:ring-2 focus-within:ring-[#888888] transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask about this data…"
            className="flex-1 bg-transparent text-xs text-[#222222] placeholder-[#999999] outline-none min-w-0"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-6 h-6 rounded-lg bg-[#111111] disabled:bg-[#E2E2E2] flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LEFT PANEL CONTENT
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// EMOTION TREEMAP — replaces the simple progress bar widget
// ─────────────────────────────────────────────────────────────

function EmotionTreemap({ dataset, selectedEmotion, onSelectEmotion }: { dataset: Dataset; selectedEmotion: string | null; onSelectEmotion: (emotion: string | null) => void }) {
  const purples = [
    "#4C1D95", "#5B21B6", "#6D28D9", "#7C3AED",
    "#8B5CF6", "#9F7AEA", "#A78BFA", "#B39DDB",
    "#C4B5FD", "#D8B4FE", "#DDD6FE", "#EDE9FE",
  ];

  // Generate emotion blocks from dataset themes & sentiment
  const raw = [
    { label: dataset.topThemes[0] ?? "Primary Theme",    pct: 28 + Math.round(dataset.sentiment.negative * 0.08) },
    { label: dataset.topThemes[1] ?? "Secondary Theme",  pct: 12 + Math.round(dataset.sentiment.positive * 0.05) },
    { label: dataset.topThemes[2] ?? "Third Theme",      pct: 9  },
    { label: dataset.topThemes[3] ?? "Fourth Theme",     pct: 7  },
    { label: "Positive Sentiments",                       pct: 6.5 },
    { label: "Strong Agreement",                          pct: 5  },
    { label: "Critical Feedback",                         pct: 4.5 },
    { label: "Neutral Observation",                       pct: 3.8 },
    { label: "Enthusiasm",                                pct: 3.2 },
    { label: "Uncertainty",                               pct: 2.8 },
    { label: "Satisfaction",                              pct: 2.2 },
    { label: "Concern",                                   pct: 1.9 },
    { label: "Anticipation",                              pct: 1.6 },
    { label: "Frustration",                               pct: 1.3 },
    { label: "Surprise",                                  pct: 1.0 },
    { label: "Hope",                                      pct: 0.9 },
  ];

  // Normalize so they sum to ~100
  const total = raw.reduce((s, r) => s + r.pct, 0);
  const items = raw.map((r, i) => ({ ...r, pct: +((r.pct / total) * 100).toFixed(1), color: purples[Math.min(i, purples.length - 1)] }));

  // Layout: col 1 = item[0] (big), col 2 = item[1]+[2], col 3 = item[3]+[4]+[5],
  //         col 4 = item[6]+[7]+[8], col 5 = item[9]+[10]+[11], col 6 = rest in grid
  const col1  = [items[0]];
  const col2  = [items[1], items[2]];
  const col3  = [items[3], items[4], items[5]];
  const col4  = [items[6], items[7], items[8]];
  const col5  = [items[9], items[10], items[11]];
  const rest  = items.slice(12);

  const colFlex = (its: typeof items) => its.reduce((s, x) => s + x.pct, 0);

  const Block = ({ item, className = "", style }: { item: typeof items[0]; className?: string; style?: React.CSSProperties }) => {
    const isSelected = selectedEmotion === item.label;
    const hasSelection = selectedEmotion !== null;
    return (
      <div
        className={cn(
          "rounded-xl p-2 flex flex-col justify-between overflow-hidden min-w-0 min-h-0 cursor-pointer transition-all duration-150",
          isSelected ? "ring-2 ring-white ring-offset-1 opacity-100" : hasSelection ? "opacity-50" : "opacity-100",
          className
        )}
        style={{ backgroundColor: item.color, ...style }}
        onClick={() => onSelectEmotion(isSelected ? null : item.label)}
      >
        <span className="text-white/75 text-[10px] font-semibold leading-none">{item.pct.toFixed(1)}%</span>
        <span className="text-white text-[11px] font-semibold leading-tight line-clamp-2 mt-auto pt-1">{item.label}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#222222]">Emotion Classification</span>
        <span className="text-sm font-bold text-[#111111]">{dataset.emotionRate}% classified</span>
      </div>
      <div className="flex gap-1 h-52 overflow-hidden rounded-lg">
        {/* Col 1 — largest */}
        <div style={{ flex: colFlex(col1) }} className="flex flex-col gap-1 min-w-0">
          {col1.map(item => <Block key={item.label} item={item} className="flex-1" />)}
        </div>
        {/* Col 2 */}
        <div style={{ flex: colFlex(col2) }} className="flex flex-col gap-1 min-w-0">
          {col2.map(item => <Block key={item.label} item={item} style={{ flex: item.pct } as React.CSSProperties} className="flex-1" />)}
        </div>
        {/* Col 3 */}
        <div style={{ flex: colFlex(col3) }} className="flex flex-col gap-1 min-w-0">
          {col3.map(item => <Block key={item.label} item={item} style={{ flex: item.pct } as React.CSSProperties} className="flex-1" />)}
        </div>
        {/* Col 4 */}
        <div style={{ flex: colFlex(col4) }} className="flex flex-col gap-1 min-w-0">
          {col4.map(item => <Block key={item.label} item={item} style={{ flex: item.pct } as React.CSSProperties} className="flex-1" />)}
        </div>
        {/* Col 5 */}
        <div style={{ flex: colFlex(col5) }} className="flex flex-col gap-1 min-w-0">
          {col5.map(item => <Block key={item.label} item={item} style={{ flex: item.pct } as React.CSSProperties} className="flex-1" />)}
        </div>
        {/* Col 6 — smallest items, 2-per-row grid */}
        <div style={{ flex: colFlex(rest) }} className="flex flex-col gap-1 min-w-0">
          {rest.map(item => <Block key={item.label} item={item} style={{ flex: item.pct } as React.CSSProperties} className="flex-1" />)}
        </div>
      </div>
      <p className="text-[10px] text-[#AAAAAA] mt-2">{dataset.emotionRate}% of responses contain classifiable emotion signals</p>
    </div>
  );
}

function DatasetDetailPanel({ dataset }: { dataset: Dataset }) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [emotionFilter, setEmotionFilter] = useState<"all" | "positive" | "negative">("all");
  const [askPulseWidget, setAskPulseWidget] = useState<string | null>(null);

  const waveData = [
    { wave: "W1", pos: dataset.sentiment.positive + 8, neg: dataset.sentiment.negative - 12 },
    { wave: "W2", pos: dataset.sentiment.positive + 2, neg: dataset.sentiment.negative - 4 },
    { wave: "W3", pos: dataset.sentiment.positive,     neg: dataset.sentiment.negative },
  ];
  if (dataset.waves >= 4) waveData.push({ wave: "W4", pos: dataset.sentiment.positive - 5, neg: dataset.sentiment.negative + 5 });

  const THEME_COLORS = ["#E83069", "#7C3AED", "#2563EB", "#059669", "#D97706"];

  const DISCUSSIONS_DATA = [
    { id: "d1", emotion: "Anger", topic: dataset.topThemes[0] ?? "Payment confusion", comment: "The payment system is completely broken. I've been waiting 3 days for a resolution and nobody cares.", sentiment: "negative", user: "R. Martinez", time: "2h ago" },
    { id: "d2", emotion: "Frustration", topic: dataset.topThemes[1] ?? "Wait time frustration", comment: "45 minutes on hold. This is unacceptable for a service we're paying for.", sentiment: "negative", user: "J. Thompson", time: "3h ago" },
    { id: "d3", emotion: "Satisfaction", topic: dataset.topThemes[2] ?? "App usability", comment: "The new app update is much better. Finally fixed the login issues.", sentiment: "positive", user: "A. Chen", time: "4h ago" },
    { id: "d4", emotion: "Anger", topic: dataset.topThemes[0] ?? "Payment confusion", comment: "Charged twice and no refund in sight. Escalating to management.", sentiment: "negative", user: "M. Johnson", time: "5h ago" },
    { id: "d5", emotion: "Confusion", topic: dataset.topThemes[1] ?? "Wait time frustration", comment: "Why does it take 4 screens to do a simple check-in? The process is way too complicated.", sentiment: "negative", user: "S. Williams", time: "6h ago" },
    { id: "d6", emotion: "Joy", topic: dataset.topThemes[2] ?? "App usability", comment: "Staff was incredibly helpful today. Best experience I've had.", sentiment: "positive", user: "K. Davis", time: "7h ago" },
    { id: "d7", emotion: "Frustration", topic: dataset.topThemes[0] ?? "Payment confusion", comment: "I was told 3 different things by 3 different agents. No consistency.", sentiment: "negative", user: "P. Garcia", time: "8h ago" },
    { id: "d8", emotion: "Satisfaction", topic: dataset.topThemes[3] ?? "Staff interaction", comment: "Quick response and my issue was solved in one call. Impressed.", sentiment: "positive", user: "L. Brown", time: "9h ago" },
  ];

  const filteredDiscussions = selectedEmotion
    ? DISCUSSIONS_DATA.filter(d => d.emotion === selectedEmotion)
    : DISCUSSIONS_DATA;

  const handleAskPulse = (widgetName: string) => {
    setAskPulseWidget(widgetName);
    console.log("Ask Pulse:", widgetName);
  };

  const positiveEmotions = ["Satisfaction", "Joy", "Enthusiasm", "Hope", "Anticipation", "Strong Agreement", "Positive Sentiments"];
  const negativeEmotions = ["Anger", "Frustration", "Confusion", "Critical Feedback", "Uncertainty", "Concern"];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F5F5F5] to-[#DDDDDD] border border-[#DDDDDD] flex items-center justify-center flex-shrink-0">
          <Database className="w-5 h-5 text-[#111111]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#1A1A1A] leading-tight">{dataset.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={dataset.status} />
            {dataset.badge && <DatasetBadge badge={dataset.badge} type={dataset.badgeType} />}
            <span className="text-xs text-[#999999]">{dataset.source}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Responses", value: dataset.responses.toLocaleString(), icon: MessageSquare, color: "text-[#333333]" },
          { label: "Questions", value: String(dataset.questions), icon: Hash, color: "text-[#555555]" },
          { label: "Waves", value: String(dataset.waves), icon: Layers, color: "text-[#333333]" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#FFFAF5] rounded-xl p-3.5 text-center border border-[#F5F5F5]">
            <div className="text-xl font-bold text-[#222222]">{value}</div>
            <div className={cn("text-xs flex items-center justify-center gap-1 mt-1", color)}>
              <Icon className="w-3 h-3" />
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Dataset Health & Quality */}
      <DatasetHealthCards dataset={dataset} />

      {/* Sentiment Breakdown */}
      <div className="group relative bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm pb-5">
        <div className="text-xs font-semibold text-[#222222] mb-2 flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-[#666666]" /> Sentiment Breakdown
        </div>
        {/* Sentiment filter pills */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {(["all", "positive", "negative", "neutral"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSentimentFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors",
                sentimentFilter === f ? "bg-[#E83069] text-white" : "bg-[#F5F5F5] text-[#666]"
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <SentimentBar {...dataset.sentiment} />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Positive", val: dataset.sentiment.positive, dotColor: "bg-[#22c55e]", text: "text-[#16a34a]", key: "positive" as const },
            { label: "Negative", val: dataset.sentiment.negative, dotColor: "bg-[#E83069]", text: "text-[#E83069]", key: "negative" as const },
            { label: "Neutral",  val: dataset.sentiment.neutral,  dotColor: "bg-[#94a3b8]", text: "text-[#666666]", key: "neutral" as const },
          ]
            .filter(({ key }) => sentimentFilter === "all" || sentimentFilter === key)
            .map(({ label, val, dotColor, text }) => (
              <div key={label} className="text-center">
                <div className={cn("text-lg font-bold", text)}>{val}%</div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <div className={cn("w-2 h-2 rounded-full", dotColor)} />
                  <span className="text-xs text-[#999999]">{label}</span>
                </div>
              </div>
            ))}
        </div>
        <button
          onClick={() => handleAskPulse("Sentiment Breakdown")}
          className="absolute -bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#E83069] text-white text-[11px] font-semibold rounded-full shadow-lg hover:bg-[#C71E52]"
        >
          <Sparkles className="w-3 h-3" />
          Ask Pulse
        </button>
      </div>

      {/* Emotion Classification Treemap */}
      <div className="group relative pb-5">
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {(["all", "positive", "negative"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setEmotionFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors",
                emotionFilter === f ? "bg-[#E83069] text-white" : "bg-[#F5F5F5] text-[#666]"
              )}
            >
              {f === "all" ? "All" : f === "positive" ? "Positive Emotions" : "Negative Emotions"}
            </button>
          ))}
        </div>
        <EmotionTreemap
          dataset={dataset}
          selectedEmotion={selectedEmotion}
          onSelectEmotion={(emotion) => {
            if (emotionFilter === "positive" && emotion && negativeEmotions.includes(emotion)) return;
            if (emotionFilter === "negative" && emotion && positiveEmotions.includes(emotion)) return;
            setSelectedEmotion(emotion);
          }}
        />
        <button
          onClick={() => handleAskPulse("Emotion Classification")}
          className="absolute -bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#E83069] text-white text-[11px] font-semibold rounded-full shadow-lg hover:bg-[#C71E52]"
        >
          <Sparkles className="w-3 h-3" />
          Ask Pulse
        </button>
      </div>

      {/* Discussions */}
      <div className="group relative bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#666666]" />
            <span className="text-xs font-semibold text-[#222222]">Discussions</span>
          </div>
          {selectedEmotion && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#E83069] bg-[#FFF0F5] px-2 py-0.5 rounded-full font-semibold">
                Filtered by: {selectedEmotion}
              </span>
              <button
                onClick={() => setSelectedEmotion(null)}
                className="text-[10px] text-[#999] hover:text-[#E83069] transition-colors font-semibold"
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {filteredDiscussions.length === 0 ? (
            <div className="text-xs text-[#999] text-center py-6">No discussions match this emotion.</div>
          ) : filteredDiscussions.map((disc) => {
            const isNegativeEmotion = ["Anger", "Frustration", "Confusion"].includes(disc.emotion);
            return (
              <div key={disc.id} className="bg-[#FAFAFA] rounded-xl p-3 border border-[#F0F0F0]">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#555]">
                    {disc.user.charAt(0)}
                  </div>
                  <p className="text-xs text-[#333333] leading-relaxed flex-1">{disc.comment}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    isNegativeEmotion ? "bg-[#FFF0F5] text-[#E83069]" : "bg-[#F0FFF4] text-[#16a34a]"
                  )}>
                    {disc.emotion}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[#555]">{disc.topic}</span>
                  <span className="text-[10px] text-[#999] ml-auto">{disc.user} · {disc.time}</span>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => handleAskPulse("Discussions")}
          className="absolute -bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#E83069] text-white text-[11px] font-semibold rounded-full shadow-lg hover:bg-[#C71E52]"
        >
          <Sparkles className="w-3 h-3" />
          Ask Pulse
        </button>
      </div>

      {/* Wave trend */}
      <div className="group relative bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm pb-5">
        <div className="text-xs font-semibold text-[#222222] mb-3">Wave-over-Wave Sentiment Trend</div>
        <div className="flex items-end gap-2 h-20">
          {waveData.map(({ wave, pos, neg }) => (
            <div key={wave} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5">
                <motion.div
                  className="w-full bg-[#22c55e] rounded-t-sm"
                  style={{ transformOrigin: "bottom", height: `${pos * 0.5}px` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.8 }}
                />
                <motion.div
                  className="w-full bg-[#E83069] rounded-b-sm"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  style={{ transformOrigin: "top", height: `${neg * 0.3}px` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                />
              </div>
              <span className="text-[10px] text-[#999999]">{wave}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22c55e]" /><span className="text-[10px] text-[#999999]">Positive</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#E83069]" /><span className="text-[10px] text-[#999999]">Negative</span></div>
        </div>
        <button
          onClick={() => handleAskPulse("Wave Sentiment Trend")}
          className="absolute -bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#E83069] text-white text-[11px] font-semibold rounded-full shadow-lg hover:bg-[#C71E52]"
        >
          <Sparkles className="w-3 h-3" />
          Ask Pulse
        </button>
      </div>

      {/* AI Summary */}
      <div className="group relative bg-gradient-to-br from-[#FFF0F5] to-[#FFFAF5] rounded-2xl p-4 border border-[#FFD6E5] pb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#E83069]" />
          <span className="text-xs font-semibold text-[#E83069]">AI Summary</span>
        </div>
        <p className="text-xs text-[#333333] leading-relaxed">{dataset.aiSummary}</p>
        <button
          onClick={() => handleAskPulse("AI Summary")}
          className="absolute -bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#E83069] text-white text-[11px] font-semibold rounded-full shadow-lg hover:bg-[#C71E52]"
        >
          <Sparkles className="w-3 h-3" />
          Ask Pulse
        </button>
      </div>

      {/* Top themes */}
      <div className="group relative bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm pb-5">
        <div className="text-xs font-semibold text-[#222222] mb-3">Top Themes</div>
        <div className="space-y-2">
          {dataset.topThemes.map((theme, i) => {
            const width = 90 - i * 15;
            return (
              <div key={theme} className="flex items-center gap-2">
                <div className="w-24 text-xs text-[#444444] truncate">{theme}</div>
                <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: THEME_COLORS[i % THEME_COLORS.length] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <span className="text-xs text-[#999999] w-8 text-right">{width}%</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => handleAskPulse("Top Themes")}
          className="absolute -bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#E83069] text-white text-[11px] font-semibold rounded-full shadow-lg hover:bg-[#C71E52]"
        >
          <Sparkles className="w-3 h-3" />
          Ask Pulse
        </button>
      </div>

      {/* Risks */}
      {dataset.risks.length > 0 && (
        <div className="group relative space-y-2 pb-5">
          <div className="text-xs font-semibold text-[#222222]">Active Risk Flags</div>
          {dataset.risks.map((risk) => (
            <div key={risk} className="flex items-center gap-2 text-xs text-[#333333] bg-[#F2F2F2] rounded-xl px-3 py-2 border border-[#EBEBEB]">
              <Flag className="w-3 h-3 flex-shrink-0" />
              {risk}
            </div>
          ))}
          <button
            onClick={() => handleAskPulse("Risk Flags")}
            className="absolute -bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#E83069] text-white text-[11px] font-semibold rounded-full shadow-lg hover:bg-[#C71E52]"
          >
            <Sparkles className="w-3 h-3" />
            Ask Pulse
          </button>
        </div>
      )}
    </div>
  );
}

function ComparePanel({ dataset }: { dataset?: Dataset }) {
  const other = dataset?.id === "1" ? DATASETS[3] : DATASETS[0];
  const ds = dataset ?? DATASETS[0];

  const themes = [
    { label: "Payment friction",   a: 78, b: 45 },
    { label: "Wait times",         a: 65, b: 58 },
    { label: "App usability",      a: 72, b: 41 },
    { label: "Staff interaction",  a: 38, b: 61 },
    { label: "Pricing fairness",   a: 44, b: 50 },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="text-sm font-bold text-[#1A1A1A]">Cross-Dataset Comparison</div>

      {/* Dataset headers */}
      <div className="grid grid-cols-2 gap-3">
        {[ds, other].map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F5F5F5] to-[#DDDDDD] flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-[#111111]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#222222] truncate">{d.name.split("—")[0].trim()}</div>
                <div className="text-[10px] text-[#999999]">{d.responses.toLocaleString()} responses</div>
              </div>
            </div>
            <SentimentBar {...d.sentiment} />
          </div>
        ))}
      </div>

      {/* Overlap stat */}
      <div className="bg-gradient-to-r from-[#EEEEEE] to-[#E8E8E8] rounded-2xl p-4 border border-[#AAAAAA]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#222222]">Thematic Overlap</span>
          <span className="text-2xl font-bold text-[#111111]">62%</span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#333333] to-[#555555] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "62%" }}
            transition={{ duration: 1.2 }}
          />
        </div>
        <p className="text-xs text-[#444444] mt-2">High overlap detected — a structured comparison will surface key regional differences.</p>
      </div>

      {/* Theme comparison bars */}
      <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
        <div className="text-xs font-semibold text-[#222222] mb-4">Theme Frequency Comparison</div>
        <div className="space-y-3">
          {themes.map(({ label, a, b }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#444444]">{label}</span>
                <div className="flex gap-2 text-xs">
                  <span className="text-[#333333] font-medium">{a}%</span>
                  <span className="text-[#333333] font-medium">{b}%</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[#333333] rounded-full" initial={{ width: 0 }} animate={{ width: `${a}%` }} transition={{ duration: 0.8 }} />
                </div>
                <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[#333333] rounded-full" initial={{ width: 0 }} animate={{ width: `${b}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#333333]" /><span className="text-xs text-[#444444]">{ds.name.split("—")[0].trim()}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#333333]" /><span className="text-xs text-[#444444]">{other.name.split("—")[0].trim()}</span></div>
        </div>
      </div>

      {/* Key insights */}
      <div className="bg-white rounded-2xl p-4 border border-[#DDDDDD]">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#555555]" />
          <span className="text-xs font-semibold text-[#444444]">AI Comparison Insights</span>
        </div>
        <ul className="space-y-1.5 text-xs text-[#333333] leading-relaxed">
          <li className="flex gap-2"><span className="text-[#333333] font-bold mt-0.5">→</span>Payment friction is 33pt higher in {ds.name.split("—")[0].trim()}</li>
          <li className="flex gap-2"><span className="text-[#333333] font-bold mt-0.5">→</span>Staff satisfaction is significantly stronger in {other.name.split("—")[0].trim()}</li>
          <li className="flex gap-2"><span className="text-[#555555] font-bold mt-0.5">→</span>App usability is a shared pain point across both datasets</li>
        </ul>
      </div>
    </div>
  );
}

function ReportPanel({ dataset }: { dataset?: Dataset }) {
  const ds = dataset ?? DATASETS[1];
  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-[#1A1A1A]">{ds.name} — Executive Report</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-[#F2F2F2] text-[#333333] border border-[#DDDDDD] rounded-full font-medium">Draft Ready</span>
            <span className="text-xs text-[#999999]">Confidence: 87%</span>
          </div>
        </div>
        <button
          onClick={() => toast.success("Exporting PDF…", { description: "Your report will download shortly" })}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#111111] text-white rounded-xl hover:bg-[#0D0D0D] transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          Export PDF
        </button>
      </div>

      {/* Report sections */}
      {[
        { title: "Executive Summary", status: "complete", preview: `Sentiment has stabilized at ${ds.sentiment.negative}% negative following the resolution period. Primary concern — ${ds.topThemes[0]} — is declining. Recommend distributing this summary ahead of the Q2 stakeholder review.` },
        { title: "Sentiment Analysis", status: "complete", preview: `${ds.sentiment.positive}% positive, ${ds.sentiment.negative}% negative, ${ds.sentiment.neutral}% neutral across ${ds.waves} waves. Emotion classification rate: ${ds.emotionRate}%.` },
        { title: "Theme Breakdown", status: "complete", preview: `Top 4 themes identified: ${ds.topThemes.slice(0, 4).join(", ")}. ${ds.topThemes[0]} is the leading driver of sentiment.` },
        { title: "Wave-over-Wave Analysis", status: "complete", preview: "Sentiment stabilising across waves. Wave 2 showed peak negativity. Wave 3 shows measurable improvement in top themes." },
        { title: "Risk Flags & Recommendations", status: ds.risks.length > 0 ? "review" : "complete", preview: ds.risks.length > 0 ? ds.risks.join(". ") + " — requires attention before distribution." : "No critical risk flags. Dataset is healthy and ready for stakeholder distribution." },
        { title: "Stakeholder Distribution List", status: "pending", preview: "Add recipients to auto-distribute this report once finalised." },
      ].map(({ title, status, preview }) => (
        <div key={title} className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#222222]">{title}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border",
              status === "complete" ? "bg-[#F2F2F2] text-[#333333] border-[#DDDDDD]" :
              status === "review"   ? "bg-[#F7F7F7] text-[#444444] border-[#F0F0F0]" :
                                      "bg-[#FFFAF5] text-[#444444] border-[#E2E2E2]"
            )}>
              {status === "complete" ? "Complete" : status === "review" ? "Needs Review" : "Pending"}
            </span>
          </div>
          <p className="text-xs text-[#666666] leading-relaxed">{preview}</p>
        </div>
      ))}
    </div>
  );
}

function AgentDetailPanel({ dataset }: { dataset?: Dataset }) {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="text-sm font-bold text-[#1A1A1A]">
        {dataset ? `Agent Workflows — ${dataset.name.split("—")[0].trim()}` : "All Agent Workflows"}
      </div>

      {AGENTS.map((agent) => {
        const sCfg = {
          running:   { cls: "bg-[#F2F2F2] text-[#333333] border-[#DDDDDD]", dot: "bg-[#444444] animate-pulse" },
          scheduled: { cls: "bg-[#EEEEEE] text-[#2A2A2A] border-[#888888]", dot: "bg-[#444444]" },
          idle:      { cls: "bg-[#FFFAF5] text-[#444444] border-[#E2E2E2]", dot: "bg-[#999999]" },
          paused:    { cls: "bg-[#F7F7F7] text-[#444444] border-[#F0F0F0]", dot: "bg-[#AAAAAA]" },
        }[agent.status];

        return (
          <div key={agent.id} className="bg-white rounded-2xl border border-[#F5F5F5] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5F5F5] to-[#F5F5F5] border border-[#DDDDDD] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#555555]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#222222]">{agent.name}</div>
                  <div className="text-[10px] text-[#999999]">{agent.schedule}</div>
                </div>
              </div>
              <span className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium", sCfg.cls)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", sCfg.dot)} />
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </span>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed mb-3">{agent.description}</p>
            <div className="flex items-center gap-3 text-xs text-[#999999]">
              <span>Last run: {agent.lastRun}</span>
              <span>·</span>
              <span>{agent.datasets} datasets</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SPLIT PANEL VIEW
// ─────────────────────────────────────────────────────────────

function SplitPanelView({ panelState, onClose }: { panelState: PanelState; onClose: () => void }) {
  const modeLabels: Record<PanelMode, string> = {
    dataset: "Dataset Analysis",
    compare: "Compare Datasets",
    report:  "Generate Report",
    agent:   "Agent Workflows",
  };

  const LeftContent = () => {
    switch (panelState.mode) {
      case "dataset": return <DatasetDetailPanel dataset={panelState.dataset ?? DATASETS[0]} />;
      case "compare": return <ComparePanel dataset={panelState.dataset} />;
      case "report":  return <ReportPanel dataset={panelState.dataset} />;
      case "agent":   return <AgentDetailPanel dataset={panelState.dataset} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-[#FFFAF5] flex flex-col"
      style={{ top: 64 }}
    >
      {/* Panel header bar */}
      <div className="flex-shrink-0 bg-white border-b border-[#F5F5F5] px-6 py-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-medium text-[#666666] hover:text-[#222222] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Datasets
        </button>
        <div className="w-px h-4 bg-[#E2E2E2]" />
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[#1A1A1A]">{modeLabels[panelState.mode]}</span>
          {panelState.dataset && (
            <span className="text-xs text-[#999999]">— {panelState.dataset.name.split("—")[0].trim()}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-auto w-7 h-7 rounded-lg bg-[#F5F5F5] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-[#444444]" />
        </button>
      </div>

      {/* Two columns */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: data panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-hidden border-r border-[#F5F5F5] bg-[#FFFAF5]"
        >
          <LeftContent />
        </motion.div>

        {/* Right: copilot */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col overflow-hidden bg-white"
        >
          <PanelCopilot panelState={panelState} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// PERSISTENT COPILOT  (always-open right panel)
// ─────────────────────────────────────────────────────────────

const INITIAL_COPILOT_MSGS: CopilotMsg[] = [
  {
    id: "p0",
    role: "ai",
    content: "Good morning. I've already scanned your **6 active datasets** and found **3 issues** that may need attention today.",
    timestamp: "just now",
    proactive: true,
  },
  {
    id: "p1",
    role: "ai",
    content: "1. **Anger spike** — Houston Parking shows a 22% increase post prompt sync. Above your 15% alert threshold.\n\n2. **Data stalled** — Northwest College Wave 4 has been idle for 3 days. Deadline in 6 days.\n\n3. **Sentiment recovery** — NBC Dispute positive is up 8pts this week. Worth sharing with stakeholders.",
    timestamp: "just now",
    proactive: true,
  },
  {
    id: "p2",
    role: "ai",
    content: "Click any dataset card to investigate, or ask me anything below.",
    timestamp: "just now",
    proactive: true,
  },
];

function PersistentCopilot({
  ctxData,
  onOpenDetail,
}: {
  ctxData: CopilotCtxData;
  onOpenDetail: (mode: PanelMode, dataset?: Dataset) => void;
}) {
  const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const [messages, setMessages] = useState<CopilotMsg[]>(INITIAL_COPILOT_MSGS);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCtxKey = useRef<string>("default-");

  // Inject context-change message when selected dataset/mode changes
  useEffect(() => {
    const key = `${ctxData.context}-${ctxData.dataset?.id ?? ""}`;
    if (prevCtxKey.current === key) return;
    prevCtxKey.current = key;

    let msg = "";
    if (ctxData.context === "dataset" && ctxData.dataset) {
      msg = `Now focused on **${ctxData.dataset.name}**.\n\nI can see **${ctxData.dataset.sentiment.negative}%** negative sentiment with **${ctxData.dataset.emotionRate}%** emotion rate. The top concern is **${ctxData.dataset.topThemes[0]}**.\n\nWhat would you like to explore?`;
    } else if (ctxData.context === "compare") {
      if (ctxData.dataset) {
        const ds = ctxData.dataset;
        const other = DATASETS.find(d => d.id !== ds.id) ?? DATASETS[0];
        msg = `Comparing **${ds.name}** vs **${other.name}**.\n\n• Sentiment gap: **${Math.abs(ds.sentiment.negative - other.sentiment.negative)}pts** on negative sentiment\n• Shared themes: **${ds.topThemes.filter(t => other.topThemes.includes(t)).length || 1}** overlapping\n• Top divergence: **${ds.topThemes[0]}** is prominent in ${ds.name} but less so in ${other.name}\n\nWant me to run a full side-by-side breakdown?`;
      } else {
        msg = "Ready to compare datasets. I'll surface thematic overlaps, sentiment gaps, and key divergences. Which two would you like to compare?";
      }
    } else if (ctxData.context === "report" && ctxData.dataset) {
      msg = `Draft report for **${ctxData.dataset.name}** is open. I can refine sections, add an executive summary, or export to PDF. What would you like to do?`;
    } else if (ctxData.context === "agent") {
      msg = "Agent workflows panel is open. I can help you configure triggers, adjust thresholds, or create a new monitoring agent.";
    }

    if (msg) {
      setMessages((prev) => {
        const next = [
          ...prev,
          { id: makeId(), role: "ai" as const, content: msg, timestamp: "just now" },
        ];
        // For dataset context, append an inline dataset card as the next message
        if (ctxData.context === "dataset" && ctxData.dataset) {
          next.push({
            id: makeId(),
            role: "ai" as const,
            content: "",
            timestamp: "just now",
            richCard: "dataset",
            richDataset: ctxData.dataset,
          });
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxData.context, ctxData.dataset?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const getCopilotReply = (q: string): string => {
    const ql = q.toLowerCase();
    const ds = ctxData.dataset;

    if (ctxData.context === "dataset" && ds) {
      if (ql.includes("negative") || ql.includes("sentiment"))
        return `The primary driver of negative sentiment in **${ds.name}** is **${ds.topThemes[0]}** — appearing in ${ds.sentiment.negative}% of responses. Secondary factors include **${ds.topThemes[1] ?? "wait times"}** and **${ds.topThemes[2] ?? "app usability"}**. Anger is the dominant emotion at **${ds.emotionRate}%** emotion rate.`;
      if (ql.includes("theme"))
        return `Top themes in **${ds.name}**:\n**1. ${ds.topThemes[0]}** — most mentioned\n**2. ${ds.topThemes[1] ?? "Unresolved complaints"}** — growing\n**3. ${ds.topThemes[2] ?? "Digital experience"}** — emerging\n\nTheme Discovery agent last updated these 6 hours ago.`;
      if (ql.includes("risk"))
        return `**${ds.name}** has **${ds.risks.length}** active risk flags:\n${ds.risks.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nI recommend investigating **${ds.risks[0]}** before the next stakeholder review.`;
      if (ql.includes("summary") || ql.includes("report"))
        return `Quick summary of **${ds.name}**:\n\n• **${ds.responses.toLocaleString()} responses** across ${ds.waves} waves\n• Sentiment: **${ds.sentiment.positive}% positive**, ${ds.sentiment.negative}% negative\n• Emotion rate: **${ds.emotionRate}%**\n• Top concern: ${ds.topThemes[0]}\n\nWould you like me to generate a full PDF report?`;
      return `Based on **${ds.name}**, the overall emotion rate is **${ds.emotionRate}%** with **${ds.sentiment.positive}%** positive and **${ds.sentiment.negative}%** negative sentiment. Click **Ask Dataset** on the card to open the full analysis view, or ask me anything specific.`;
    }

    if (ql.includes("houston") || ql.includes("anger") || ql.includes("spike"))
      return "**Houston Parking — After Prompt Sync** shows a 22% anger spike above your 15% alert threshold. Primary driver: **Payment App Friction** — users report the new UI is confusing. Recommend comparing Wave 2 vs Wave 3 verbatims to isolate the prompt effect.";
    if (ql.includes("northwest") || ql.includes("stall") || ql.includes("wave 4"))
      return "**Northwest College Wave 4** stalled 3 days ago. Only **43%** of target responses collected (847 of 1,960). Deadline in 6 days. Want me to draft an alert for the collection team?";
    if (ql.includes("nbc") || ql.includes("positive") || ql.includes("improve"))
      return "**NBC Dispute** sentiment has been recovering over 7 days. Positive went from **18% → 26%** following the resolution announcement. I'd recommend a stakeholder update with this data.";
    if (ql.includes("compare"))
      return "The most interesting comparison right now is **Houston vs Austin Parking** — 62% thematic overlap but diverge significantly on anger (48% vs 31%). Want me to open the comparison view?";
    if (ql.includes("report"))
      return "I can generate reports for any of your 6 datasets. **Houston Parking** has the most actionable data for stakeholders right now. Should I draft it? It'll include sentiment overview, top themes, wave comparison, and executive recommendations.";
    if (ql.includes("agent") || ql.includes("monitor"))
      return "You have **2 agents running**: Sentinel (monitoring 4 datasets) and Data Quality Agent (14 items flagged last pass). **1 scheduled**: Theme Discovery daily at 6 AM. Want to adjust thresholds or create a new monitor?";
    if (ql.includes("biggest") || ql.includes("issue") || ql.includes("attention"))
      return "The most pressing issue right now is the **Houston Parking anger spike** — 22% above your threshold. Second priority is the **Northwest College stalled collection**. Click either card to investigate in depth.";
    return "I'm monitoring all 6 datasets in real-time. The most pressing issue is the **Houston Parking anger spike** (22% above threshold). Click any card to focus, or ask me anything specific.";
  };

  const sendMessage = (q: string) => {
    if (!q.trim()) return;
    setMessages((m) => [...m, { id: makeId(), role: "user", content: q, timestamp: "just now" }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: makeId(), role: "ai", content: getCopilotReply(q), timestamp: "just now" }]);
      setTyping(false);
    }, 900 + Math.random() * 500);
  };

  const chipSets: Record<CopilotCtx, string[]> = {
    default: ["What's the biggest issue today?", "Show anger spikes", "Compare Houston vs Austin", "Agent status"],
    dataset: ctxData.dataset
      ? ["What's driving negative?", "Show top themes", "List risk flags", "Generate summary"]
      : ["Sentiment breakdown", "Top themes", "List risks", "Compare datasets"],
    compare: ["Show thematic overlap", "Key divergences", "Which is healthier?", "Comparison PDF"],
    report: ["Add executive summary", "Export to PDF", "Adjust tone", "Add competitive context"],
    agent: ["Agent status", "Adjust thresholds", "Create new agent", "View alert history"],
  };

  const chips = chipSets[ctxData.context] ?? chipSets.default;

  const ctxLabel: Record<CopilotCtx, string> = {
    default: "Monitoring 6 datasets",
    dataset: ctxData.dataset ? `Analysing · ${ctxData.dataset.name}` : "Dataset analysis",
    compare: "Cross-dataset comparison",
    report: ctxData.dataset ? `Report · ${ctxData.dataset.name}` : "Report generation",
    agent: "Agent workflow management",
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFAF5]">
      {/* Header — Figma: Sidebar navigation */}
      <div className="border-b border-[#E9EAEB] flex-shrink-0 bg-[#FFFAF5] h-16">
        <div className="flex items-center gap-3 pl-4 pr-2 h-full">
          {/* Hamburger */}
          <button className="p-2 rounded-lg hover:bg-black/5 flex items-center justify-center flex-shrink-0 transition-colors">
            <Menu className="w-5 h-5 text-[#1A1A1A]" />
          </button>

          {/* Logo area */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Asa logo + Pro */}
            <div className="flex items-center gap-[5.7px] px-[6.5px] py-[6.5px] flex-shrink-0">
              <img
                src="https://www.figma.com/api/mcp/asset/e02029fc-00e6-42ea-b44e-6899c1727596"
                alt="Asa logomark"
                className="w-[19.7px] h-[19.7px] block flex-shrink-0"
              />
              <img
                src="https://www.figma.com/api/mcp/asset/b43993da-b289-4ef7-8a7f-e1dca76bf327"
                alt="Asa"
                className="w-[44px] h-[18px] block flex-shrink-0"
              />
              <div className="bg-[#02192B] rounded-[2.2px] px-[3px] py-[1.2px] flex items-center justify-center flex-shrink-0">
                <img
                  src="https://www.figma.com/api/mcp/asset/1aeec9e3-82be-431a-bf46-d4a21d659f04"
                  alt="Pro"
                  className="w-[13.6px] h-[6.7px] block"
                />
              </div>
            </div>

            {/* Chevron selector */}
            <button className="p-1.5 rounded-md hover:bg-black/5 flex items-center justify-center w-6 h-6 flex-shrink-0 transition-colors">
              <ChevronsUpDown className="w-4 h-4 text-[#535862]" />
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setMessages(INITIAL_COPILOT_MSGS); prevCtxKey.current = "default-"; }}
              className="p-1.5 rounded-md hover:bg-black/5 flex items-center justify-center w-6 h-6 flex-shrink-0 transition-colors"
              title="Reset conversation"
            >
              <Maximize2 className="w-4 h-4 text-[#535862]" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-black/5 flex items-center justify-center w-6 h-6 flex-shrink-0 transition-colors">
              <MoreVertical className="w-4 h-4 text-[#535862]" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[88%] bg-[#02192B] text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                </div>
              ) : msg.richCard === "dataset" && msg.richDataset ? (
                /* ── Inline Dataset Intelligence card ── */
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <img src="https://www.figma.com/api/mcp/asset/e02029fc-00e6-42ea-b44e-6899c1727596" alt="Asa" className="w-5 h-5 block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Database className="w-3.5 h-3.5 text-[#E83069]" />
                      <span className="text-[10px] font-semibold text-[#555]">Dataset Intelligence</span>
                    </div>
                    <div className="bg-[#FFFDFC] rounded-xl p-3 border border-[#E9EAEB]">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#02192B] flex items-center justify-center shadow-sm">
                            <Database className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-[#1A1A1A] truncate max-w-[150px]">{msg.richDataset.name}</span>
                        </div>
                        <StatusBadge status={msg.richDataset.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: "Positive", value: `${msg.richDataset.sentiment.positive}%`, color: "text-[#16a34a]", bg: "bg-[#F0FFF4]", border: "border-[#BBF7D0]" },
                          { label: "Negative", value: `${msg.richDataset.sentiment.negative}%`, color: "text-[#E83069]",  bg: "bg-[#FFF0F5]", border: "border-[#FFD6E5]" },
                          { label: "Emotion",  value: `${msg.richDataset.emotionRate}%`,         color: "text-[#7C3AED]", bg: "bg-[#F5F3FF]", border: "border-[#DDD6FE]" },
                        ].map((s) => (
                          <div key={s.label} className={cn("rounded-lg p-1.5 text-center border", s.bg, s.border)}>
                            <div className={cn("text-xs font-bold", s.color)}>{s.value}</div>
                            <div className="text-[10px] text-[#808080]">{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => onOpenDetail("dataset", msg.richDataset)}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-[#02192B] text-white font-medium hover:bg-[#02192B]/90 transition-colors text-center"
                        >
                          Open Full Analysis
                        </button>
                        <button
                          onClick={() => onOpenDetail("report", msg.richDataset)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E9EAEB] text-xs text-[#414651] font-medium hover:bg-[#FFFAF5] transition-colors"
                        >
                          Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <img src="https://www.figma.com/api/mcp/asset/e02029fc-00e6-42ea-b44e-6899c1727596" alt="Asa" className="w-5 h-5 block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.proactive && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#E83069] bg-transparent border border-[#E83069] px-1.5 py-0.5 rounded-full mb-1.5">
                        <Zap className="w-2.5 h-2.5" />
                        Proactive insight
                      </div>
                    )}
                    <div className="text-xs text-[#4D4D4D] leading-relaxed">
                      <BoldText text={msg.content} />
                    </div>
                    <div className="text-[10px] text-[#808080] mt-1">{msg.timestamp}</div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <img src="https://www.figma.com/api/mcp/asset/e02029fc-00e6-42ea-b44e-6899c1727596" alt="Asa" className="w-5 h-5 block" />
            </div>
            <div className="flex items-center gap-1 pt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#02192B]"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div className="flex gap-1.5 flex-wrap">
          {chips.map((chip) => (
            <motion.button
              key={chip}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => sendMessage(chip)}
              className="text-[11px] px-2.5 py-1.5 rounded-full bg-white hover:bg-[#FFFAF5] text-[#414651] border border-[#E9EAEB] hover:border-[#02192B]/30 transition-all whitespace-nowrap"
            >
              {chip}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-1 flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#FFFDFC] border border-[#E9EAEB] rounded-xl px-3 py-2.5 focus-within:border-[#02192B] focus-within:ring-2 focus-within:ring-[#02192B]/10 transition-all">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Ask about your data…"
            className="flex-1 text-xs bg-transparent outline-none text-[#1A1A1A] placeholder:text-[#808080]"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-7 h-7 rounded-lg bg-[#02192B] hover:bg-[#02192B]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-[#808080] mt-1.5 text-center">
          AI-generated insights · Always verify with source data
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
// PULSE PAGE
// ─────────────────────────────────────────────────────────────

const PULSE_ACTIONS = [
  {
    id: "compare",
    icon: GitCompare,
    title: "Compare Houston vs Austin Parking",
    description: "62% thematic overlap detected. Run a structured comparison to surface regional differences.",
    tags: ["High Impact", "2 datasets"],
    color: "text-[#111111]",
    bg: "from-[#FFF5EE]/80 to-[#FFEEDD]/80",
    border: "border-[#DDDDDD]",
    cta: "Start",
    resultMode: "compare" as PanelMode,
  },
  {
    id: "report",
    icon: FileText,
    title: "Review NBC Dispute Executive Summary",
    description: "AI draft ready with 87% confidence. Export for stakeholder distribution.",
    tags: ["Report Ready", "~5 min"],
    color: "text-[#444444]",
    bg: "from-[#FFFAF5]/80 to-[#FFFAF5]/80",
    border: "border-[#DDDDDD]",
    cta: "Review",
    resultMode: "report" as PanelMode,
  },
  {
    id: "investigate",
    icon: AlertTriangle,
    title: "Investigate Houston Sentiment Shift",
    description: "Anger sentiment +22% after prompt sync. Trace verbatims and isolate root cause.",
    tags: ["High Priority", "Sentiment"],
    color: "text-[#555555]",
    bg: "from-[#FFFAF5]/80 to-[#FFFAF5]/80",
    border: "border-[#F0F0F0]",
    cta: "Investigate",
    resultMode: "dataset" as PanelMode,
  },
  {
    id: "alert",
    icon: Inbox,
    title: "Alert on Northwest College Wave 4",
    description: "Data collection stalled. Notify the collection team or extend the deadline.",
    tags: ["Missing Data", "Action Needed"],
    color: "text-[#333333]",
    bg: "from-[#FFFAF5]/80 to-[#FFF5EE]/80",
    border: "border-[#EBEBEB]",
    cta: "Alert",
    resultMode: "agent" as PanelMode,
  },
];

function getMockPulseReply(q: string): string {
  if (q.match(/houston|parking/i))
    return "Houston Parking shows a **22% increase in anger sentiment** following the April prompt sync — above your 15% threshold. I'd recommend tracing the verbatims from April 12–15 to isolate the trigger. Want me to pull those?";
  if (q.match(/nbc|dispute|report/i))
    return "The NBC Dispute executive summary is **87% ready**. Key themes: billing disputes (41%), service quality (33%), resolution speed (26%). I can refine the tone or add an executive highlight. What would you like?";
  if (q.match(/northwest|college|wave/i))
    return "Northwest College Wave 4 is at **47% completion** and has been stalled for 3 days. Deadline is in 6 days. I can draft a notification to the collection team or suggest an extension. Which do you prefer?";
  if (q.match(/compare|austin/i))
    return "Houston and Austin Parking share **62% thematic overlap** — both surface parking costs and enforcement issues. Key divergence: Austin skews toward permit complaints while Houston focuses on metered pricing. Ready to run the full comparison?";
  if (q.match(/highlight|status|overview|today/i))
    return "Here's today's snapshot:\n\n• **Anger spike** — Houston Parking +22% sentiment shift\n• **Data stalled** — Northwest College Wave 4 (47% complete, 6 days left)\n• **Report ready** — NBC Dispute summary at 87% confidence\n\nWhich would you like to dig into?";
  return "I'm monitoring **6 active datasets** right now. The most urgent item is the sentiment spike in Houston Parking. I can also help you with the NBC report, the stalled Wave 4 collection, or anything else. What do you need?";
}

// ─────────────────────────────────────────────────────────────
// PULSE CHAT — TYPES & HELPERS
// ─────────────────────────────────────────────────────────────

type PulseRichType = "actions" | "dataset" | "report-types" | "report-preview" | "share-options";

interface PulseMsg {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: string;
  proactive?: boolean;
  richType?: PulseRichType;
  richData?: Record<string, unknown>;
}

function downloadReportPDF(reportType: string, dataset: Dataset) {
  const sentimentBarsHTML = [
    { label: "Positive", value: dataset.sentiment.positive, color: "#10b981" },
    { label: "Negative", value: dataset.sentiment.negative, color: "#ef4444" },
    { label: "Neutral",  value: dataset.sentiment.neutral,  color: "#68a3ff" },
  ].map(s => `<div class="bar-row"><span class="bar-label">${s.label}</span><div class="bar-track"><div class="bar-fill" style="width:${s.value}%;background:${s.color}"></div></div><span class="bar-pct">${s.value}%</span></div>`).join("");

  const themeBarsHTML = [
    { label: "Payment friction",   value: 67 },
    { label: "Wait times",         value: 54 },
    { label: "App usability",      value: 43 },
    { label: "Enforcement issues", value: 38 },
    { label: "Navigation",         value: 29 },
  ].map(t => `<div class="bar-row"><span class="bar-label">${t.label}</span><div class="bar-track"><div class="bar-fill" style="width:${t.value}%;background:linear-gradient(to right,#E83069,#FF6B35)"></div></div><span class="bar-pct">${t.value}%</span></div>`).join("");

  const waveData = [
    { wave: "Wave 1", pos: 48, neg: 28, neu: 24 },
    { wave: "Wave 2", pos: 43, neg: 33, neu: 24 },
    { wave: "Wave 3", pos: 38, neg: 38, neu: 24 },
    { wave: "Wave 4", pos: 31, neg: 50, neu: 19 },
  ];
  const waveBarsHTML = waveData.map(w =>
    `<div class="wave-group"><div class="wave-bars"><div class="wave-bar" style="height:${w.pos * 0.8}px;background:#22C55E"></div><div class="wave-bar" style="height:${w.neg * 0.8}px;background:#E83069"></div><div class="wave-bar" style="height:${w.neu * 0.8}px;background:#94A3B8"></div></div><div class="wave-lbl">${w.wave}</div></div>`
  ).join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${dataset.name} — ${reportType}</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#1A1A1A;background:#fff;padding:40px;font-size:13px;line-height:1.6}
    .logo{font-size:20px;font-weight:800;color:#E83069;letter-spacing:-0.5px;margin-bottom:2px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #E83069}
    .header-right{text-align:right;color:#888;font-size:11px;line-height:1.8}
    .report-title{font-size:26px;font-weight:800;color:#1A1A1A;margin-bottom:2px;letter-spacing:-0.5px}
    .report-sub{color:#888;font-size:12px}
    .tag{display:inline-block;padding:2px 8px;background:#FFF0F5;color:#E83069;border:1px solid #FFD6E5;border-radius:10px;font-size:10px;font-weight:700;letter-spacing:0.03em}
    .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
    .metric{background:#FFFAF5;border:1px solid #FFE8D6;border-radius:12px;padding:16px;text-align:center}
    .metric-val{font-size:28px;font-weight:800;color:#1A1A1A}
    .metric-lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-top:3px}
    .section{margin-bottom:26px}
    .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#BBB;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #F5F5F5}
    .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px}
    .bar-label{width:130px;font-size:11px;color:#444;flex-shrink:0}
    .bar-track{flex:1;height:9px;background:#F0F0F0;border-radius:5px;overflow:hidden}
    .bar-fill{height:100%;border-radius:5px}
    .bar-pct{width:34px;text-align:right;font-size:11px;font-weight:700;color:#1A1A1A}
    .wave-row{display:flex;gap:16px;height:96px;align-items:flex-end}
    .wave-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
    .wave-bars{display:flex;gap:2px;align-items:flex-end;height:80px}
    .wave-bar{width:12px;border-radius:3px 3px 0 0;min-height:3px}
    .wave-lbl{font-size:10px;color:#888;text-align:center}
    .legend{display:flex;gap:14px;margin-bottom:10px}
    .leg-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#555}
    .leg-dot{width:9px;height:9px;border-radius:2px}
    .finding{display:flex;gap:9px;margin-bottom:9px;font-size:12px;color:#333;line-height:1.5}
    .dot{width:6px;height:6px;border-radius:50%;background:#E83069;flex-shrink:0;margin-top:5px}
    .rec{display:flex;gap:10px;padding:11px 13px;background:#FFF8F5;border-left:3px solid #E83069;border-radius:6px;margin-bottom:9px;font-size:12px;color:#333;line-height:1.5}
    .rec-num{font-weight:800;color:#E83069;flex-shrink:0}
    .footer{margin-top:36px;padding-top:12px;border-top:1px solid #F0F0F0;display:flex;justify-content:space-between;font-size:10px;color:#BBB}
    @media print{body{padding:20px}@page{margin:14mm;size:A4 portrait}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">✦ canvs</div><div class="report-title">${dataset.name}</div><div class="report-sub">${reportType} &nbsp;·&nbsp; Q1 2026 &nbsp;·&nbsp; ${dataset.responses.toLocaleString()} responses</div></div>
    <div class="header-right"><div>Generated by <strong>Canvs AI</strong></div><div>March 16, 2026</div><div style="margin-top:6px"><span class="tag">CONFIDENTIAL</span></div></div>
  </div>
  <div class="metrics">
    <div class="metric"><div class="metric-val">${dataset.responses.toLocaleString()}</div><div class="metric-lbl">Responses</div></div>
    <div class="metric"><div class="metric-val">${dataset.questions}</div><div class="metric-lbl">Questions</div></div>
    <div class="metric"><div class="metric-val">${dataset.waves}</div><div class="metric-lbl">Waves</div></div>
    <div class="metric"><div class="metric-val">${dataset.emotionRate}%</div><div class="metric-lbl">Emotion Rate</div></div>
  </div>
  <div class="section"><div class="section-title">Sentiment Overview</div>${sentimentBarsHTML}</div>
  <div class="section"><div class="section-title">Top Themes</div>${themeBarsHTML}</div>
  <div class="section">
    <div class="section-title">Wave Trend Analysis</div>
    <div class="legend"><div class="leg-item"><div class="leg-dot" style="background:#22C55E"></div>Positive</div><div class="leg-item"><div class="leg-dot" style="background:#E83069"></div>Negative</div><div class="leg-item"><div class="leg-dot" style="background:#94A3B8"></div>Neutral</div></div>
    <div class="wave-row">${waveBarsHTML}</div>
  </div>
  <div class="section"><div class="section-title">Key Findings</div>
    ${["Anger sentiment +22% following April prompt sync — above 15% alert threshold","Payment friction mentioned in 67% of all negative verbatim responses",`Wave 4 shows the most significant negative shift across all ${dataset.waves} waves`,"App usability complaints cluster around checkout and permit renewal flows","Positive sentiment declined 17 percentage points from Wave 1 to Wave 4"].map(f=>`<div class="finding"><div class="dot"></div><div>${f}</div></div>`).join("")}
  </div>
  <div class="section"><div class="section-title">AI Recommendations</div>
    ${["Conduct root-cause analysis of April prompt sync to isolate anger trigger","Prioritise payment UI redesign — highest friction point across all respondent segments","Deploy targeted UX intervention focused on permit renewal and checkout flows","Implement Wave 5 early-warning system to catch sentiment spikes before 15% threshold"].map((r,i)=>`<div class="rec"><div class="rec-num">${i+1}.</div><div>${r}</div></div>`).join("")}
  </div>
  <div class="footer"><div>© 2026 Canvs AI · Confidential</div><div>${dataset.name} &nbsp;·&nbsp; ${reportType} &nbsp;·&nbsp; March 2026</div></div>
  </body></html>`;

  const win = window.open("", "_blank", "width=960,height=700");
  if (!win) { alert("Please allow pop-ups to download the report."); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 700);
}

// ── Share options bubble ──────────────────────────────────────
function PulseShareOptionsBubble({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const link = `https://app.canvs.ai/reports/share/${Math.random().toString(36).slice(2, 10)}`;
  const shareOptions = [
    { label: "Copy Link", icon: "🔗", action: () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } },
    { label: "Slack",     icon: "💬", action: () => {} },
    { label: "Teams",     icon: "🟦", action: () => {} },
    { label: "WhatsApp",  icon: "🟢", action: () => {} },
    { label: "Email Again", icon: "📧", action: () => {} },
  ];
  return (
    <div className="mt-2 space-y-2.5">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#FFFAF5] border border-[#FFE8D6] rounded-xl">
        <ExternalLink className="w-3.5 h-3.5 text-[#E83069] flex-shrink-0" />
        <span className="text-xs text-[#555] truncate flex-1 font-mono">{link}</span>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs font-bold text-[#E83069] hover:text-[#C71E52] flex-shrink-0 transition-colors">
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-[#AAA] px-0.5">Sent to <strong className="text-[#555]">{email}</strong> · Share anywhere else:</p>
      <div className="flex gap-2 flex-wrap">
        {shareOptions.map((opt) => (
          <button key={opt.label} onClick={opt.action}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-[#EBEBEB] rounded-lg hover:border-[#E83069] hover:text-[#E83069] transition-colors">
            <span>{opt.icon}</span>{opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Report preview bubble ─────────────────────────────────────
function PulseReportPreviewBubble({ richData, onShareEmail, onDownload }: {
  richData: Record<string, unknown>;
  onShareEmail: (reportType: string) => void;
  onDownload: (reportType: string, dataset: Dataset) => void;
}) {
  const dataset = richData.dataset as Dataset;
  const reportType = richData.reportType as string;
  const sentimentBars = [
    { label: "Positive", value: dataset.sentiment.positive, color: "#10b981" },
    { label: "Negative", value: dataset.sentiment.negative, color: "#ef4444" },
    { label: "Neutral",  value: dataset.sentiment.neutral,  color: "#68a3ff" },
  ];
  const themes = [
    { label: "Payment friction",   value: 67 },
    { label: "Wait times",         value: 54 },
    { label: "App usability",      value: 43 },
    { label: "Enforcement issues", value: 38 },
    { label: "Navigation",         value: 29 },
  ];
  const waves = [
    { label: "W1", pos: 48, neg: 28 },
    { label: "W2", pos: 43, neg: 33 },
    { label: "W3", pos: 38, neg: 38 },
    { label: "W4", pos: 31, neg: 50 },
  ];
  return (
    <div className="mt-2 rounded-2xl border border-[#F0F0F0] overflow-hidden bg-white shadow-sm w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E83069] to-[#C71E52] px-5 py-4">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{reportType}</span>
        <h3 className="text-base font-bold text-white mt-0.5">{dataset.name}</h3>
        <p className="text-xs text-white/70 mt-0.5">March 2026 · Q1 Analysis · {dataset.responses.toLocaleString()} responses · {dataset.waves} waves</p>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-4 border-b border-[#F5F5F5]">
        {[
          { label: "Responses", value: dataset.responses.toLocaleString() },
          { label: "Questions",  value: dataset.questions },
          { label: "Waves",      value: dataset.waves },
          { label: "Emotion",    value: `${dataset.emotionRate}%` },
        ].map((m) => (
          <div key={m.label} className="p-3 text-center border-r last:border-r-0 border-[#F5F5F5]">
            <p className="text-sm font-bold text-[#1A1A1A]">{m.value}</p>
            <p className="text-xs text-[#999]">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-5">
        {/* Sentiment */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#CCC] mb-2.5">Sentiment Overview</p>
          {sentimentBars.map((s) => (
            <div key={s.label} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#555] w-16 flex-shrink-0">{s.label}</span>
              <div className="flex-1 h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                  transition={{ duration: 0.9, delay: 0.1 }}
                  className="h-full rounded-full" style={{ backgroundColor: s.color }} />
              </div>
              <span className="text-xs font-bold text-[#333] w-8 text-right">{s.value}%</span>
            </div>
          ))}
        </div>

        {/* Themes */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#CCC] mb-2.5">Top Themes</p>
          {themes.map((t, i) => (
            <div key={t.label} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#555] w-32 flex-shrink-0 truncate">{t.label}</span>
              <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${t.value}%` }}
                  transition={{ duration: 0.9, delay: 0.15 * i + 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#E83069] to-[#FF6B35]" />
              </div>
              <span className="text-xs font-bold text-[#333] w-8 text-right">{t.value}%</span>
            </div>
          ))}
        </div>

        {/* Wave trend */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#CCC] mb-2.5">Wave Trend</p>
          <div className="flex items-end gap-3 h-16">
            {waves.map((w, i) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex gap-0.5 items-end" style={{ height: "52px" }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${w.pos * 0.85}px` }}
                    transition={{ duration: 0.7, delay: i * 0.1 }}
                    className="flex-1 rounded-t bg-[#22C55E] min-h-[2px]" style={{ alignSelf: "flex-end" }} />
                  <motion.div initial={{ height: 0 }} animate={{ height: `${w.neg * 0.85}px` }}
                    transition={{ duration: 0.7, delay: i * 0.1 + 0.05 }}
                    className="flex-1 rounded-t bg-[#E83069] min-h-[2px]" style={{ alignSelf: "flex-end" }} />
                </div>
                <span className="text-[10px] text-[#AAA]">{w.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-[#666]"><span className="w-2 h-2 rounded-sm bg-[#22C55E] inline-block" />Positive</span>
            <span className="flex items-center gap-1 text-[10px] text-[#666]"><span className="w-2 h-2 rounded-sm bg-[#E83069] inline-block" />Negative</span>
          </div>
        </div>

        {/* Key findings */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#CCC] mb-2.5">Key Findings</p>
          <ul className="space-y-1.5">
            {["Anger sentiment +22% following April prompt sync — above 15% threshold",
              "Payment friction mentioned in 67% of all negative responses",
              "Wave 4 shows most significant negative shift; positive down 17pts since Wave 1",
              "App usability complaints cluster around checkout and permit renewal flows"].map((f) => (
              <li key={f} className="flex gap-2 text-xs text-[#444] leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E83069] flex-shrink-0 mt-1.5" />{f}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#CCC] mb-2.5">AI Recommendations</p>
          <ol className="space-y-1.5">
            {["Review April prompt sync — root cause of anger spike",
              "Prioritise payment UI redesign — highest friction touchpoint",
              "Deploy UX intervention for permit renewal & checkout flows"].map((r, i) => (
              <li key={r} className="flex gap-2 text-xs text-[#444] leading-relaxed">
                <span className="font-bold text-[#E83069] flex-shrink-0">{i + 1}.</span>{r}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-4 pb-4 pt-1 flex gap-2 border-t border-[#F5F5F5]">
        <button onClick={() => onDownload(reportType, dataset)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1A1A1A] text-white rounded-xl hover:bg-[#2D2D2D] transition-colors">
          <Download className="w-3.5 h-3.5" /> Download PDF
        </button>
        <button onClick={() => onShareEmail(reportType)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#E83069] text-white rounded-xl hover:bg-[#C71E52] transition-colors">
          <Send className="w-3.5 h-3.5" /> Share via Email
        </button>
      </div>
    </div>
  );
}

// ── Report types bubble ───────────────────────────────────────
function PulseReportTypesBubble({ richData, onSelect }: {
  richData: Record<string, unknown>;
  onSelect: (type: string, dataset: Dataset) => void;
}) {
  const dataset = (richData.dataset as Dataset) ?? DATASETS[0];
  const types = [
    { value: "Executive Summary",   icon: Star,       desc: "High-level insights for leadership" },
    { value: "Sentiment Analysis",  icon: TrendingUp,  desc: "Deep dive into emotion & tone" },
    { value: "Theme Report",        icon: Sparkles,    desc: "Emerging topics & cluster analysis" },
    { value: "Dataset Comparison",  icon: GitCompare,  desc: "Side-by-side cross-dataset analysis" },
    { value: "Quality Assessment",  icon: BarChart2,   desc: "Data health & completeness" },
    { value: "Custom Report",       icon: Zap,         desc: "Build with your own instructions" },
  ];
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {types.map((t) => (
        <button key={t.value} onClick={() => onSelect(t.value, dataset)}
          className="text-left p-3 rounded-xl border border-[#F0E8E0] bg-[#FFFAF5] hover:border-[#E83069] hover:bg-white transition-all group">
          <t.icon className="w-4 h-4 text-[#E83069] mb-1.5" />
          <p className="text-xs font-semibold text-[#1A1A1A]">{t.value}</p>
          <p className="text-xs text-[#888] mt-0.5 leading-relaxed">{t.desc}</p>
        </button>
      ))}
    </div>
  );
}

// ── Actions bubble ────────────────────────────────────────────
function PulseActionsBubble({ onActionClick }: {
  onActionClick: (action: typeof PULSE_ACTIONS[number]) => void;
}) {
  const items = [
    { icon: GitCompare,    title: "Compare Houston vs Austin",    desc: "62% thematic overlap detected",    cta: "Start",        action: PULSE_ACTIONS[0] },
    { icon: FileText,      title: "Review NBC Dispute Summary",   desc: "AI draft ready · 87% confidence", cta: "Review",       action: PULSE_ACTIONS[1] },
    { icon: AlertTriangle, title: "Investigate Houston Sentiment", desc: "Anger +22% after prompt sync",    cta: "Investigate",  action: PULSE_ACTIONS[2] },
    { icon: Inbox,         title: "Alert on Northwest Wave 4",    desc: "Data collection stalled",          cta: "Alert",        action: PULSE_ACTIONS[3] },
  ];
  return (
    <div className="mt-1.5 space-y-1.5 w-full">
      <div className="flex items-center gap-1.5 mb-2">
        <Target className="w-3.5 h-3.5 text-[#E83069]" />
        <span className="text-xs font-semibold text-[#555]">Suggested Next Actions</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-[#FFF0F5] text-[#E83069] border border-[#FFD6E5] rounded-full font-semibold">AI</span>
      </div>
      {items.map((a) => (
        <div key={a.title}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFAF5] border border-[#F0E8E0] hover:border-[#E83069]/40 hover:bg-white cursor-pointer transition-all group"
          onClick={() => onActionClick(a.action)}>
          <div className="w-7 h-7 rounded-lg bg-white border border-[#F0E8E0] flex items-center justify-center flex-shrink-0 group-hover:border-[#FFD6E5]">
            <a.icon className="w-3.5 h-3.5 text-[#E83069]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1A1A1A] leading-snug">{a.title}</p>
            <p className="text-xs text-[#888] mt-0.5">{a.desc}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-[#E83069] text-white rounded-lg group-hover:bg-[#C71E52] transition-colors flex-shrink-0">{a.cta}</span>
        </div>
      ))}
    </div>
  );
}

// ── Dataset intelligence bubble ───────────────────────────────
function PulseDatasetBubble({ onAskDataset, onCompare, onReportInChat, onAgent }: {
  onAskDataset: () => void;
  onCompare: (d: Dataset) => void;
  onReportInChat: (d: Dataset) => void;
  onAgent: () => void;
}) {
  return (
    <div className="mt-1.5 w-full">
      <div className="flex items-center gap-1.5 mb-2">
        <Database className="w-3.5 h-3.5 text-[#E83069]" />
        <span className="text-xs font-semibold text-[#555]">Dataset Intelligence</span>
      </div>
      <DatasetCard
        dataset={DATASETS[0]}
        index={0}
        isSelected={false}
        onSelect={onAskDataset}
        onAsk={onAskDataset}
        onCompare={onCompare}
        onReport={(d) => onReportInChat(d)}
        onAgent={() => onAgent()}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHAT SESSION TYPES + SESSION SIDEBAR
// ─────────────────────────────────────────────────────────────

interface ChatSession {
  id: string;
  name: string;
  msgs: PulseMsg[];
  createdAt: string;
  updatedAt: string;
}

function AsaLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M19.5424 9.24455C19.5642 9.24455 19.5859 9.24455 19.6058 9.24268C21.9052 9.13014 23.8029 7.29392 23.985 4.9988C24.2108 2.14779 21.8498 -0.210753 19.0002 0.0149653C16.7861 0.189073 14.981 1.96373 14.7733 4.17614C14.7634 4.27128 14.7578 4.3658 14.7553 4.45907C14.7018 6.00241 14.0863 7.47238 12.9944 8.56242L12.5548 9.00142C12.2464 9.30984 11.7478 9.30984 11.4406 9.00142L11.3853 8.94608C10.922 8.48283 10.6553 7.84982 10.6926 7.19692C10.7025 7.01099 10.7007 6.82072 10.6826 6.6292C10.5204 4.88004 9.1114 3.46168 7.36232 3.28757C5.0095 3.05377 3.0484 5.01684 3.28405 7.36916C3.46002 9.11646 4.87706 10.523 6.62613 10.6853C6.81827 10.7033 7.00791 10.7071 7.19196 10.6952C7.84483 10.6598 8.47842 10.9247 8.94103 11.3879L8.99637 11.4433C9.30477 11.7517 9.30477 12.2504 8.99637 12.557L8.56112 12.9922C7.46865 14.0841 6.00062 14.6979 4.45922 14.7532C4.43746 14.7532 4.4157 14.7532 4.39394 14.7551C2.09272 14.872 0.196906 16.7082 0.014724 19.0014C-0.209118 21.8506 2.14992 24.2091 4.99955 23.9853C7.21558 23.8112 9.02062 22.0365 9.22829 19.8222C9.23824 19.7271 9.24384 19.6326 9.24632 19.5374C9.2998 17.9941 9.91536 16.5223 11.0072 15.4297L11.4369 15.0007C11.7453 14.6923 12.2439 14.6923 12.5511 15.0007L12.6145 15.0641C13.0759 15.5249 13.3426 16.1585 13.3072 16.8095C13.2972 16.9955 13.301 17.1833 13.319 17.3754C13.485 19.1227 14.894 20.5392 16.6412 20.7114C18.9878 20.9427 20.9452 18.9878 20.7176 16.6392C20.5472 14.8863 19.1246 13.4735 17.3712 13.3131C17.179 13.295 16.9875 13.2913 16.801 13.3031C16.1462 13.3404 15.5108 13.0737 15.0476 12.6104L14.9941 12.557C14.6857 12.2485 14.6857 11.7498 14.9941 11.4433L15.4337 11.0043C16.5262 9.91238 17.996 9.29865 19.5418 9.24331V9.24517L19.5424 9.24455Z" />
    </svg>
  );
}

function SessionSidebarItem({
  session,
  isActive,
  isEditing,
  editName,
  onLoad,
  onDelete,
  onShare,
  onDoubleClick,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editName: string;
  onLoad: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onEditChange: (v: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
}) {
  const editRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (isEditing) editRef.current?.focus(); }, [isEditing]);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all text-sm",
        isActive ? "bg-[#1A1A1A] text-white" : "text-[#444444] hover:bg-[#F5F5F5]"
      )}
      onClick={onLoad}
      onDoubleClick={onDoubleClick}
    >
      <MessageSquare className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-white" : "text-[#999]")} />
      {isEditing ? (
        <input
          ref={editRef}
          value={editName}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditCommit}
          onKeyDown={(e) => { if (e.key === "Enter") onEditCommit(); if (e.key === "Escape") onEditCancel(); }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent outline-none text-xs font-medium border-b border-[#E83069] text-[#1A1A1A]"
        />
      ) : (
        <span className="flex-1 min-w-0 text-xs font-medium truncate">{session.name}</span>
      )}
      {!isEditing && (
        <div className={cn("flex items-center gap-0.5 flex-shrink-0", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")} onClick={(e) => e.stopPropagation()}>
          <button title="Share" onClick={onShare} className={cn("w-5 h-5 rounded flex items-center justify-center transition-colors", isActive ? "hover:bg-white/20" : "hover:bg-[#E2E2E2]")}>
            <Share2 className={cn("w-3 h-3", isActive ? "text-white" : "text-[#888]")} />
          </button>
          <button title="Delete" onClick={onDelete} className={cn("w-5 h-5 rounded flex items-center justify-center transition-colors", isActive ? "hover:bg-white/20" : "hover:bg-[#FFE5E5]")}>
            <Trash2 className={cn("w-3 h-3", isActive ? "text-white" : "text-[#888]")} />
          </button>
        </div>
      )}
    </div>
  );
}

function PulsePage({
  onCompare,
  onAgent,
}: {
  onCompare?: (d: Dataset) => void;
  onReport?: () => void;
  onAgent?: () => void;
}) {
  // ── Session state (localStorage-persisted) ─────────────────
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try { const s = localStorage.getItem("pulse-sessions"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState("");

  // ── Chat state ──────────────────────────────────────────────
  const [msgs, setMsgs] = useState<PulseMsg[]>([]);
  const [selectedAction, setSelectedAction] = useState<typeof PULSE_ACTIONS[number] | null>(null);
  const [greetingPhase, setGreetingPhase] = useState<"icon" | "typing" | "ds-loading" | "ds-ready" | "actions" | "complete">("icon");
  const [typedText, setTypedText]         = useState("");
  const [visibleActions, setVisibleActions] = useState(0);
  const [inputVal, setInputVal]           = useState("");
  const [inputPlaceholder, setInputPlaceholder] = useState("Ask about your data...");
  const [chatMode, setChatMode]           = useState<"default" | "email-share">("default");
  const [pendingReportType, setPendingReportType] = useState("");
  const [isTyping, setIsTyping]           = useState(false);
  const [copilotCtx, setCopilotCtx]       = useState<CopilotCtxData>({ context: "default" });
  const [isListening, setIsListening]     = useState(false);
  const recognitionRef = useRef<typeof window extends { SpeechRecognition: infer T } ? InstanceType<T & (new () => unknown)> : unknown>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const GREETING_TEXT = `Hey Talha 👋 I'm Asa, your AI analyst. I've been doing some analysis while you were away — here's what I found across your 5 datasets:\n\nHouston Parking has a 22% anger sentiment spike following the April prompt sync, the largest emotion shift in 90 days. Northwest College Wave 4 collection appears stalled with 400+ missing responses — action may be needed before the deadline. Versant NBC Dispute has stabilized with anger down 18% from peak, worth sharing with stakeholders. ECC 2026 is strong with 64% positive sentiment and high confidence across all waves.\n\nHere's the most relevant dataset right now:`;

  // ── Generative intro on mount ───────────────────────────────
  useEffect(() => {
    let charIdx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: show icon for 1.4s
    timers.push(setTimeout(() => {
      setGreetingPhase("typing");
      // Phase 2: type text character by character
      const interval = setInterval(() => {
        charIdx += 5;
        setTypedText(GREETING_TEXT.slice(0, charIdx));
        if (charIdx >= GREETING_TEXT.length) {
          clearInterval(interval);
          setTypedText(GREETING_TEXT);
          // Phase 3: dataset skeleton
          timers.push(setTimeout(() => {
            setGreetingPhase("ds-loading");
            // Phase 4: real dataset card
            timers.push(setTimeout(() => {
              setGreetingPhase("ds-ready");
              // Phase 5: reveal action items one by one
              timers.push(setTimeout(() => {
                setGreetingPhase("actions");
                [0, 1, 2, 3].forEach((i) => {
                  timers.push(setTimeout(() => setVisibleActions(i + 1), i * 250));
                });
                timers.push(setTimeout(() => setGreetingPhase("complete"), 4 * 250 + 100));
              }, 400));
            }, 1200));
          }, 300));
        }
      }, 28);
    }, 1400));

    return () => { timers.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist sessions to localStorage ───────────────────────
  useEffect(() => {
    try { localStorage.setItem("pulse-sessions", JSON.stringify(sessions)); } catch {}
  }, [sessions]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = bottomRef.current;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [msgs, isTyping, greetingPhase, visibleActions]);

  // ── Session management ──────────────────────────────────────
  function saveCurrentSession() {
    if (!msgs.length) return;
    const now = new Date().toISOString();
    if (activeSessionId) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, msgs, updatedAt: now } : s));
    } else {
      const firstUserMsg = msgs.find(m => m.role === "user");
      const name = firstUserMsg ? firstUserMsg.content.slice(0, 40) : "Chat " + new Date().toLocaleDateString();
      const newSession: ChatSession = { id: `session-${Date.now()}`, name, msgs, createdAt: now, updatedAt: now };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    }
  }

  function startNewChat() {
    saveCurrentSession();
    setActiveSessionId(null);
    setSelectedAction(null);
    setChatMode("default");
    setInputVal("");
    setMsgs([]);
    setTypedText("");
    setVisibleActions(0);
    setGreetingPhase("icon");
    // Re-trigger generative intro after a brief delay
    let charIdx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      setGreetingPhase("typing");
      const GREETING_TEXT_NEW = `Hey Talha 👋 I'm Asa, your AI analyst. I've been doing some analysis while you were away — here's what I found across your 5 datasets:\n\nHouston Parking has a 22% anger sentiment spike following the April prompt sync, the largest emotion shift in 90 days. Northwest College Wave 4 collection appears stalled with 400+ missing responses — action may be needed before the deadline. Versant NBC Dispute has stabilized with anger down 18% from peak, worth sharing with stakeholders. ECC 2026 is strong with 64% positive sentiment and high confidence across all waves.\n\nHere's the most relevant dataset right now:`;
      const interval = setInterval(() => {
        charIdx += 5;
        setTypedText(GREETING_TEXT_NEW.slice(0, charIdx));
        if (charIdx >= GREETING_TEXT_NEW.length) {
          clearInterval(interval);
          setTypedText(GREETING_TEXT_NEW);
          timers.push(setTimeout(() => { setGreetingPhase("ds-loading"); timers.push(setTimeout(() => { setGreetingPhase("ds-ready"); timers.push(setTimeout(() => { setGreetingPhase("actions"); [0,1,2,3].forEach(i => timers.push(setTimeout(() => setVisibleActions(i+1), i*250))); timers.push(setTimeout(() => setGreetingPhase("complete"), 1100)); }, 400)); }, 1200)); }, 300));
        }
      }, 28);
    }, 1400));
  }

  function loadSession(s: ChatSession) {
    saveCurrentSession();
    setActiveSessionId(s.id);
    setMsgs(s.msgs);
    setSelectedAction(null);
    setChatMode("default");
    setInputVal("");
    setGreetingPhase("complete");
    setTypedText("");
    setVisibleActions(4);
  }

  function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMsgs([]);
      setGreetingPhase("complete");
      setTypedText("");
      setVisibleActions(4);
    }
  }

  function shareSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const url = `${window.location.origin}/?view=pulse&session=${id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied!")).catch(() => toast.success("Share link: " + url));
  }

  function startEditing(id: string, currentName: string) {
    setEditingId(id);
    setEditName(currentName);
  }

  function commitRename() {
    if (editingId && editName.trim()) {
      setSessions(prev => prev.map(s => s.id === editingId ? { ...s, name: editName.trim() } : s));
    }
    setEditingId(null);
    setEditName("");
  }

  // ── Voice input ─────────────────────────────────────────────
  function toggleVoice() {
    const SR = (window as unknown as { SpeechRecognition?: new() => { continuous: boolean; interimResults: boolean; onresult: (e: unknown) => void; onerror: () => void; onend: () => void; start: () => void; stop: () => void; }; webkitSpeechRecognition?: new() => { continuous: boolean; interimResults: boolean; onresult: (e: unknown) => void; onerror: () => void; onend: () => void; start: () => void; stop: () => void; } }).SpeechRecognition
      || (window as unknown as { SpeechRecognition?: new() => unknown; webkitSpeechRecognition?: new() => { continuous: boolean; interimResults: boolean; onresult: (e: unknown) => void; onerror: () => void; onend: () => void; start: () => void; stop: () => void; } }).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser"); return; }
    if (isListening) {
      (recognitionRef.current as { stop: () => void } | null)?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: unknown) => {
      const e = event as { results: { [key: number]: { [key: number]: { transcript: string } } } };
      const transcript = e.results[0][0].transcript;
      setInputVal(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    (recognitionRef as React.MutableRefObject<unknown>).current = recognition;
    setIsListening(true);
  }

  function addMsg(m: Omit<PulseMsg, "id">) {
    setMsgs(p => [...p, { ...m, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  }
  function aiTypingThen(ms: number, m: Omit<PulseMsg, "id">) {
    setIsTyping(true);
    setTimeout(() => { setIsTyping(false); addMsg(m); }, ms);
  }

  function handleActionClick(action: typeof PULSE_ACTIONS[number]) {
    if (action.resultMode === "compare") {
      addMsg({ role: "user", content: action.title, timestamp: "just now" });
      if (onCompare) onCompare(DATASETS[0]);
      aiTypingThen(700, { role: "ai", content: "Opening comparison… Houston and Austin Parking share **62% thematic overlap**. Running the full cross-dataset analysis now.", timestamp: "just now" });
      return;
    }
    if (action.resultMode === "report") {
      addMsg({ role: "user", content: action.title, timestamp: "just now" });
      aiTypingThen(700, { role: "ai", content: "Sure — what type of report would you like?", timestamp: "just now", richType: "report-types", richData: { dataset: DATASETS[1] } });
      return;
    }
    if (action.resultMode === "agent") {
      if (onAgent) onAgent();
      addMsg({ role: "user", content: action.title, timestamp: "just now" });
      aiTypingThen(600, { role: "ai", content: "Opening agent configuration…", timestamp: "just now" });
      return;
    }
    // dataset → respond in chat, no panel
    addMsg({ role: "user", content: action.title, timestamp: "just now" });
    aiTypingThen(800, { role: "ai", content: `Investigating **Houston Parking — After Prompt Sync**. Here's the dataset overview:`, timestamp: "just now", richType: "dataset", richData: { dataset: DATASETS[0] } });
  }

  function handleReportTypeSelect(typeName: string, dataset: Dataset) {
    setPendingReportType(typeName);
    addMsg({ role: "user", content: typeName, timestamp: "just now" });
    aiTypingThen(1200, { role: "ai", content: `Here's your **${typeName}** for **${dataset.name}**:`, timestamp: "just now", richType: "report-preview", richData: { reportType: typeName, dataset } });
  }

  function handleShareEmail(reportType: string) {
    setPendingReportType(reportType);
    setChatMode("email-share");
    setInputPlaceholder("Type recipient email address and press Enter…");
    addMsg({ role: "ai", content: "Who should I send this to? Type their email address below.", timestamp: "just now" });
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function send(text?: string) {
    const q = (text ?? inputVal).trim();
    if (!q) return;
    setInputVal("");
    if (chatMode === "email-share") {
      addMsg({ role: "user", content: q, timestamp: "just now" });
      setChatMode("default");
      setInputPlaceholder("Ask about your data...");
      aiTypingThen(900, { role: "ai", content: `Report sent to **${q}**. Here's your shareable link and more ways to distribute:`, timestamp: "just now", richType: "share-options", richData: { email: q, reportType: pendingReportType } });
      return;
    }
    addMsg({ role: "user", content: q, timestamp: "just now" });
    if (q.match(/report|summary|export/i)) {
      aiTypingThen(800, { role: "ai", content: "Sure — what type of report would you like?", timestamp: "just now", richType: "report-types", richData: { dataset: DATASETS[0] } });
      return;
    }
    setIsTyping(true);
    setTimeout(() => { setIsTyping(false); addMsg({ role: "ai", content: getMockPulseReply(q), timestamp: "just now" }); }, 1100);
  }

  // Render rich content for a message
  function renderRich(msg: PulseMsg) {
    if (!msg.richType) return null;
    switch (msg.richType) {
      case "actions":
        return <PulseActionsBubble onActionClick={handleActionClick} />;
      case "dataset":
        return (
          <PulseDatasetBubble
            onAskDataset={() => { setCopilotCtx({ context: "default", dataset: DATASETS[0] }); setSelectedAction(PULSE_ACTIONS.find(a => a.resultMode === "dataset") ?? PULSE_ACTIONS[2]); }}
            onCompare={(d) => { if (onCompare) onCompare(d); }}
            onReportInChat={(d) => { addMsg({ role: "user", content: `Generate report for ${d.name}`, timestamp: "just now" }); aiTypingThen(700, { role: "ai", content: "What type of report would you like?", timestamp: "just now", richType: "report-types", richData: { dataset: d } }); }}
            onAgent={() => { if (onAgent) onAgent(); }}
          />
        );
      case "report-types":
        return <PulseReportTypesBubble richData={msg.richData ?? {}} onSelect={handleReportTypeSelect} />;
      case "report-preview":
        return <PulseReportPreviewBubble richData={msg.richData ?? {}} onShareEmail={handleShareEmail} onDownload={downloadReportPDF} />;
      case "share-options":
        return <PulseShareOptionsBubble email={(msg.richData?.email as string) ?? ""} />;
    }
  }

  // ── Full-height chat (no sidebar, no split panel) ──────────
  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* ── Chat panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FFFAF5]">
        {/* Scrollable messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center px-4 pt-8 pb-4">

            {/* ── Large centered Asa icon (greeting phase) ── */}
            <AnimatePresence>
              {greetingPhase === "icon" && (
                <motion.div
                  key="asa-hero"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                  className="flex flex-col items-center justify-center gap-6 py-24"
                >
                  <motion.div
                    animate={{ scale: [1, 1.07, 1], opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <AsaLogoIcon className="w-20 h-20 text-[#E83069]" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-[#999999] font-medium"
                  >Asa is preparing your analysis…</motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full" style={{ maxWidth: "min(720px, 60vw)" }}>
              <div className="flex flex-col gap-4">
                {/* ── Unified Asa greeting bubble (always first) ── */}
                {greetingPhase !== "icon" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative"
                  >
                    <AsaLogoIcon className="absolute -left-9 top-1 w-6 h-6 text-[#E83069]" />
                    <div className="w-full space-y-3">

                      {/* Typed greeting text */}
                      <div className="bg-white border border-[#EBEBEB] rounded-2xl px-4 py-3 text-sm leading-relaxed text-[#1A1A1A] shadow-sm">
                        {typedText.split("\n").map((line, i) => (
                          <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                        ))}
                        {greetingPhase === "typing" && (
                          <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.7, repeat: Infinity }}
                            className="inline-block w-0.5 h-4 bg-[#E83069] ml-0.5 align-middle rounded-full"
                          />
                        )}
                      </div>

                      {/* Dataset card — skeleton → real */}
                      {(greetingPhase === "ds-loading" || greetingPhase === "ds-ready" || greetingPhase === "actions" || greetingPhase === "complete") && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Database className="w-3.5 h-3.5 text-[#E83069]" />
                            <span className="text-xs font-semibold text-[#555]">Dataset Intelligence</span>
                          </div>
                          {greetingPhase === "ds-loading" ? (
                            <div className="bg-white rounded-2xl border border-[#F5F5F5] p-4 space-y-3 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#F0F0F0] animate-pulse" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-3.5 bg-[#F0F0F0] rounded-full animate-pulse w-3/4" />
                                  <div className="h-2.5 bg-[#F5F5F5] rounded-full animate-pulse w-1/2" />
                                </div>
                              </div>
                              <div className="h-2 bg-[#F5F5F5] rounded-full animate-pulse" />
                              <div className="h-2 bg-[#F5F5F5] rounded-full animate-pulse w-4/5" />
                              <div className="flex gap-2 pt-1">
                                <div className="h-7 bg-[#F0F0F0] rounded-lg animate-pulse flex-1" />
                                <div className="h-7 bg-[#F5F5F5] rounded-lg animate-pulse flex-1" />
                                <div className="h-7 bg-[#F5F5F5] rounded-lg animate-pulse flex-1" />
                              </div>
                            </div>
                          ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                              <DatasetCard
                                dataset={DATASETS[0]}
                                index={0}
                                isSelected={false}
                                onSelect={() => { setCopilotCtx({ context: "default", dataset: DATASETS[0] }); setSelectedAction(PULSE_ACTIONS.find(a => a.resultMode === "dataset") ?? PULSE_ACTIONS[2]); }}
                                onAsk={() => { setCopilotCtx({ context: "default", dataset: DATASETS[0] }); }}
                                onCompare={(d) => { if (onCompare) onCompare(d); }}
                                onReport={(d) => { addMsg({ role: "user", content: `Generate report for ${d.name}`, timestamp: "just now" }); aiTypingThen(700, { role: "ai", content: "What type of report would you like?", timestamp: "just now", richType: "report-types", richData: { dataset: d } }); }}
                                onAgent={() => { if (onAgent) onAgent(); }}
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* Suggested next actions — hidden once user has sent a message */}
                      {(greetingPhase === "actions" || greetingPhase === "complete") && visibleActions > 0 && msgs.length === 0 && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                          <div className="flex items-center gap-1.5 mb-2 mt-1">
                            <Target className="w-3.5 h-3.5 text-[#E83069]" />
                            <span className="text-xs font-semibold text-[#555]">Suggested Next Actions</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#FFF0F5] text-[#E83069] border border-[#FFD6E5] rounded-full font-semibold">AI</span>
                          </div>
                          <div className="space-y-1.5">
                            {PULSE_ACTIONS.slice(0, visibleActions).map((action, i) => (
                              <motion.div
                                key={action.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.05 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFAF5] border border-[#F0E8E0] hover:border-[#E83069]/40 hover:bg-white cursor-pointer transition-all group"
                                onClick={() => handleActionClick(action)}
                              >
                                <div className="w-7 h-7 rounded-lg bg-white border border-[#F0E8E0] flex items-center justify-center flex-shrink-0 group-hover:border-[#FFD6E5]">
                                  <action.icon className="w-3.5 h-3.5 text-[#E83069]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-[#1A1A1A] leading-snug">{action.title}</p>
                                  <p className="text-xs text-[#888] mt-0.5">{action.description.split(".")[0]}.</p>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 bg-[#E83069] text-white rounded-lg group-hover:bg-[#C71E52] transition-colors flex-shrink-0">{action.cta}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                    </div>
                  </motion.div>
                )}

                {/* ── Chat messages (appear after greeting) ── */}
                {msgs.map((msg) => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    className={cn("relative", msg.role === "user" ? "flex justify-end" : "")}>
                    {msg.role === "ai" && (
                      <AsaLogoIcon className="absolute -left-9 top-0.5 w-6 h-6 text-[#E83069]" />
                    )}
                    <div className={cn(msg.role === "user" ? "max-w-[75%]" : "w-full")}>
                      {msg.content && (
                        <div className={cn(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          msg.role === "user" ? "bg-[#E83069] text-white" : "bg-white border border-[#EBEBEB] text-[#1A1A1A] shadow-sm",
                          msg.richType ? "mb-0" : ""
                        )}>
                          {msg.content.split("\n").map((line, i) => (
                            <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                              {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                                part.startsWith("**") && part.endsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : part
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                      {renderRich(msg)}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex gap-2.5 items-start">
                    <AsaLogoIcon className="flex-shrink-0 w-6 h-6 mt-0.5 text-[#E83069]" />
                    <div className="bg-white border border-[#EBEBEB] rounded-2xl px-4 py-3 flex items-center gap-1.5 shadow-sm">
                      {[0, 0.15, 0.3].map((d) => (
                        <motion.div key={d} className="w-1.5 h-1.5 rounded-full bg-[#999]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: d }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky input */}
        <div className="flex-shrink-0 bg-[#FFFAF5] border-t border-[#F0E8E0] px-4 py-3">
          <div className="mx-auto" style={{ maxWidth: "min(720px, 60vw)" }}>
            <div className={cn("bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors", chatMode === "email-share" ? "border-[#E83069]/40" : "border-[#E9EAEB]")}>
              {chatMode === "email-share" && (
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <Send className="w-3 h-3 text-[#E83069]" />
                  <span className="text-xs font-semibold text-[#E83069]">Email share mode</span>
                </div>
              )}
              <textarea
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={isListening ? "Listening…" : inputPlaceholder}
                rows={2}
                className="w-full px-4 pt-3.5 pb-2 text-sm text-[#1A1A1A] placeholder:text-[#AAAAAA] resize-none outline-none bg-transparent"
              />
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-[#F3F4F6]">
                <div className="flex items-center gap-1.5">
                  <button onClick={toggleVoice}
                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                      isListening ? "bg-[#E83069] text-white" : "text-[#AAAAAA] hover:bg-[#F5F5F5] hover:text-[#666666]")}>
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-xs text-[#CCCCCC]">
                    {chatMode === "email-share" ? "Shift+Enter for new line" : "AI-powered · always verify"}
                  </span>
                </div>
                <button onClick={() => send()} disabled={!inputVal.trim()}
                  className="w-8 h-8 rounded-xl bg-[#E83069] hover:bg-[#C71E52] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADD DATASET MODAL (3-step)
// ─────────────────────────────────────────────────────────────

type AddDatasetPlatform = "twitter" | "reddit" | "tiktok" | "netflix" | "appletv" | "hbomax" | "facebook" | "youtube";

const ADD_DATASET_PLATFORMS: { key: AddDatasetPlatform; label: string; placeholder: string }[] = [
  { key: "twitter",  label: "Twitter / X",  placeholder: "@username" },
  { key: "reddit",   label: "Reddit",        placeholder: "r/subreddit or u/username" },
  { key: "tiktok",   label: "TikTok",        placeholder: "@username" },
  { key: "netflix",  label: "Netflix",       placeholder: "Netflix title or account" },
  { key: "appletv",  label: "Apple TV+",     placeholder: "Show or channel name" },
  { key: "hbomax",   label: "HBO Max",       placeholder: "Show or series name" },
  { key: "facebook", label: "Facebook",      placeholder: "@page or group name" },
  { key: "youtube",  label: "YouTube",       placeholder: "@channel or video URL" },
];

const RECURRENCE_OPTIONS = [
  { key: "realtime", label: "Realtime",  desc: "Continuous live ingestion", icon: "⚡" },
  { key: "24h",      label: "24 Hours",  desc: "Daily snapshot analysis",   icon: "🕐" },
  { key: "weekly",   label: "Weekly",    desc: "Weekly trend summary",      icon: "📅" },
  { key: "monthly",  label: "Monthly",   desc: "Monthly deep-dive report",  icon: "📊" },
];

function AddDatasetModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [step, setStep]           = useState(1);
  const [platform, setPlatform]   = useState<AddDatasetPlatform | null>(null);
  const [handle, setHandle]       = useState("");
  const [url, setUrl]             = useState("");
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [adding, setAdding]       = useState(false);

  function handleAdd() {
    setAdding(true);
    setTimeout(() => {
      setAdding(false);
      onAdd();
      toast.success("Dataset added!", { description: `${platform ? ADD_DATASET_PLATFORMS.find(p => p.key === platform)?.label : "Dataset"} is being ingested` });
    }, 1500);
  }

  const selectedPlatformCfg = platform ? ADD_DATASET_PLATFORMS.find(p => p.key === platform) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-[#E9EAEB] w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A]">Add Dataset</h2>
              <p className="text-xs text-[#999] mt-0.5">Step {step} of 3</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#F5F5F5] flex items-center justify-center text-[#999] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1 px-6 pt-4">
            {[1,2,3].map(s => (
              <div key={s} className={cn("h-1 flex-1 rounded-full transition-colors", s <= step ? "bg-[#E83069]" : "bg-[#F0F0F0]")} />
            ))}
          </div>

          <div className="px-6 py-5">
            {/* Step 1: Choose platform + handle */}
            {step === 1 && (
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Choose a platform</h3>
                <p className="text-xs text-[#888] mb-4">Select the social or streaming platform for your dataset</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {ADD_DATASET_PLATFORMS.map(p => {
                    const cfg = (() => {
                      const configs: Record<AddDatasetPlatform, { bg: string; node: React.ReactNode }> = {
                        twitter:  { bg: "#000", node: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                        reddit:   { bg: "#FF4500", node: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg> },
                        tiktok:   { bg: "#010101", node: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l-.01-8.29a8.12 8.12 0 0 0 4.74 1.51V5.08a4.84 4.84 0 0 1-1-.39z"/></svg> },
                        netflix:  { bg: "#E50914", node: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.988a66.003 66.003 0 0 0 3.624.006L8.882.006H5.398zm7.949 0l-8.577 24H17.6C19.951 24 22 22.83 22 21.257V2.743C22 1.17 20.951 0 18.6 0h-5.253z"/></svg> },
                        appletv:  { bg: "#1C1C1E", node: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg> },
                        hbomax:   { bg: "#6C2FAF", node: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M1 2.5h4v7.75h4V2.5h4v18.25h-4v-7.5H5v7.5H1zm12 0h4l2.5 7 2.5-7h4l-4.5 9.125L23.5 20.75h-4L17 13.625 14.5 20.75h-4l4.5-9.125z"/></svg> },
                        facebook: { bg: "#1877F2", node: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                        youtube:  { bg: "#FF0000", node: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg> },
                      };
                      return configs[p.key];
                    })();
                    return (
                      <button
                        key={p.key}
                        onClick={() => setPlatform(p.key)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                          platform === p.key ? "border-[#E83069] bg-[#FFF0F4]" : "border-[#F0F0F0] hover:border-[#E2E2E2]"
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                          {cfg.node}
                        </div>
                        <span className="text-[9px] font-medium text-[#666] leading-tight text-center">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
                {platform && (
                  <div>
                    <label className="text-xs font-medium text-[#444] block mb-1.5">Handle / Name</label>
                    <input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder={selectedPlatformCfg?.placeholder ?? "Enter handle"}
                      className="w-full px-3 py-2 text-sm border border-[#E2E2E2] rounded-xl outline-none focus:border-[#E83069] transition-colors"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: URL */}
            {step === 2 && (
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Source URL</h3>
                <p className="text-xs text-[#888] mb-4">Paste the URL of the account, channel, video, or post to ingest</p>
                <div className="flex items-center gap-2 mb-2">
                  {platform && (
                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: (() => { const bgs: Record<string, string> = { twitter:"#000",reddit:"#FF4500",tiktok:"#010101",netflix:"#E50914",appletv:"#1C1C1E",hbomax:"#6C2FAF",facebook:"#1877F2",youtube:"#FF0000" }; return bgs[platform] || "#333"; })() }}>
                      <PlatformIcon datasetId={platform.charCodeAt(0).toString()} />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="text-xs font-medium text-[#444] block mb-1.5">URL</label>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      type="url"
                      className="w-full px-3 py-2 text-sm border border-[#E2E2E2] rounded-xl outline-none focus:border-[#E83069] transition-colors"
                    />
                  </div>
                </div>
                <p className="text-xs text-[#AAAAAA] mt-2">Examples: profile URL, channel URL, video link, post URL, hashtag page</p>
              </div>
            )}

            {/* Step 3: Recurrence */}
            {step === 3 && (
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Analysis Frequency</h3>
                <p className="text-xs text-[#888] mb-4">How often should Canvs re-analyse this dataset?</p>
                <div className="grid grid-cols-2 gap-2">
                  {RECURRENCE_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setRecurrence(opt.key)}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                        recurrence === opt.key ? "border-[#E83069] bg-[#FFF0F4]" : "border-[#F0F0F0] hover:border-[#E2E2E2]"
                      )}
                    >
                      <span className="text-xl leading-none">{opt.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-[#1A1A1A]">{opt.label}</p>
                        <p className="text-[10px] text-[#888] mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA]">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
              className="px-4 py-2 text-xs font-medium text-[#666] hover:text-[#333] rounded-xl hover:bg-[#F0F0F0] transition-colors"
            >
              {step === 1 ? "Cancel" : "← Back"}
            </button>
            {step < 3 ? (
              <button
                disabled={step === 1 ? (!platform || !handle.trim()) : !url.trim()}
                onClick={() => setStep(s => s + 1)}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#E83069] hover:bg-[#C71E52] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                disabled={!recurrence || adding}
                onClick={handleAdd}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#E83069] hover:bg-[#C71E52] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2"
              >
                {adding ? (
                  <><motion.div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /> Adding…</>
                ) : "Add Dataset"}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPARE DATASET MODAL
// ─────────────────────────────────────────────────────────────

function CompareDatasetModal({
  sourceDataset,
  onClose,
  onRun,
}: {
  sourceDataset?: Dataset;
  onClose: () => void;
  onRun: (target: Dataset) => void;
}) {
  const [selected, setSelected] = useState<Dataset | null>(null);
  const choices = DATASETS.filter((d) => d.id !== sourceDataset?.id);

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
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F5]">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Compare Dataset</h2>
              <p className="text-xs text-[#A4A7AE] mt-0.5">
                {sourceDataset ? `Select a dataset to compare against "${sourceDataset.name}"` : "Select two datasets to compare"}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] text-[#A4A7AE] hover:text-[#535862] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {sourceDataset && (
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F3F4F6] rounded-xl border border-[#E9EAEB]">
                <GitCompare className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                <span className="text-xs font-medium text-[#374151] truncate">{sourceDataset.name}</span>
                <span className="text-xs text-[#9CA3AF] ml-auto flex-shrink-0">source</span>
              </div>
            </div>
          )}

          <div className="px-6 py-3 max-h-[50vh] overflow-y-auto space-y-2">
            <p className="text-xs font-medium text-[#6B7280] mb-2">Choose comparison dataset</p>
            {choices.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={cn(
                  "w-full text-left flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all",
                  selected?.id === d.id
                    ? "border-[#E83069] bg-[#F3F4F6]"
                    : "border-[#F5F5F5] hover:border-[#E9EAEB] bg-white"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4 text-[#555555]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1F2937] truncate">{d.name}</p>
                  <p className="text-xs text-[#717680]">{d.responses.toLocaleString()} responses · {d.waves} waves</p>
                </div>
                {selected?.id === d.id && <CheckCircle className="w-4 h-4 text-[#111827] flex-shrink-0" />}
              </button>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-[#F5F5F5] flex items-center justify-between">
            <button onClick={onClose} className="text-sm text-[#717680] hover:text-[#414651] font-medium">Cancel</button>
            <button
              onClick={() => selected && onRun(selected)}
              disabled={!selected}
              className={cn(
                "flex items-center gap-2 px-5 py-2 text-sm rounded-xl font-semibold transition-all bg-[#E83069] text-white hover:bg-[#C71E52] shadow-sm",
                !selected ? "opacity-40 cursor-not-allowed" : ""
              )}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Run Comparison
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// NEW AGENT MODAL (global)
// ─────────────────────────────────────────────────────────────

function NewAgentModalGlobal({ onClose }: { onClose: () => void }) {
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

  const datasets = DATASETS.map((d) => d.name);

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
                    className={cn("w-10 h-5.5 rounded-full relative transition-colors cursor-pointer", form.notify ? "bg-[#E83069]" : "bg-[#E9EAEB]")}
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
                "px-5 py-2 text-sm rounded-xl font-semibold transition-all bg-[#E83069] text-white hover:bg-[#C71E52] shadow-sm hover:shadow-md",
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

// ─────────────────────────────────────────────────────────────
// GENERATE REPORT MODAL (global)
// ─────────────────────────────────────────────────────────────

function GenerateReportModalGlobal({ onClose }: { onClose: () => void }) {
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

  const datasetNames = DATASETS.map((d) => d.name);
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
                    {datasetNames.map((ds) => (
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

// ─────────────────────────────────────────────────────────────

function DatasetsPageInner() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<"studio" | "pulse">(
    searchParams.get("view") === "pulse" ? "pulse" : "pulse"
  );
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [copilotCtx, setCopilotCtx] = useState<CopilotCtxData>({ context: "default" });
  const [leftView, setLeftView] = useState<"grid" | PanelMode>("grid");

  // Auto-switch to Pulse when navigated from other pages via ?view=pulse
  useEffect(() => {
    if (searchParams.get("view") === "pulse") {
      setActiveMode("pulse");
    }
  }, [searchParams]);

  // Modal states
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showAddDatasetModal, setShowAddDatasetModal] = useState(false);
  const [compareSourceDataset, setCompareSourceDataset] = useState<Dataset | undefined>(undefined);

  // Open a detail view — intercepts compare/report/agent to show modals
  const openDetail = (mode: PanelMode, dataset?: Dataset) => {
    if (mode === "compare") {
      setCompareSourceDataset(dataset);
      setShowCompareModal(true);
      return;
    }
    if (mode === "report") {
      setShowReportModal(true);
      return;
    }
    if (mode === "agent") {
      setShowAgentModal(true);
      return;
    }
    // mode === "dataset" — inline panel
    setLeftView(mode);
    setCopilotCtx({ context: mode, dataset });
    if (dataset) setSelectedDataset(dataset);
  };

  // Called after user picks a comparison target in CompareDatasetModal
  const runCompareView = (targetDataset: Dataset) => {
    setShowCompareModal(false);
    setLeftView("compare");
    setCopilotCtx({ context: "compare", dataset: targetDataset });
    setSelectedDataset(targetDataset);
    if (activeMode !== "studio") setActiveMode("studio");
  };

  // Insight action handler
  const handleInsightAction = (item: InsightItem) => {
    const actionToMode: Record<string, PanelMode> = {
      "Investigate": "dataset",
      "Alert Team": "dataset",
      "Explore Theme": "compare",
      "Compare Now": "compare",
      "Review Draft": "report",
      "Review": "report",
    };
    const mode = actionToMode[item.actionLabel] ?? "dataset";
    openDetail(mode);
  };

  // Called when a dataset card body is clicked (not action buttons)
  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset((prev) => {
      const isSame = prev?.id === dataset.id;
      const next = isSame ? null : dataset;
      setCopilotCtx(next ? { context: "dataset", dataset: next } : { context: "default" });
      return next;
    });
  };

  const backToGrid = () => {
    setLeftView("grid");
    setSelectedDataset(null);
    setCopilotCtx({ context: "default" });
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen key="loading" onDone={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      <div className="h-screen flex flex-col bg-[#FFFAF5] font-[var(--font-inter)] overflow-hidden">
      <Header activeMode={activeMode} onModeChange={setActiveMode} />

      {/* ── Pulse mode ───────────────────────────────────── */}
      {activeMode === "pulse" && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          <PulsePage
            onCompare={(d) => { setCompareSourceDataset(d); setShowCompareModal(true); }}
            onReport={() => setShowReportModal(true)}
            onAgent={() => setShowAgentModal(true)}
          />
        </div>
      )}

      {/* ── Studio mode ──────────────────────────────────── */}
      {activeMode === "studio" && (
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Left panel: 36% persistent Copilot ── */}
        <div className="w-[36%] min-w-[340px] max-w-[500px] flex-shrink-0 flex flex-col overflow-hidden border-r border-[#E9EAEB] shadow-[8px_0_24px_rgba(10,13,18,0.06)]">
          <PersistentCopilot ctxData={copilotCtx} onOpenDetail={openDetail} />
        </div>

        {/* ── Right panel: scrollable content ── */}
        <div className="flex-1 overflow-y-auto bg-[#FFFAF5] min-w-0">
          {leftView !== "grid" ? (
            /* Detail view (dataset) */
            <div className="flex flex-col min-h-full">
              {/* Breadcrumb bar */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#F0F0F0] px-6 py-3 flex items-center gap-3 shadow-sm">
                <button
                  onClick={backToGrid}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#444444] hover:text-[#1A1A1A] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  All Datasets
                </button>
                <span className="text-[#E2E2E2]">/</span>
                <span className="text-xs font-semibold text-[#1A1A1A]">
                  {leftView === "dataset" && (selectedDataset?.name ?? "Dataset Detail")}
                  {leftView === "compare" && "Compare Datasets"}
                  {leftView === "report" && (selectedDataset ? `Report: ${selectedDataset.name}` : "Generate Report")}
                  {leftView === "agent" && "Agent Workflows"}
                </span>
              </div>
              <div className="p-6 flex-1">
                {leftView === "dataset" && selectedDataset && <DatasetDetailPanel dataset={selectedDataset} />}
                {leftView === "compare" && <ComparePanel dataset={selectedDataset ?? undefined} />}
                {leftView === "report" && <ReportPanel dataset={selectedDataset ?? undefined} />}
                {leftView === "agent" && <AgentDetailPanel dataset={selectedDataset ?? undefined} />}
              </div>
            </div>
          ) : (
            /* Normal grid / page view */
            <main>
              {/* 1. Suggested Next Actions */}
              <section className="py-5 bg-gradient-to-b from-[#FFEEDD] via-[#FFF5EE] to-[#FFFAF5] border-b border-[#F5F5F5]">
                <div className="max-w-[1200px] mx-auto px-6">
                  <SuggestedActions onOpenPanel={(s) => openDetail(s.mode, s.dataset)} />
                </div>
              </section>

              {/* 2. Dataset Intelligence Slider */}
              <DatasetGrid
                onOpenPanel={(s) => openDetail(s.mode, s.dataset)}
                selectedDatasetId={selectedDataset?.id}
                onSelectDataset={handleSelectDataset}
                onAddDataset={() => setShowAddDatasetModal(true)}
              />

              {/* 4. Live Insight Feed */}
              <InsightFeed onAction={handleInsightAction} />

              {/* 5. Cross-Dataset Intelligence */}
              <CrossDatasetSection onOpenPanel={(s) => openDetail(s.mode, s.dataset)} />

              {/* 6. Agent Workflows */}
              <AgentPanel onCreateAgent={() => setShowAgentModal(true)} />

              <div className="h-8" />
            </main>
          )}
        </div>
      </div>
      )} {/* end Studio mode */}

      {/* ── Global Modals ── */}
      <AnimatePresence>
        {showCompareModal && (
          <CompareDatasetModal
            key="compare-modal"
            sourceDataset={compareSourceDataset}
            onClose={() => setShowCompareModal(false)}
            onRun={runCompareView}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAgentModal && (
          <NewAgentModalGlobal key="agent-modal" onClose={() => setShowAgentModal(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReportModal && (
          <GenerateReportModalGlobal key="report-modal" onClose={() => setShowReportModal(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddDatasetModal && (
          <AddDatasetModal
            key="add-dataset-modal"
            onClose={() => setShowAddDatasetModal(false)}
            onAdd={() => setShowAddDatasetModal(false)}
          />
        )}
      </AnimatePresence>

    </div>
    </>
  );
}

export default function DatasetsPage() {
  return (
    <Suspense fallback={null}>
      <DatasetsPageInner />
    </Suspense>
  );
}
