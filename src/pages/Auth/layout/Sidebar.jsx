import {
  Settings,
  Hexagon,
  LogOut,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import NavButton from "../ui/NavButton";
import UserChip from "../ui/UserChip";
import { useAuth } from "@/context/Authcontext";



export default function Sidebar({
  open,
  onClose,
  currentUser = { name: "Arjun Kumar", handle: "@arjunk" },
  NAV_ITEMS
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // ✅ Auto close sidebar on route change (back/forward also)
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "w-56 h-full flex flex-col bg-background border-r border-border",
          "lg:static lg:translate-x-0 lg:z-auto",
          "fixed top-0 left-0 z-50",
          open ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-300 ease-in-out",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Hexagon size={14} className="text-white" />
            </div>
            <span className="font-bold text-base">Hexa Chat</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
            Main
          </p>

          {NAV_ITEMS.map(({ label, icon, path }) => (
            <NavButton
              key={path}
              icon={icon}
              label={label}
              active={location.pathname.startsWith(path)}
              onClick={() => {
                navigate(path);
              }}
            />
          ))}

          <div className="pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-2">
              System
            </p>

            <NavButton
              icon={Settings}
              label="Settings"
              active={false}
              onClick={() => {}}
            />
          </div>
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-border space-y-2">
          <UserChip
            name={currentUser.name}
            handle={currentUser.handle}
            avatarSrc={currentUser.avatarSrc}
          />

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
