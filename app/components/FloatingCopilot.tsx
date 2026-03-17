"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Mic, MicOff, ChevronDown, Lightbulb } from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────

export type CopilotContext = "datasets" | "agents" | "reports" | "insights";

interface ChatMsg {
  id: string;
  role: "user" | "ai";
  content: string;
  chart?: { positive: number; negative: number; neutral: number };
  table?: { label: string; value: string; change?: "up" | "down" }[];
  actions?: { label: string; variant: "primary" | "secondary"; key: string }[];
  timestamp: string;
}

// ── Context config ────────────────────────────────────────────

const CONTEXT_CONFIG: Record<CopilotContext, {
  subtitle: string;
  placeholder: string;
  suggestions: string[];
  initialMessage: ChatMsg;
  badgeCount: number;
}> = {
  datasets: {
    subtitle: "Datasets Intelligence",
    placeholder: "Ask Canvs anything about your datasets…",
    suggestions: [
      "Why is Houston Parking sentiment negative?",
      "Compare Northwest College vs ECC trends",
      "What emerging themes span all datasets?",
      "Generate executive summary for NBC Dispute",
    ],
    badgeCount: 2,
    initialMessage: {
      id: "init-datasets",
      role: "ai",
      content: "Hi! I'm monitoring 5 active datasets. There are 2 high-priority insights today — an anger spike in Houston Parking (+22%) and missing Wave 4 data in Northwest College. What would you like to explore?",
      actions: [
        { label: "Houston Parking spike", variant: "secondary", key: "houston" },
        { label: "Missing Wave 4 data", variant: "secondary", key: "northwest" },
      ],
      timestamp: "Just now",
    },
  },
  agents: {
    subtitle: "Agent Workflows",
    placeholder: "Ask about your agents and automations…",
    suggestions: [
      "Which agents are currently running?",
      "Show me Sentiment Monitor status",
      "How accurate is Theme Discovery agent?",
      "Schedule a new anomaly detection run",
    ],
    badgeCount: 1,
    initialMessage: {
      id: "init-agents",
      role: "ai",
      content: "I'm overseeing 6 agent workflows. 2 agents are currently running, 1 is scheduled for Monday, and 1 needs attention — Cross-Dataset Correlation encountered an error 3 hours ago. How can I help?",
      actions: [
        { label: "View running agents", variant: "secondary", key: "running" },
        { label: "Fix error agent", variant: "primary", key: "error" },
      ],
      timestamp: "Just now",
    },
  },
  reports: {
    subtitle: "Reports & Exports",
    placeholder: "Ask about reports or generate a new one…",
    suggestions: [
      "Generate executive summary for all datasets",
      "Create stakeholder PDF for Houston Parking",
      "What reports are ready to download?",
      "Schedule weekly automated report",
    ],
    badgeCount: 3,
    initialMessage: {
      id: "init-reports",
      role: "ai",
      content: "I have 3 report drafts ready for review. The latest is an executive summary for Versant NBC Dispute with a quality score of 87/100. Would you like to review it or generate a new report?",
      actions: [
        { label: "Review NBC draft", variant: "primary", key: "review" },
        { label: "Generate new report", variant: "secondary", key: "generate" },
      ],
      timestamp: "Just now",
    },
  },
  insights: {
    subtitle: "Insights Explorer",
    placeholder: "Ask about insights and findings…",
    suggestions: [
      "What are the top insights across all datasets?",
      "Show high-priority alerts only",
      "Explain the Houston anger sentiment spike",
      "What themes are emerging this week?",
    ],
    badgeCount: 5,
    initialMessage: {
      id: "init-insights",
      role: "ai",
      content: "There are 47 insights generated today — 2 high-priority, 8 medium, and 37 informational. The most critical: a 22% anger spike in Houston Parking and stalled data collection in Northwest College. What would you like to investigate?",
      actions: [
        { label: "High priority first", variant: "primary", key: "highpriority" },
        { label: "Browse all insights", variant: "secondary", key: "browse" },
      ],
      timestamp: "Just now",
    },
  },
};

