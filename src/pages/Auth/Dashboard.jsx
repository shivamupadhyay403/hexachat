import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";
import BottomNav from "./layout/BottomNav";

import Feed from "./pages/Feed";
import Post from "./pages/Post";
import Chats from "./pages/Chats";
import FindPeople from "./pages/FindPeople";
import Profile from "./pages/Profile";
import {
  Home,
  ImagePlus,
  MessageCircle,
  Users,
  User,
  Bell,
} from "lucide-react";
import useUser from "@/hooks/useUser";
import Notifications from "./pages/Notifications";
const NAV_ITEMS = [
  { label: "Feed", icon: Home, path: "/dashboard/feed", tab: "feed" },
  {
    label: "Create Post",
    icon: ImagePlus,
    path: "/dashboard/post",
    tab: "post",
  },
  {
    label: "Chats",
    icon: MessageCircle,
    path: "/dashboard/chats",
    tab: "chats",
  },
  {
    label: "Find People",
    icon: Users,
    path: "/dashboard/people",
    tab: "people",
  },
  { label: "Profile", icon: User, path: "/dashboard/profile", tab: "profile" },
  {
    label: "Notifications",
    icon: Bell,
    path: "/dashboard/notifications",
    tab: "notifications",
  },
];
export default function Dashboard() {
  const { getUserFullName, getUserEmail } = useUser();
  const location = useLocation();
  const [tab, setTab] = useState("Feed");
  const CURRENT_USER = {
    name: getUserFullName(),
    handle: getUserEmail(),
    avatarSrc: null,
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const data = NAV_ITEMS.find((item) => item.path === location.pathname);
    setTab(data?.tab);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={CURRENT_USER}
        NAV_ITEMS={NAV_ITEMS}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} activeTab={tab} />

        <main className="flex-1 overflow-y-auto px-4 py-2 pb-20 lg:pb-2">
          <Routes>
            <Route index element={<Navigate to="feed" />} />
            <Route path="feed" element={<Feed currentUser={CURRENT_USER} />} />
            <Route path="post" element={<Post currentUser={CURRENT_USER} />} />
            <Route
              path="chats"
              element={<Chats currentUser={CURRENT_USER} />}
            />
            <Route
              path="people"
              element={<FindPeople currentUser={CURRENT_USER} />}
            />
            <Route
              path="profile"
              element={<Profile currentUser={CURRENT_USER} />}
            />
            <Route path="notifications" element={<Notifications />} />
          </Routes>
        </main>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
