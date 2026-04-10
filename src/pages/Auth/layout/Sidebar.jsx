// components/layout/Sidebar.jsx
// Desktop (lg+)  : static, always visible in the flex row
// Mobile/tablet  : fixed slide-over, off-screen until open=true

import {
  Home, ImagePlus, MessageCircle, Users,
  User, Settings, X, Hexagon,
} from "lucide-react";

import NavButton from "../ui/NavButton";
import UserChip  from "../ui/UserChip";

const NAV_ITEMS = [
  { id: "feed",    label: "Feed",        icon: Home },
  { id: "post",    label: "Create Post", icon: ImagePlus },
  { id: "chats",   label: "Chats",       icon: MessageCircle },
  { id: "people",  label: "Find People", icon: Users },
  { id: "profile", label: "Profile",     icon: User },
];

export default function Sidebar({
  activeTab,
  onNavigate,
  open,
  onClose,
  currentUser = { name: "Arjun Kumar", handle: "@arjunk" },
}) {
  return (
    <>
      {/* Backdrop — mobile/tablet only, shown when slide-over is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/*
        LAYOUT STRATEGY
        ───────────────
        < lg  (mobile/tablet):
          • position: fixed  →  doesn't affect flex layout at all
          • starts OFF screen (-translate-x-full)
          • slides IN when open === true (translate-x-0)

        ≥ lg  (desktop):
          • position: static  →  occupies its w-56 slot in the flex row
          • transform always reset to none (lg:translate-x-0)
          • open prop is irrelevant here
      */}
      <aside
        className={[
          // sizing & appearance
          "w-56 h-full flex flex-col bg-background border-r border-border",
          // desktop: part of normal flow
          "lg:static lg:translate-x-0 lg:z-auto",
          // mobile/tablet: fixed overlay
          "fixed top-0 left-0 z-50",
          // slide animation driven by `open` (only matters below lg)
          open ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-300 ease-in-out",
        ].join(" ")}
      >
        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Hexagon size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Hexa Chat
            </span>
          </div>
          {/* Close button — slide-over only */}
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
            Main
          </p>
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <NavButton
              key={id}
              icon={icon}
              label={label}
              active={activeTab === id}
              onClick={() => { onNavigate(id); onClose(); }}
            />
          ))}

          <div className="pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
              System
            </p>
            <NavButton icon={Settings} label="Settings" active={false} onClick={() => {}} />
          </div>
        </nav>

        {/* ── User chip ── */}
        <div className="px-3 py-3 border-t border-border">
          <UserChip
            name={currentUser.name}
            handle={currentUser.handle}
            avatarSrc={currentUser.avatarSrc}
          />
        </div>
      </aside>
    </>
  );
}
