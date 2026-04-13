import { useEffect, useRef, useState } from "react";
import { Bell, UserPlus, Heart, MessageCircle, UserCheck } from "lucide-react";
import api from "@/assets/api";
import Avatar from "../ui/Avatar";
import { getSocket } from "@/socket/socketClient";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const ICONS = {
  follow_request: <UserPlus size={14} className="text-violet-500" />,
  follow_accepted: <UserCheck size={14} className="text-emerald-500" />,
  followed: <UserCheck size={14} className="text-emerald-500" />,
  like: <Heart size={14} className="text-rose-500" />,
  comment: <MessageCircle size={14} className="text-blue-500" />,
};

const LABELS = {
  follow_request: "sent you a follow request",
  follow_accepted: "accepted your follow request",
  followed: "started following you",
  like: "liked your post",
  comment: "commented on your post",
};

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  // ── Fetch on open ─────────────────────────────────────────────────────────
  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifs(data.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // ── Mark read when panel opened ───────────────────────────────────────────
  useEffect(() => {
    if (open) {
      fetchNotifs();
      api.patch("/notifications/read").catch(() => {});
      // Optimistically mark all as read locally
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [open]);

  // ── Real-time socket notification ─────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (notif) => {
      setNotifs((prev) => [{ ...notif, read: false }, ...prev]);
    };
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, []);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Accept / reject follow request ───────────────────────────────────────
  const handleAccept = async (senderId, notifId) => {
    await api.post("/social/follow/accept", { requesterId: senderId });
    setNotifs((prev) => prev.filter((n) => n._id !== notifId));
  };
  const handleReject = async (senderId, notifId) => {
    await api.post("/social/follow/reject", { requesterId: senderId });
    setNotifs((prev) => prev.filter((n) => n._id !== notifId));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Notifications
            </p>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex justify-center py-8 text-muted-foreground text-xs">
                Loading…
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <Bell size={24} strokeWidth={1.5} />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 flex items-start gap-3 ${!n.read ? "bg-violet-50 dark:bg-violet-900/10" : ""}`}
                >
                  <Avatar name={n.sender?.name ?? "?"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold">{n.sender?.name}</span>{" "}
                      {LABELS[n.type]}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>

                    {/* Accept / Reject buttons for follow requests */}
                    {n.type === "follow_request" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAccept(n.sender._id, n._id)}
                          className="text-[11px] px-3 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(n.sender._id, n._id)}
                          className="text-[11px] px-3 py-1 rounded-lg border border-border text-muted-foreground hover:bg-accent transition"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="flex-shrink-0 mt-0.5">{ICONS[n.type]}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
