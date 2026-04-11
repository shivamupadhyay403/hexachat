import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "@/socket/socketClient";
import { appendMessage, replaceTempMessage, setTyping, upsertContact } from "@/store/slices/chatSlice";
import { setOnlineUsers } from "@/store/slices/onlineUsersSlice";

export function useSocket(myId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();
    if (!socket) return;

    const onPrivateMessage = (msg) => {
      // Add message to conversation
      dispatch(appendMessage({ ...msg, myId: String(myId) }));

      // Ensure the sender appears in the contacts sidebar
      // even if we've never opened a chat with them before
      dispatch(upsertContact({
        id:       String(msg.senderId),
        name:     msg.senderName  ?? "Unknown",
        username: msg.senderUsername ?? "",
        lastMsg:  msg.text,
        lastTime: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit",
        }),
      }));

      // Browser notification when tab is hidden or blurred
      showNotification(msg.senderName ?? "New message", msg.text);
    };

    const onMessageDelivered = (msg) => {
      dispatch(replaceTempMessage({ ...msg, myId: String(myId) }));
    };

    const onOnlineUsers = (users) => {
      dispatch(setOnlineUsers(users));
    };

    const onTyping = ({ senderId, isTyping }) => {
      dispatch(setTyping({ userId: String(senderId), isTyping }));
    };

    socket.on("private_message",   onPrivateMessage);
    socket.on("message_delivered", onMessageDelivered);
    socket.on("online_users",      onOnlineUsers);
    socket.on("typing",            onTyping);

    return () => {
      socket.off("private_message",   onPrivateMessage);
      socket.off("message_delivered", onMessageDelivered);
      socket.off("online_users",      onOnlineUsers);
      socket.off("typing",            onTyping);
    };
  }, [dispatch, myId]);
}

// ─── Browser notification helper ─────────────────────────────────────────────
function showNotification(title, body) {
  // Only notify when tab is not visible
  if (document.visibilityState === "visible") return;

  if (Notification.permission === "granted") {
    fireNotification(title, body);
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") fireNotification(title, body);
    });
  }
}

function fireNotification(title, body) {
  const n = new Notification(title, {
    body,
    icon: "/favicon.ico",   // swap for your app icon path
    badge: "/favicon.ico",
    silent: false,
  });
  // Auto-close after 4s
  setTimeout(() => n.close(), 4000);
  // Click focuses the tab
  n.onclick = () => {
    window.focus();
    n.close();
  };
}