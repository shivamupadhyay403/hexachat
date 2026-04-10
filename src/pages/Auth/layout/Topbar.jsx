// components/layout/Topbar.jsx
// App topbar — page title, online count, search, notifications, hamburger

import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_META = {
  feed:    { title: "Feed",        sub: "What's happening" },
  post:    { title: "Create Post", sub: "Share something" },
  chats:   { title: "Chats",       sub: "Your conversations" },
  people:  { title: "Find People", sub: "Discover connections" },
  profile: { title: "Profile",     sub: "Your public identity" },
};

export default function Topbar({ activeTab, onMenuClick, onlineCount = 128 }) {
  const meta = PAGE_META[activeTab] || { title: activeTab, sub: "" };

  return (
    <header className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background sticky top-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu size={18} />
        </Button>

        <div>
          <h1 className="text-base font-semibold text-foreground leading-tight">
            {meta.title}
          </h1>
          <p className="text-xs text-muted-foreground leading-tight">
            {meta.sub}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Online pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {onlineCount} online
        </div>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search size={17} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}