// ── Mock response engine ──────────────────────────────────────

function getMockResponse(input: string, context: CopilotContext): ChatMsg {
  const q = input.toLowerCase();
  const id = `ai-${Date.now()}`;

  if (q.match(/houston|parking|anger|sentiment|negative/)) {
    return {
      id, role: "ai", timestamp: "Just now",
      content: "Houston Parking shows a 22% anger sentiment spike following the April 3rd prompt sync. The primary driver is \"payment app confusion\" appearing in 34% of negative verbatims — especially among 45+ users.",
      chart: { positive: 31, negative: 48, neutral: 21 },
      table: [
        { label: "Total responses", value: "2,847" },
        { label: "Anger increase", value: "+22%", change: "up" },
        { label: "Top theme", value: "Payment confusion" },
        { label: "Affected users", value: "Ages 45+" },
      ],
      actions: [
        { label: "Open Dataset", variant: "primary", key: "open" },
        { label: "Generate Report", variant: "secondary", key: "report" },
        { label: "Explore Themes", variant: "secondary", key: "themes" },
      ],
    };
  }

  if (q.match(/report|generate|summary|pdf|export|executive|draft/)) {
    return {
      id, role: "ai", timestamp: "Just now",
      content: "I'll generate an executive summary across your 5 active datasets. The report includes sentiment trends, key themes, anomalies, and recommended next steps — estimated quality score: 87/100.",
      table: [
        { label: "Datasets included", value: "5" },
        { label: "Insights captured", value: "47" },
        { label: "Quality score", value: "87/100" },
        { label: "Format", value: "PDF + Slides" },
      ],
      actions: [
        { label: "Download PDF", variant: "primary", key: "download" },
        { label: "Send via Email", variant: "secondary", key: "email" },
      ],
    };
  }

  if (q.match(/compar|cross|overlap|austin/)) {
    return {
      id, role: "ai", timestamp: "Just now",
      content: "I found 62% thematic overlap between Houston Parking and Austin Parking. Both show strong negative sentiment around payment systems and wait times — suggesting a systemic issue rather than location-specific.",
      table: [
        { label: "Theme overlap", value: "62%" },
        { label: "Shared themes", value: "4" },
        { label: "Houston neg.", value: "48%" },
        { label: "Austin neg.", value: "41%" },
      ],
      actions: [
        { label: "Open Comparison", variant: "primary", key: "compare" },
        { label: "Export Analysis", variant: "secondary", key: "export" },
      ],
    };
  }

  if (q.match(/theme|emerging|pattern|trend/)) {
    return {
      id, role: "ai", timestamp: "Just now",
      content: "Across all datasets, 3 emerging themes are surfacing: (1) Digital payment friction (+18% WoW), (2) Staff interaction quality (shifting positive), (3) Wait time expectations (stable, persistently negative).",
      actions: [
        { label: "Explore All Themes", variant: "primary", key: "themes" },
        { label: "Set Alert", variant: "secondary", key: "alert" },
      ],
    };
  }

  if (q.match(/wave|missing|northwest|college/)) {
    return {
      id, role: "ai", timestamp: "Just now",
      content: "Northwest College 2026 is missing Wave 4 responses — 400+ expected responses haven't been collected. The dataset is below the statistical threshold for reliable analysis.",
      table: [
        { label: "Expected", value: "400+ responses" },
        { label: "Collected", value: "0" },
        { label: "Started", value: "Mar 1, 2026" },
        { label: "Status", value: "Stalled" },
      ],
      actions: [
        { label: "Alert Collection Team", variant: "primary", key: "alert" },
        { label: "View Dataset", variant: "secondary", key: "open" },
      ],
    };
  }

  if (q.match(/agent|running|workflow|schedule|error/)) {
    return {
      id, role: "ai", timestamp: "Just now",
      content: "Currently 2 agents are running: Sentiment Monitor (every 15 min, 94% accuracy) and Theme Discovery (hourly, 89% accuracy). Cross-Dataset Correlation encountered an error 3 hours ago and needs your attention.",
      table: [
        { label: "Running", value: "2 agents" },
        { label: "Scheduled", value: "1 agent" },
        { label: "Error", value: "1 agent", change: "up" },
        { label: "Insights today", value: "47" },
      ],
      actions: [
        { label: "View Agents", variant: "primary", key: "viewagents" },
        { label: "Fix Error", variant: "secondary", key: "fixerror" },
      ],
    };
  }

  if (q.match(/insight|alert|priorit|high|spike|anomal/)) {
    return {
      id, role: "ai", timestamp: "Just now",
      content: "Today's top priority: a 22% anger spike in Houston Parking (high severity) and stalled Wave 4 collection in Northwest College (high severity). 8 medium-priority insights are waiting for review.",
      table: [
        { label: "High priority", value: "2 insights" },
        { label: "Medium priority", value: "8 insights" },
        { label: "Informational", value: "37 insights" },
        { label: "Total today", value: "47 insights" },
      ],
      actions: [
        { label: "View All Insights", variant: "primary", key: "insights" },
        { label: "Dismiss Low Priority", variant: "secondary", key: "dismiss" },
      ],
    };
  }

  // Context-aware default
  const contextDefaults: Record<CopilotContext, string> = {
    datasets: "I can help with sentiment analysis, theme discovery, data quality checks, cross-dataset comparisons, and report generation. Which dataset would you like to explore?",
    agents: "I can help you create, configure, schedule, and monitor AI agents. Which agent workflow would you like to manage?",
    reports: "I can generate executive summaries, stakeholder reports, and PDF exports from any of your datasets. What type of report do you need?",
    insights: "I can surface hidden patterns, explain sentiment changes, flag anomalies, and suggest next actions across all your datasets. What would you like to investigate?",
  };

  return {
    id, role: "ai", timestamp: "Just now",
    content: contextDefaults[context],
    actions: [
      { label: "Browse Datasets", variant: "primary", key: "datasets" },
      { label: "View Insights", variant: "secondary", key: "insights" },
    ],
  };
}

