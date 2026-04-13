// components/layout/BottomNav.jsx
// Instagram-style bottom tab bar
// Visible only on mobile/tablet (below lg breakpoint)
// Post tab is a plain icon — no raised pill treatment

import { Home, ImagePlus, MessageCircle, Users, User, Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Feed", icon: Home, path: "/dashboard/feed" },
  { label: "Create Post", icon: ImagePlus, path: "/dashboard/post" },
  { label: "Chats", icon: MessageCircle, path: "/dashboard/chats" },
  { label: "Find People", icon: Users, path: "/dashboard/people" },
  { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
  { label: "Profile", icon: User, path: "/dashboard/profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-stretch justify-around px-1 pt-1 pb-2">
        {NAV_ITEMS.map(({ id, icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const hasUnread = id === "chats" && unreadChats > 0;

          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 relative group"
            >
              {/* Icon + badge */}
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={`transition-colors duration-150 ${
                    isActive
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-muted-foreground group-active:text-foreground"
                  }`}
                  fill={isActive && id !== "post" ? "currentColor" : "none"}
                />

                {hasUnread && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadChats}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                className={`text-[10px] font-medium leading-none transition-colors ${
                  isActive
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>

              {/* Active underline dot */}
              <span
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-violet-500 transition-all duration-200 ${
                  isActive ? "w-6" : "w-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
