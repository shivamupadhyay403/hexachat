// Dashboard.jsx
// Root shell — wires Sidebar + Topbar + page components together

import { useState } from "react";

import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";

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
  const [activeTab, setActiveTab]       = useState("feed");
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  const ActivePage = PAGE_COMPONENTS[activeTab] || Feed;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={CURRENT_USER}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          activeTab={activeTab}
          onMenuClick={() => setSidebarOpen(true)}
          onlineCount={128}
        />

        <main className="flex-1 overflow-y-auto px-4 py-2">
          <ActivePage currentUser={CURRENT_USER} />
        </main>
      </div>
    </div>
  );
}