// ── Sub-components ────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

function LivePulse({ label = "Online" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-[#FDEAF0] text-[#02192B] border border-[#F6ACC3]">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED5987] opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E83069]" />
      </span>
      {label}
    </span>
  );
}

function MiniSentimentChart({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const bars = [
    { label: "Positive", value: positive, color: "bg-[#47CD89]", textColor: "text-[#079455]" },
    { label: "Negative", value: negative, color: "bg-[#F97066]", textColor: "text-[#D92D20]" },
    { label: "Neutral",  value: neutral,  color: "bg-[#D5D7DA]", textColor: "text-[#717680]" },
  ];
  return (
    <div className="bg-[#FFFAF5] rounded-xl p-3 border border-[#F0F0F0] space-y-1.5 mt-2 w-full">
      <p className="text-[10px] font-semibold text-[#A4A7AE] uppercase tracking-wide mb-2">Sentiment Breakdown</p>
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2 text-xs">
          <span className="w-14 text-[#717680] shrink-0">{b.label}</span>
          <div className="flex-1 h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", b.color)}
              initial={{ width: 0 }}
              animate={{ width: `${b.value}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          <span className={cn("w-8 text-right font-semibold shrink-0", b.textColor)}>{b.value}%</span>
        </div>
      ))}
    </div>
  );
}

function MiniDataTable({ rows }: { rows: { label: string; value: string; change?: "up" | "down" }[] }) {
  return (
    <div className="bg-[#FFFAF5] rounded-xl border border-[#F0F0F0] overflow-hidden mt-2 w-full">
      {rows.map((row, i) => (
        <div key={i} className={cn("flex items-center justify-between px-3 py-1.5 text-xs", i < rows.length - 1 ? "border-b border-[#F0F0F0]" : "")}>
          <span className="text-[#717680]">{row.label}</span>
          <span className={cn("font-semibold", row.change === "up" ? "text-[#D92D20]" : row.change === "down" ? "text-[#079455]" : "text-[#252B37]")}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function FloatingCopilot({ context = "datasets" }: { context?: CopilotContext }) {
  const cfg = CONTEXT_CONFIG[context];
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages]     = useState<ChatMsg[]>([cfg.initialMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping]     = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    }
  }, [messages, isTyping, isExpanded]);

  // Reset initial message when context changes
  useEffect(() => {
    setMessages([cfg.initialMessage]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  const sendMessage = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const userMsg: ChatMsg = { id: `user-${Date.now()}`, role: "user", content: trimmed, timestamp: "Just now" };
    setMessages((m) => [...m, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setIsExpanded(true);
    const tid = toast.loading("Canvs AI is analyzing…");
    setTimeout(() => {
      setMessages((m) => [...m, getMockResponse(trimmed, context)]);
      setIsTyping(false);
      toast.dismiss(tid);
      if (trimmed.toLowerCase().match(/report|generate|pdf|export/)) {
        toast.success("Report draft ready!", {
          description: "87/100 quality score across 5 datasets",
          action: { label: "Download", onClick: () => toast.success("Downloading report…") },
        });
      }
    }, 1400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); }
  };

  const handleActionClick = (key: string) => {
    const actionMap: Record<string, () => void> = {
      download:    () => toast.success("Downloading executive report PDF…"),
      email:       () => toast.success("Report sent to stakeholders"),
      alert:       () => toast.success("Team alert sent!", { description: "Collection team has been notified" }),
      export:      () => toast.success("Analysis exported to CSV"),
      dismiss:     () => toast.success("Low-priority insights dismissed"),
      report:      () => sendMessage("Generate executive summary report"),
      houston:     () => sendMessage("Why is Houston Parking sentiment negative?"),
      northwest:   () => sendMessage("What's happening with Northwest College Wave 4?"),
      themes:      () => sendMessage("What emerging themes span all datasets?"),
      compare:     () => sendMessage("Compare Houston Parking vs Austin Parking"),
      running:     () => sendMessage("Show me all currently running agents"),
      error:       () => sendMessage("How do I fix the Cross-Dataset Correlation error?"),
      fixerror:    () => sendMessage("How do I fix the Cross-Dataset Correlation error?"),
      review:      () => sendMessage("Show me the NBC Dispute report draft"),
      generate:    () => sendMessage("Generate executive summary report"),
      highpriority:() => sendMessage("Show me high priority insights only"),
      browse:      () => sendMessage("What are all the insights from today?"),
      viewagents:  () => sendMessage("Show me agent status overview"),
      insights:    () => sendMessage("What are the top insights from all datasets?"),
    };
    (actionMap[key] ?? (() => { setInputValue(key); inputRef.current?.focus(); }))();
  };

  const handleVoice = () => {
    if (isListening) { setIsListening(false); toast.dismiss("voice"); return; }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false; r.interimResults = false;
      r.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        setInputValue(t); setIsListening(false);
        toast.dismiss("voice"); toast.success("Voice captured!", { description: t });
      };
      r.onerror = () => { setIsListening(false); toast.dismiss("voice"); toast.error("Voice recognition failed."); };
      r.onend   = () => setIsListening(false);
      r.start();
      setIsListening(true);
      toast.loading("Listening…", { id: "voice", duration: 8000 });
    } else {
      toast.error("Voice input not supported in this browser.");
    }
  };

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-[75%] lg:w-[60%] max-w-3xl min-w-[300px] pb-4 sm:pb-5">

      {/* ── Expanded chat panel ───────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-2 bg-white rounded-2xl border border-[#E9EAEB] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5] bg-[#FFFAF5]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#E83069] to-[#02192B] flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#181D27] leading-none">Canvs AI</p>
                  <p className="text-[10px] text-[#A4A7AE] mt-0.5">{cfg.subtitle}</p>
                </div>
                <LivePulse />
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] text-[#A4A7AE] hover:text-[#535862] transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto px-4 py-3 space-y-3 bg-white">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "ai" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E83069] to-[#02192B] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={cn("flex flex-col", msg.role === "user" ? "items-end max-w-[75%]" : "items-start max-w-[82%]")}>
                    <div className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-[#02192B] text-white rounded-tr-sm"
                        : "bg-[#FFFAF5] text-[#252B37] rounded-tl-sm border border-[#F0F0F0]"
                    )}>
                      {msg.content}
                    </div>
                    {msg.chart && <MiniSentimentChart {...msg.chart} />}
                    {msg.table && <MiniDataTable rows={msg.table} />}
                    {msg.actions && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.actions.map((a) => (
                          <button
                            key={a.key}
                            onClick={() => handleActionClick(a.key)}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-lg font-medium transition-all",
                              a.variant === "primary"
                                ? "bg-[#02192B] text-white hover:bg-[#021422] shadow-sm"
                                : "bg-white text-[#535862] border border-[#E9EAEB] hover:border-[#D5D7DA] hover:text-[#252B37]"
                            )}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-[#C5C7CA] mt-1 px-0.5">{msg.timestamp}</p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E83069] to-[#02192B] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-[#FFFAF5] rounded-2xl rounded-tl-sm px-4 py-3 border border-[#F0F0F0] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A4A7AE] animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A4A7AE] animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A4A7AE] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion chips */}
            <div className="px-4 py-2 border-t border-[#F5F5F5] flex items-center gap-1.5 overflow-x-auto bg-[#FFFAF5]">
              <Lightbulb className="w-3 h-3 text-[#A4A7AE] shrink-0" />
              {cfg.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInputValue(s); inputRef.current?.focus(); }}
                  className="text-[11px] px-2.5 py-1 bg-white text-[#535862] rounded-lg border border-[#E9EAEB] hover:border-[#D5D7DA] hover:text-[#252B37] whitespace-nowrap transition-all shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Always-visible input bar ──────────────────────── */}
      <div className={cn(
        "bg-white border border-[#E9EAEB] shadow-xl flex items-center gap-2.5 px-3.5 py-2.5 transition-all duration-200",
        isExpanded ? "rounded-xl border-[#D5D7DA]" : "rounded-2xl hover:shadow-2xl hover:border-[#D5D7DA]"
      )}>
        {/* Icon + badge */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#E83069] to-[#02192B] flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md transition-shadow"
        >
          <Sparkles className="w-4 h-4 text-white" />
          {!isExpanded && cfg.badgeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#F04438] text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
              {cfg.badgeCount}
            </span>
          )}
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleKeyDown}
          placeholder={cfg.placeholder}
          className="flex-1 text-sm text-[#252B37] bg-transparent outline-none placeholder:text-[#A4A7AE] min-w-0"
        />

        {/* ⌘↵ hint */}
        <kbd className="hidden lg:flex text-[10px] bg-[#FFFAF5] border border-[#E9EAEB] text-[#C5C7CA] px-1.5 py-0.5 rounded font-mono items-center gap-1 shrink-0">
          ⌘↵
        </kbd>

        {/* Voice */}
        <button
          onClick={handleVoice}
          title="Voice input"
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
            isListening
              ? "bg-[#FEF3F2] text-[#F04438] animate-pulse"
              : "bg-[#FFFAF5] text-[#A4A7AE] hover:bg-[#F5F5F5] hover:text-[#535862]"
          )}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        {/* Send */}
        <button
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim()}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
            inputValue.trim()
              ? "bg-[#02192B] text-white hover:bg-[#021422] shadow-sm"
              : "bg-[#F5F5F5] text-[#C5C7CA] cursor-not-allowed"
          )}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
