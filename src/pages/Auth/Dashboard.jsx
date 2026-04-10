// Dashboard.jsx
// Shell layout:
//   lg+  → Sidebar always visible (static) + no BottomNav
//   <lg  → Sidebar hidden (slide-over via hamburger) + BottomNav fixed at bottom

import { useState } from "react";

import Sidebar   from "./layout/Sidebar";
import Topbar    from "./layout/Topbar";
import BottomNav from "./layout/BottomNav";

import Feed       from "./pages/Feed";
import Post       from "./pages/Post";
import Chats      from "./pages/Chats";
import FindPeople from "./pages/FindPeople";
import Profile    from "./pages/Profile";

const PAGE_COMPONENTS = {
  feed:    Feed,
  post:    Post,
  chats:   Chats,
  people:  FindPeople,
  profile: Profile,
};

const CURRENT_USER = {
  name: "Arjun Kumar",
  handle: "@arjunk",
  avatarSrc: null,
};

export default function Dashboard() {
  const [activeTab, setActiveTab]     = useState("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const ActivePage = PAGE_COMPONENTS[activeTab] || Feed;

  return (
    // overflow-hidden prevents the fixed sidebar from causing scroll on desktop
    <div className="flex h-screen bg-background overflow-hidden">

      {/*
        Single Sidebar instance.
        - On lg+: `lg:static lg:translate-x-0` keeps it in flex flow
        - On <lg:  `fixed` + translate driven by sidebarOpen
      */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={CURRENT_USER}
      />

      {/* Right side — topbar + scrollable page content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          activeTab={activeTab}
          onMenuClick={() => setSidebarOpen(true)}
          onlineCount={128}
        />

        {/*
          pb-20 lg:pb-0 — clears the fixed BottomNav on mobile/tablet
          No extra padding needed on desktop since BottomNav is hidden there
        */}
        <main className="flex-1 overflow-y-auto px-4 py-2 pb-20 lg:pb-2">
          <ActivePage currentUser={CURRENT_USER} />
        </main>
      </div>

      {/* BottomNav — lg:hidden ensures it never appears on desktop */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={setActiveTab}
        unreadChats={2}
      />
    </div>
  );
}
