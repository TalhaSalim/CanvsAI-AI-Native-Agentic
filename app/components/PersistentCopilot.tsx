"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  Menu,
  ChevronsUpDown,
  Maximize2,
  MoreVertical,
  Zap,
  ChevronRight,
} from "lucide-react";

// ── Figma asset URLs (expire ~7 days) ──────────────────────────────────────
const ASA_LOGOMARK = "https://www.figma.com/api/mcp/asset/e02029fc-00e6-42ea-b44e-6899c1727596";
const ASA_WORDMARK = "https://www.figma.com/api/mcp/asset/b43993da-b289-4ef7-8a7f-e1dca76bf327";
const ASA_PRO_BADGE = "https://www.figma.com/api/mcp/asset/1aeec9e3-82be-431a-bf46-d4a21d659f04";

// ── Types ──────────────────────────────────────────────────────────────────
export interface CopilotMsg {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  proactive?: boolean;
}

export interface PersistentCopilotProps {
  initialMessages: CopilotMsg[];
  chips?: string[];
  getReply: (q: string, contextKey?: string) => string;
  contextKey?: string;       // When this changes → inject contextMessage
  contextMessage?: string;   // Auto-injected AI message when contextKey changes
  onReset?: () => void;      // Optional callback on reset
}

// ── Helpers ────────────────────────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function uid() {
  return Math.random().toString(36).slice(2);
}

function BoldText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <React.Fragment key={li}>
            {parts.map((part, i) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={i} className="font-semibold text-[#1A1A1A]">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
            {li < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function PersistentCopilot({
  initialMessages,
  chips = [],
  getReply,
  contextKey,
  contextMessage,
  onReset,
}: PersistentCopilotProps) {
  const [messages, setMessages] = useState<CopilotMsg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCtxKey = useRef<string | undefined>(undefined);

  // Sync with new initialMessages when parent resets
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Inject context message when contextKey changes
  useEffect(() => {
    if (!contextKey || !contextMessage) return;
    if (prevCtxKey.current === contextKey) return;
    prevCtxKey.current = contextKey;

    setIsTyping(true);
    const delay = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "ai",
          content: contextMessage,
          timestamp: now(),
          proactive: true,
        },
      ]);
    }, 800);
    return () => clearTimeout(delay);
  }, [contextKey, contextMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleReset() {
    setMessages(initialMessages);
    prevCtxKey.current = undefined;
    onReset?.();
  }

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: CopilotMsg = {
      id: uid(),
      role: "user",
      content: text.trim(),
      timestamp: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    setIsTyping(false);
    const reply = getReply(text.trim(), contextKey);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "ai", content: reply, timestamp: now() },
    ]);
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="border-b border-[#E9EAEB] flex-shrink-0 bg-[#FFFAF5] h-16">
        <div className="flex items-center gap-3 pl-4 pr-2 h-full">
          <button className="p-2 rounded-lg hover:bg-black/5 flex items-center justify-center flex-shrink-0 transition-colors">
            <Menu className="w-5 h-5 text-[#1A1A1A]" />
          </button>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-[5.7px] px-[6.5px] py-[6.5px] flex-shrink-0">
              <img src={ASA_LOGOMARK} alt="Asa logomark" className="w-[19.7px] h-[19.7px] block flex-shrink-0" />
              <img src={ASA_WORDMARK} alt="Asa" className="w-[44px] h-[18px] block flex-shrink-0" />
              <div className="bg-[#E83069] rounded-[2.2px] px-[3px] py-[1.2px] flex items-center justify-center flex-shrink-0">
                <img src={ASA_PRO_BADGE} alt="Pro" className="w-[13.6px] h-[6.7px] block" />
              </div>
            </div>
            <button className="p-1.5 rounded-md hover:bg-black/5 flex items-center justify-center w-6 h-6 flex-shrink-0 transition-colors">
              <ChevronsUpDown className="w-4 h-4 text-[#535862]" />
            </button>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReset}
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

      {/* ── Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#FFFAF5]">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {msg.role === "ai" ? (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <img src={ASA_LOGOMARK} alt="Asa" className="w-5 h-5 block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.proactive && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#374151] bg-transparent border border-[#374151] px-1.5 py-0.5 rounded-full mb-1.5">
                        <Zap className="w-2.5 h-2.5" />
                        Proactive insight
                      </div>
                    )}
                    <div className="text-xs leading-relaxed text-[#4D4D4D] bg-white rounded-xl rounded-tl-sm px-3 py-2.5 shadow-sm border border-[#E9EAEB]">
                      <BoldText text={msg.content} />
                    </div>
                    <div className="text-[10px] text-[#808080] mt-1 ml-1">{msg.timestamp}</div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="text-xs leading-relaxed text-white bg-[#E83069] rounded-xl rounded-tr-sm px-3 py-2.5">
                      {msg.content}
                    </div>
                    <div className="text-[10px] text-[#808080] mt-1 text-right mr-1">{msg.timestamp}</div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2"
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              <img src={ASA_LOGOMARK} alt="Asa" className="w-5 h-5 block" />
            </div>
            <div className="bg-white border border-[#E9EAEB] rounded-xl rounded-tl-sm px-3 py-2.5 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#808080]"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Chips ────────────────────────────────────────────────────── */}
      {chips.length > 0 && (
        <div className="px-4 pb-2 bg-[#FFFAF5]">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="text-[11px] px-2.5 py-1.5 rounded-full bg-white hover:bg-[#FFFAF5] text-[#414651] border border-[#E9EAEB] hover:border-[#374151]/30 transition-all whitespace-nowrap flex items-center gap-1"
              >
                {chip}
                <ChevronRight className="w-3 h-3 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-1 bg-[#FFFAF5] flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E9EAEB] rounded-xl px-3 py-2.5 focus-within:border-[#374151] focus-within:ring-2 focus-within:ring-black/10 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask Asa anything…"
            className="flex-1 text-xs bg-transparent outline-none text-[#1A1A1A] placeholder:text-[#808080]"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-7 h-7 rounded-lg bg-[#E83069] hover:bg-[#C71E52] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-[#808080] text-center mt-2">
          Asa may make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
