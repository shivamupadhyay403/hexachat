// components/layout/Sidebar.jsx
// Collapsible sidebar with nav links and user chip

import { useState } from "react";
import {
  Home,
  ImagePlus,
  MessageCircle,
  Users,
  User,
  Settings,
  X,
  Hexagon,
} from "lucide-react";

import NavButton from "../ui/NavButton";
import UserChip from "../ui/UserChip";

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
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-10 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static z-20 top-0 left-0 h-full w-56
          bg-background border-r border-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Hexagon size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Hexa Chat
            </span>
          </div>
          <button
            className="md:hidden p-1 rounded-lg hover:bg-accent"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
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
              onClick={() => {
                onNavigate(id);
                onClose();
              }}
            />
          ))}

          <div className="pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
              System
            </p>
            <NavButton icon={Settings} label="Settings" active={false} />
          </div>
        </nav>

        {/* User */}
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
