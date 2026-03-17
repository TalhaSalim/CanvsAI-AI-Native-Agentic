"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, ChevronRight } from "lucide-react";

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Datasets", href: "/" },
  { label: "Agents", href: "/agents" },
  { label: "Reports", href: "/reports" },
  { label: "Insights", href: "/insights" },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const NOTIFICATIONS = [
  {
    id: 1,
    title: "Agent #142 needs attention",
    desc: "Customer Feedback agent has a low sentiment score",
    time: "2 min ago",
    unread: true,
  },
  {
    id: 2,
    title: "Report ready",
    desc: "Q2 Brand Health Report has been generated",
    time: "18 min ago",
    unread: true,
  },
  {
    id: 3,
    title: "Insight detected",
    desc: "Anomaly found in Product Reviews dataset",
    time: "1h ago",
    unread: false,
  },
  {
    id: 4,
    title: "Dataset sync complete",
    desc: "NPS Q4 2024 dataset successfully synced",
    time: "3h ago",
    unread: false,
  },
];

const RECENT_SEARCHES = [
  "NPS Q4 2024",
  "Brand Sentiment Analysis",
  "Agent #142 — Customer Feedback",
];

const PROFILE_MENU = [
  { label: "Your Profile", emoji: "👤" },
  { label: "Workspace Settings", emoji: "⚙️" },
  { label: "Billing & Plans", emoji: "💳" },
  { label: "Keyboard Shortcuts", emoji: "⌨️" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Header({
  activeMode = "studio",
  onModeChange,
}: {
  activeMode?: "studio" | "pulse";
  onModeChange?: (mode: "studio" | "pulse") => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnDatasetsPage = pathname === "/";
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      )
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setNotifOpen(false);
        setProfileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function openSearch() {
    setNotifOpen(false);
    setProfileOpen(false);
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  const filteredResults = searchQuery
    ? NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <>
      {/* ── Header Bar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E9EAEB]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-[72px] px-8">

          {/* Left: Logo + Page navigation tabs (Studio only) */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <CanvsLogomark />
              <CanvsWordmark />
            </Link>

            {/* Page nav tabs — only visible in Studio mode */}
            {activeMode === "studio" && (
              <div className="flex items-center gap-1 bg-white border border-[#E9EAEB] rounded-[10px] p-1">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center justify-center h-9 px-3 rounded-md text-sm font-semibold
                                  whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-white text-[#414651] shadow-[0px_1px_3px_0px_rgba(10,13,18,0.1),0px_1px_2px_-1px_rgba(10,13,18,0.1)]"
                          : "text-[#717680] hover:text-[#414651] hover:bg-[#FFF0E8]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Center: Studio / Pulse product switcher */}
          <div className="flex items-center gap-1 bg-white border border-[#E9EAEB] rounded-xl p-1.5">
            <button
              onClick={() => { if (isOnDatasetsPage) { onModeChange?.("studio"); } else { router.push("/"); } }}
              className={`flex items-center justify-center h-11 px-3 rounded-md text-base font-semibold whitespace-nowrap transition-colors ${
                activeMode === "studio"
                  ? "bg-[#E83069] text-white shadow-[0px_1px_3px_0px_rgba(10,13,18,0.1),0px_1px_2px_-1px_rgba(10,13,18,0.1)]"
                  : "text-[#717680] hover:text-[#414651] hover:bg-[#FFF0E8]"
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => { if (isOnDatasetsPage) { onModeChange?.("pulse"); } else { router.push("/?view=pulse"); } }}
              className={`flex items-center justify-center h-11 px-3 rounded-md text-base font-semibold whitespace-nowrap transition-colors ${
                activeMode === "pulse"
                  ? "bg-[#E83069] text-white shadow-[0px_1px_3px_0px_rgba(10,13,18,0.1),0px_1px_2px_-1px_rgba(10,13,18,0.1)]"
                  : "text-[#717680] hover:text-[#414651] hover:bg-[#FFF0E8]"
              }`}
            >
              Pulse
            </button>
          </div>

          {/* Right: Action icons + Avatar */}
          <div className="flex items-center gap-3 justify-end">
            <div className="flex items-center gap-0.5">

              {/* Search icon */}
              <button
                onClick={openSearch}
                title="Search (⌘K)"
                className="flex items-center justify-center w-10 h-10 rounded-md
                           text-[#717680] hover:text-[#414651] hover:bg-[#FFF0E8] transition-colors"
              >
                <IconSearch />
              </button>

              {/* Settings icon */}
              <button
                className="flex items-center justify-center w-10 h-10 rounded-md
                           text-[#717680] hover:text-[#414651] hover:bg-[#FFF0E8] transition-colors"
              >
                <IconSettings />
              </button>

              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setProfileOpen(false);
                  }}
                  className="relative flex items-center justify-center w-10 h-10 rounded-md
                             text-[#717680] hover:text-[#414651] hover:bg-[#FFF0E8] transition-colors"
                >
                  <IconBell />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E83069] border-2 border-white" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] bg-white border border-[#E9EAEB]
                                  rounded-xl shadow-[0px_8px_24px_rgba(10,13,18,0.12)] z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#111827]">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-xs font-semibold bg-[#E83069] text-white px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-[#717680] hover:text-[#111827] font-medium transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#FFFAF5]
                                      transition-colors border-b border-[#F9FAFB] last:border-0
                                      ${n.unread ? "bg-[#FFFAF5]" : "bg-white"}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.unread ? "bg-[#E83069]" : "bg-[#E9EAEB]"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#111827]">{n.title}</p>
                            <p className="text-xs text-[#717680] mt-0.5">{n.desc}</p>
                            <p className="text-xs text-[#A4A7AE] mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-[#F3F4F6]">
                      <button className="w-full text-xs font-medium text-[#717680] hover:text-[#111827] transition-colors py-1">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile / Avatar */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full
                           border border-[rgba(0,0,0,0.08)] bg-[#F3F4F6]
                           text-sm font-semibold text-[#374151]
                           hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                title="Profile"
              >
                JM
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] bg-white border border-[#E9EAEB]
                                rounded-xl shadow-[0px_8px_24px_rgba(10,13,18,0.12)] z-50 overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-[#F3F4F6]">
                    <p className="text-sm font-semibold text-[#111827]">Jordan Mitchell</p>
                    <p className="text-xs text-[#717680] mt-0.5">jordan@canvsai.com</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {PROFILE_MENU.map((item) => (
                      <button
                        key={item.label}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm
                                   text-[#414651] hover:bg-[#FFFAF5] transition-colors text-left"
                      >
                        <span className="text-base leading-none">{item.emoji}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-[#F3F4F6] py-1">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm
                                 text-[#414651] hover:bg-[#FFFAF5] transition-colors text-left"
                    >
                      <span className="text-base leading-none">🚪</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Search Overlay ────────────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSearch}
          />

          {/* Modal */}
          <div className="relative w-full max-w-[560px] mx-4 bg-white rounded-2xl
                          shadow-[0px_24px_48px_rgba(10,13,18,0.18)] border border-[#E9EAEB]
                          overflow-hidden">
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F3F4F6]">
              <IconSearch className="text-[#A4A7AE] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search datasets, agents, reports, insights…"
                className="flex-1 text-sm text-[#111827] placeholder:text-[#A4A7AE] outline-none bg-transparent"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[#A4A7AE] hover:text-[#717680] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="text-xs bg-[#F3F4F6] border border-[#E9EAEB] text-[#717680]
                                px-1.5 py-0.5 rounded-md font-mono shrink-0">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results / Recent */}
            <div className="p-3">
              {!searchQuery ? (
                <>
                  <p className="text-xs font-semibold text-[#A4A7AE] px-2 mb-1 uppercase tracking-wide">
                    Recent
                  </p>
                  {RECENT_SEARCHES.map((item) => (
                    <button
                      key={item}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg
                                 hover:bg-[#FFFAF5] text-sm text-[#414651] text-left transition-colors"
                    >
                      <span className="text-[#A4A7AE] text-base">🕐</span>
                      {item}
                    </button>
                  ))}
                  <div className="border-t border-[#F3F4F6] mt-2 pt-2">
                    <p className="text-xs font-semibold text-[#A4A7AE] px-2 mb-1 uppercase tracking-wide">
                      Pages
                    </p>
                    {NAV_ITEMS.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={closeSearch}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg
                                   hover:bg-[#FFFAF5] text-sm text-[#414651] transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-[#A4A7AE]" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : filteredResults.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-[#A4A7AE] px-2 mb-1 uppercase tracking-wide">
                    Results
                  </p>
                  {filteredResults.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeSearch}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg
                                 hover:bg-[#FFFAF5] text-sm text-[#414651] transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-[#A4A7AE]" />
                      {item.label}
                    </Link>
                  ))}
                </>
              ) : (
                <p className="text-sm text-[#A4A7AE] px-2 py-6 text-center">
                  No results for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#F3F4F6] bg-[#FFFAF5]">
              <span className="text-xs text-[#A4A7AE]">↑↓ navigate</span>
              <span className="text-xs text-[#A4A7AE]">↵ select</span>
              <span className="text-xs text-[#A4A7AE]">ESC close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function CanvsLogomark() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M19.5424 9.24455C19.5642 9.24455 19.5859 9.24455 19.6058 9.24268C21.9052 9.13014 23.8029 7.29392 23.985 4.9988C24.2108 2.14779 21.8498 -0.210753 19.0002 0.0149653C16.7861 0.189073 14.981 1.96373 14.7733 4.17614C14.7634 4.27128 14.7578 4.3658 14.7553 4.45907C14.7018 6.00241 14.0863 7.47238 12.9944 8.56242L12.5548 9.00142C12.2464 9.30984 11.7478 9.30984 11.4406 9.00142L11.3853 8.94608C10.922 8.48283 10.6553 7.84982 10.6926 7.19692C10.7025 7.01099 10.7007 6.82072 10.6826 6.6292C10.5204 4.88004 9.1114 3.46168 7.36232 3.28757C5.0095 3.05377 3.0484 5.01684 3.28405 7.36916C3.46002 9.11646 4.87706 10.523 6.62613 10.6853C6.81827 10.7033 7.00791 10.7071 7.19196 10.6952C7.84483 10.6598 8.47842 10.9247 8.94103 11.3879L8.99637 11.4433C9.30477 11.7517 9.30477 12.2504 8.99637 12.557L8.56112 12.9922C7.46865 14.0841 6.00062 14.6979 4.45922 14.7532C4.43746 14.7532 4.4157 14.7532 4.39394 14.7551C2.09272 14.872 0.196906 16.7082 0.014724 19.0014C-0.209118 21.8506 2.14992 24.2091 4.99955 23.9853C7.21558 23.8112 9.02062 22.0365 9.22829 19.8222C9.23824 19.7271 9.24384 19.6326 9.24632 19.5374C9.2998 17.9941 9.91536 16.5223 11.0072 15.4297L11.4369 15.0007C11.7453 14.6923 12.2439 14.6923 12.5511 15.0007L12.6145 15.0641C13.0759 15.5249 13.3426 16.1585 13.3072 16.8095C13.2972 16.9955 13.301 17.1833 13.319 17.3754C13.485 19.1227 14.894 20.5392 16.6412 20.7114C18.9878 20.9427 20.9452 18.9878 20.7176 16.6392C20.5472 14.8863 19.1246 13.4735 17.3712 13.3131C17.179 13.295 16.9875 13.2913 16.801 13.3031C16.1462 13.3404 15.5108 13.0737 15.0476 12.6104L14.9941 12.557C14.6857 12.2485 14.6857 11.7498 14.9941 11.4433L15.4337 11.0043C16.5262 9.91238 17.996 9.29865 19.5418 9.24331V9.24517L19.5424 9.24455Z"
        fill="#E83069"
      />
    </svg>
  );
}

function CanvsWordmark() {
  return (
    <svg
      width="80"
      height="15"
      viewBox="0 0 96.3478 18.4604"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="canvs"
      className="shrink-0"
    >
      <path d="M9.71425 18.4603C3.88631 18.4603 1.27157e-06 14.5997 1.27157e-06 9.21426C1.27157e-06 3.82883 3.88631 0.00165239 9.71425 0.00165239C14.4642 0.00165239 18.1468 2.83361 18.8665 7.33491C18.8956 7.52057 18.7532 7.68948 18.5633 7.68948H13.2484C13.1335 7.68948 13.0279 7.62709 12.9773 7.52513C12.4276 6.42339 11.2409 5.62296 9.71425 5.62296C7.53222 5.62296 6.03313 7.2147 6.03313 9.21274C6.03313 11.2108 7.53222 12.871 9.71425 12.871C11.1751 12.871 12.3266 12.1634 12.9345 11.1012C12.9896 11.0038 13.0907 10.9399 13.204 10.9399H18.5312C18.7195 10.9399 18.8635 11.1073 18.8344 11.293C18.1453 15.7562 14.4642 18.4588 9.71425 18.4588V18.4603Z" fill="#111827"/>
      <path d="M33.7763 15.957C33.7763 15.6587 33.392 15.5415 33.2174 15.785C31.9817 17.5122 30.1381 18.4602 28.1183 18.4602C23.7895 18.4602 20.4835 14.5996 20.4835 9.21413C20.4835 3.8287 23.7895 0.00152206 28.1183 0.00152206C30.1442 0.00152206 31.9694 0.957175 33.2205 2.6737C33.3966 2.91413 33.7763 2.79544 33.7763 2.4987V0.779131C33.7763 0.61174 33.9141 0.474783 34.0826 0.474783H39.7421C39.9105 0.474783 40.0483 0.61174 40.0483 0.779131V17.6811C40.0483 17.8485 39.9105 17.9854 39.7421 17.9854H34.0826C33.9141 17.9854 33.7763 17.8485 33.7763 17.6811V15.9554V15.957ZM30.1626 12.7704C31.7673 12.7704 33.1209 11.7372 33.7089 10.6643C33.7549 10.5807 33.7763 10.4848 33.7763 10.3889V8.14435C33.7763 8.04544 33.7533 7.94804 33.7059 7.8613C33.0934 6.75804 31.8025 5.72478 30.1626 5.72478C28.2546 5.72478 26.754 7.14761 26.754 9.21413C26.754 11.2807 28.2531 12.7704 30.1626 12.7704Z" fill="#111827"/>
      <path d="M49.1807 6.95435V17.6826C49.1807 17.85 49.0429 17.987 48.8744 17.987H43.0113C42.8428 17.987 42.705 17.85 42.705 17.6826V0.779131C42.705 0.61174 42.8428 0.474783 43.0113 0.474783H48.8744C49.0429 0.474783 49.1807 0.61174 49.1807 0.779131V2.71022C49.1807 3.00239 49.5543 3.12565 49.7319 2.8913C51.084 1.1063 53.1527 0 55.3501 0C58.7923 0 60.9392 2.37087 60.9392 6.23152V17.6811C60.9392 17.8485 60.8013 17.9854 60.6329 17.9854H54.7361C54.5676 17.9854 54.4298 17.8485 54.4298 17.6811V8.36652C54.4298 6.7413 53.6458 5.72478 51.9752 5.72478C50.9141 5.72478 49.9433 6.20717 49.294 6.71696C49.222 6.77326 49.1807 6.86152 49.1807 6.95283V6.95435Z" fill="#111827"/>
      <path d="M66.0306 17.7511L62.083 0.849131C62.0386 0.658913 62.1841 0.476305 62.3816 0.476305H68.2095C68.3611 0.476305 68.4898 0.58587 68.5127 0.735L70.341 12.5483C70.364 12.6974 70.4926 12.807 70.6442 12.807H71.3118C71.4634 12.807 71.5921 12.6974 71.615 12.5483L73.4433 0.735C73.4663 0.58587 73.5949 0.476305 73.7465 0.476305H79.6082C79.8057 0.476305 79.9512 0.658913 79.9067 0.849131L75.9592 17.7511C75.927 17.8896 75.803 17.987 75.6606 17.987H66.3322C66.1898 17.987 66.0658 17.8896 66.0336 17.7511H66.0306Z" fill="#111827"/>
      <path d="M81.216 17.6826V13.2102C81.216 13.0428 81.3538 12.9059 81.5222 12.9059H89.5659C90.5888 12.9059 91.0313 12.5665 91.0313 11.9243C91.0313 11.3141 90.6224 10.9428 89.5996 10.9428H86.7024C83.0213 10.9428 80.8408 8.70739 80.8408 5.62435C80.8408 2.5413 83.3628 0.476305 86.6688 0.476305H95.1212C95.2897 0.476305 95.4275 0.613261 95.4275 0.780652V5.25304C95.4275 5.42044 95.2897 5.55739 95.1212 5.55739H87.3165C86.7024 5.55739 86.3625 5.76131 86.3625 6.23457C86.3625 6.70783 86.704 6.94522 87.3165 6.94522H90.0773C94.2347 6.94522 96.3478 9.31609 96.3478 12.4326C96.3478 15.5491 94.1321 17.987 90.0421 17.987H81.5207C81.3522 17.987 81.2144 17.85 81.2144 17.6826H81.216Z" fill="#111827"/>
    </svg>
  );
}

// ─── Icons (SVG matching Figma search-lg / settings-01 / bell-01) ────────────
function IconSearch({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.1667 12.5C16.0559 12.7513 16.0228 13.0302 16.0723 13.3005C16.1218 13.5708 16.2514 13.8203 16.4444 14.0139L16.4917 14.0611C16.6491 14.2184 16.7748 14.405 16.8614 14.6103C16.9479 14.8155 16.9925 15.0355 16.9925 15.2577C16.9925 15.4798 16.9479 15.6998 16.8614 15.9051C16.7748 16.1103 16.6491 16.2969 16.4917 16.4542C16.3344 16.6116 16.1478 16.7372 15.9426 16.8238C15.7374 16.9104 15.5174 16.955 15.2952 16.955C15.0731 16.955 14.8531 16.9104 14.6478 16.8238C14.4426 16.7372 14.2561 16.6116 14.0987 16.4542L14.0514 16.4069C13.8579 16.214 13.6084 16.0843 13.338 16.0349C13.0677 15.9854 12.7889 16.0184 12.5375 16.1292C12.2912 16.2346 12.0819 16.41 11.9347 16.6339C11.7875 16.8578 11.7088 17.1201 11.7083 17.3889V17.5C11.7083 17.9421 11.5328 18.366 11.2202 18.6786C10.9076 18.9912 10.4837 19.1667 10.0417 19.1667C9.59965 19.1667 9.17573 18.9912 8.86317 18.6786C8.55061 18.366 8.37502 17.9421 8.37502 17.5V17.4306C8.36859 17.1546 8.27959 16.8871 8.12007 16.6626C7.96054 16.438 7.73748 16.2666 7.48002 16.1708C7.22864 16.0599 6.94981 16.027 6.6795 16.0765C6.4092 16.1259 6.15964 16.2556 5.96613 16.4486L5.9189 16.4958C5.76157 16.6532 5.57503 16.7788 5.36979 16.8654C5.16454 16.952 4.94453 16.9966 4.72238 16.9966C4.50022 16.9966 4.28021 16.952 4.07497 16.8654C3.86973 16.7788 3.68318 16.6532 3.52585 16.4958C3.36843 16.3385 3.24285 16.152 3.15625 15.9467C3.06966 15.7415 3.02504 15.5215 3.02504 15.2993C3.02504 15.0772 3.06966 14.8572 3.15625 14.6519C3.24285 14.4467 3.36843 14.2601 3.52585 14.1028L3.57308 14.0556C3.76608 13.862 3.89571 13.6125 3.94516 13.3422C3.9946 13.0719 3.96167 12.793 3.85085 12.5417C3.7454 12.2954 3.56997 12.086 3.34611 11.9388C3.12225 11.7916 2.85988 11.713 2.59169 11.7125H2.50002C2.05799 11.7125 1.63407 11.537 1.32151 11.2244C1.00895 10.9118 0.833359 10.4879 0.833359 10.0459C0.833359 9.60381 1.00895 9.17989 1.32151 8.86733C1.63407 8.55477 2.05799 8.37917 2.50002 8.37917H2.56947C2.84543 8.37274 3.11301 8.28374 3.33751 8.12421C3.562 7.96469 3.73346 7.74163 3.82919 7.48417C3.94002 7.23279 3.97294 6.95395 3.9235 6.68365C3.87405 6.41335 3.74442 6.16379 3.55141 5.97028L3.50419 5.92305C3.34677 5.76572 3.22119 5.57917 3.1346 5.37393C3.048 5.16868 3.00338 4.94868 3.00338 4.72652C3.00338 4.50437 3.048 4.28436 3.1346 4.07912C3.22119 3.87387 3.34677 3.68733 3.50419 3.53C3.66152 3.37258 3.84806 3.247 4.05331 3.1604C4.25856 3.07381 4.47856 3.02919 4.70072 3.02919C4.92288 3.02919 5.14288 3.07381 5.34812 3.1604C5.55337 3.247 5.73991 3.37258 5.89724 3.53L5.94447 3.57723C6.13799 3.77023 6.38754 3.89986 6.65784 3.9493C6.92814 3.99875 7.20699 3.96582 7.45835 3.855H7.50002C7.74631 3.74955 7.95573 3.57412 8.10291 3.35026C8.25009 3.1264 8.3287 2.86403 8.32919 2.59583V2.5C8.32919 2.05797 8.50478 1.63405 8.81734 1.32149C9.1299 1.00893 9.55383 0.833336 9.99585 0.833336C10.4379 0.833336 10.8618 1.00893 11.1744 1.32149C11.4869 1.63405 11.6625 2.05797 11.6625 2.5V2.56945C11.663 2.83765 11.7416 3.10001 11.8888 3.32387C12.036 3.54773 12.2454 3.72316 12.4917 3.82862C12.7431 3.93944 13.0219 3.97237 13.2922 3.92292C13.5625 3.87348 13.812 3.74385 14.0056 3.55084L14.0528 3.50362C14.2101 3.3462 14.3967 3.22062 14.6019 3.13402C14.8072 3.04743 15.0272 3.00281 15.2493 3.00281C15.4715 3.00281 15.6915 3.04743 15.8968 3.13402C16.102 3.22062 16.2885 3.3462 16.4459 3.50362C16.6033 3.66095 16.7289 3.84749 16.8155 4.05274C16.9021 4.25799 16.9467 4.47799 16.9467 4.70015C16.9467 4.9223 16.9021 5.14231 16.8155 5.34755C16.7289 5.5528 16.6033 5.73934 16.4459 5.89667L16.3986 5.9439C16.2056 6.13741 16.076 6.38697 16.0266 6.65727C15.9771 6.92757 16.0101 7.20641 16.1209 7.45779V7.5C16.2264 7.74629 16.4018 7.95571 16.6256 8.10289C16.8495 8.25007 17.1119 8.32868 17.38 8.32917H17.5C17.9421 8.32917 18.366 8.50476 18.6785 8.81732C18.9911 9.12988 19.1667 9.55381 19.1667 9.99583C19.1667 10.4379 18.9911 10.8618 18.6785 11.1743C18.366 11.4869 17.9421 11.6625 17.5 11.6625H17.4306C17.1624 11.663 16.9 11.7416 16.6762 11.8888C16.4523 12.036 16.2769 12.2454 16.1714 12.4917L16.1667 12.5Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBell() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 14.1667C7.5 15.0871 8.61929 16.6667 10 16.6667C11.3807 16.6667 12.5 15.0871 12.5 14.1667M10 2.5V3.33333M10 3.33333C7.23858 3.33333 5 5.57191 5 8.33333C5 10.8194 5 12.0833 3.75 13.3333H16.25C15 12.0833 15 10.8194 15 8.33333C15 5.57191 12.7614 3.33333 10 3.33333Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
