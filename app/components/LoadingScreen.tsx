"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ─── Inline logomark (permanent, no expiring URLs) ────────────────────────────
function Logomark({ size = 70 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M19.5424 9.24455C19.5642 9.24455 19.5859 9.24455 19.6058 9.24268C21.9052 9.13014 23.8029 7.29392 23.985 4.9988C24.2108 2.14779 21.8498 -0.210753 19.0002 0.0149653C16.7861 0.189073 14.981 1.96373 14.7733 4.17614C14.7634 4.27128 14.7578 4.3658 14.7553 4.45907C14.7018 6.00241 14.0863 7.47238 12.9944 8.56242L12.5548 9.00142C12.2464 9.30984 11.7478 9.30984 11.4406 9.00142L11.3853 8.94608C10.922 8.48283 10.6553 7.84982 10.6926 7.19692C10.7025 7.01099 10.7007 6.82072 10.6826 6.6292C10.5204 4.88004 9.1114 3.46168 7.36232 3.28757C5.0095 3.05377 3.0484 5.01684 3.28405 7.36916C3.46002 9.11646 4.87706 10.523 6.62613 10.6853C6.81827 10.7033 7.00791 10.7071 7.19196 10.6952C7.84483 10.6598 8.47842 10.9247 8.94103 11.3879L8.99637 11.4433C9.30477 11.7517 9.30477 12.2504 8.99637 12.557L8.56112 12.9922C7.46865 14.0841 6.00062 14.6979 4.45922 14.7532C4.43746 14.7532 4.4157 14.7532 4.39394 14.7551C2.09272 14.872 0.196906 16.7082 0.014724 19.0014C-0.209118 21.8506 2.14992 24.2091 4.99955 23.9853C7.21558 23.8112 9.02062 22.0365 9.22829 19.8222C9.23824 19.7271 9.24384 19.6326 9.24632 19.5374C9.2998 17.9941 9.91536 16.5223 11.0072 15.4297L11.4369 15.0007C11.7453 14.6923 12.2439 14.6923 12.5511 15.0007L12.6145 15.0641C13.0759 15.5249 13.3426 16.1585 13.3072 16.8095C13.2972 16.9955 13.301 17.1833 13.319 17.3754C13.485 19.1227 14.894 20.5392 16.6412 20.7114C18.9878 20.9427 20.9452 18.9878 20.7176 16.6392C20.5472 14.8863 19.1246 13.4735 17.3712 13.3131C17.179 13.295 16.9875 13.2913 16.801 13.3031C16.1462 13.3404 15.5108 13.0737 15.0476 12.6104L14.9941 12.557C14.6857 12.2485 14.6857 11.7498 14.9941 11.4433L15.4337 11.0043C16.5262 9.91238 17.996 9.29865 19.5418 9.24331V9.24517L19.5424 9.24455Z"
        fill="#E83069"
      />
    </svg>
  );
}

// ─── Grid background (CSS recreation of Figma grid pattern) ───────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[998px] h-[998px]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px)",
          backgroundSize: "83px 83px",
          maskImage:
            "radial-gradient(ellipse 55% 55% at 50% 50%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 55% 55% at 50% 50%, black 0%, transparent 100%)",
          opacity: 0.6,
        }}
      />
    </div>
  );
}

// ─── Animated loading bar ──────────────────────────────────────────────────────
// Indeterminate two-segment sweep — visually distinct from a plain fill
function LoadingBar() {
  return (
    /* track: 6px tall */
    <div className="relative h-1.5 rounded-full w-[298px] overflow-hidden bg-[#f5c6d4]">
      {/* slow wide segment */}
      <motion.div
        className="absolute top-0 h-full w-2/5 rounded-full bg-[#e83069]"
        animate={{ x: ["-100%", "340%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.1 }}
      />
      {/* fast narrow segment — trails the first */}
      <motion.div
        className="absolute top-0 h-full w-1/5 rounded-full bg-[#e83069] opacity-60"
        animate={{ x: ["-100%", "600%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeIn", delay: 0.28, repeatDelay: 0.1 }}
      />
    </div>
  );
}

// ─── Typewriter heading ────────────────────────────────────────────────────────
const HEADING = "Setting up pulse for you";

function TypewriterHeading() {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  // Type out characters one by one
  useEffect(() => {
    let i = 0;
    // small initial delay so the logo pops in first
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(HEADING.slice(0, i));
        if (i >= HEADING.length) clearInterval(interval);
      }, 55); // ~55 ms per character → ~1.3 s total
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(start);
  }, []);

  // Blink cursor; stop blinking once typing finishes
  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  const done = displayed.length === HEADING.length;

  return (
    <motion.h1
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.2 }}
      className="text-[#181d27] text-[36px] font-semibold leading-[44px] tracking-[-0.72px] text-center mb-5 min-h-[44px]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {displayed}
      {/* blinking cursor — hidden once fully typed */}
      {!done && (
        <span
          className="inline-block w-[2px] h-[34px] ml-[2px] align-middle rounded-sm bg-[#e83069] transition-opacity"
          style={{ opacity: showCursor ? 1 : 0 }}
        />
      )}
    </motion.h1>
  );
}

// ─── Main loading screen ───────────────────────────────────────────────────────
interface LoadingScreenProps {
  onDone: () => void;
  /** Total duration in ms (default 3500) */
  duration?: number;
}

export default function LoadingScreen({
  onDone,
  duration = 3500,
}: LoadingScreenProps) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <motion.div
      key="loading-screen"
      className="fixed inset-0 z-[9999] flex flex-col bg-[#fffaf5] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
    >
      <GridBackground />

      {/* Center content */}
      <div className="relative flex-1 flex flex-col items-center justify-center gap-0">
        {/* Logomark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-6"
        >
          <Logomark size={70} />
        </motion.div>

        {/* Heading — typing effect */}
        <TypewriterHeading />

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="mb-5"
        >
          <LoadingBar />
        </motion.div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.5, ease: "easeOut" }}
          className="text-[#535862] text-[20px] font-normal leading-[30px] text-center max-w-[580px]"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Turn unstructured feedback into insight that drives smarter, faster
          decisions.
        </motion.p>
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-center pb-8">
        <p
          className="text-[14px] leading-[20px] text-black/50"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          © Canvs 2025
        </p>
      </div>
    </motion.div>
  );
}
