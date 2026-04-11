import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Send, Search, Phone, Video,
  MoreHorizontal, ArrowLeft, Loader2,
  X, Reply, Trash2, Check, CheckCheck,
} from "lucide-react";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Avatar     from "../ui/Avatar";
import {
  fetchMessages, appendMessage,
  upsertContact, clearUnread,
} from "@/store/slices/chatSlice";
import { getSocket }          from "@/socket/socketClient";
import { useSocket }          from "@/hooks/useSocket";
import useUser                from "@/hooks/useUser";
import { playReceiveSound, playSentSound } from "@/utils/chatSound";

// ─── localStorage helpers ─────────────────────────────────────────────────────
const CONTACTS_KEY = "chat_contacts";
const saveContacts = (c) => { try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(c)); } catch {} };
const loadContacts = ()  => { try { return JSON.parse(localStorage.getItem(CONTACTS_KEY)) ?? []; } catch { return []; } };

// ─── Tick icon ────────────────────────────────────────────────────────────────
function Ticks({ status }) {
  if (status === "pending")
    return <Loader2 size={9} className="animate-spin text-violet-200" />;
  if (status === "sent" || status === "delivered")
    return <Check size={11} className="text-violet-200" />;
  if (status === "seen")
    return <CheckCheck size={11} className="text-blue-300" />;
  return null;
}

// ─── Typing bubble ────────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── ContactItem ──────────────────────────────────────────────────────────────
function ContactItem({ contact, active, onClick }) {
  const onlineUsers = useSelector((s) => s.onlineUsers);
  const typingUsers = useSelector((s) => s.chat.typingUsers);
  const unread      = useSelector((s) => s.chat.unread[contact.id] ?? 0);
  const isOnline    = !!onlineUsers[contact.id];
  const isTyping    = !!typingUsers[contact.id];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
        active ? "bg-violet-50 dark:bg-violet-900/20" : "hover:bg-accent"
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar name={contact.name} size="sm" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold text-foreground truncate">{contact.name}</p>
          {contact.lastTime && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">{contact.lastTime}</span>
          )}
        </div>
        <p className={`text-xs truncate ${isTyping ? "text-emerald-500 italic" : "text-muted-foreground"}`}>
          {isTyping ? "typing..." : (contact.lastMsg || "Say hi!")}
        </p>
      </div>
      {unread > 0 && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Message({ msg, myId, onReply, onDeleteForMe, onDeleteForEveryone }) {
  const isMe = String(msg.senderId) === String(myId);

  // Swipe-to-reply state (mobile / tablet)
  const [swipeX,        setSwipeX]        = useState(0);
  const [isSwiping,     setIsSwiping]     = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const touchStartX    = useRef(null);
  const swipeTriggered = useRef(false);
  const menuRef        = useRef(null);
  const SWIPE_THRESHOLD = 60;

  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : (msg.time ?? "");

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // ── Touch / swipe handlers ────────────────────────────────────────────────
  const onTouchStart = (e) => {
    touchStartX.current    = e.touches[0].clientX;
    swipeTriggered.current = false;
    setIsSwiping(true);
  };

  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx > 0) {
      setSwipeX(Math.min(dx, SWIPE_THRESHOLD + 10));
      if (dx >= SWIPE_THRESHOLD && !swipeTriggered.current) {
        swipeTriggered.current = true;
        onReply(msg);
      }
    }
  };

  const onTouchEnd = () => {
    setSwipeX(0);
    setIsSwiping(false);
    touchStartX.current = null;
  };

  // ── Deleted states ────────────────────────────────────────────────────────
  if (msg.deletedForEveryone) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="px-3.5 py-2 rounded-2xl bg-muted/50 text-muted-foreground text-xs italic border border-dashed border-border">
          🗑️ This message was deleted
        </div>
      </div>
    );
  }
  if (msg.deletedForMe) return null;

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} group relative`}
      style={{
        transform:  `translateX(${swipeX}px)`,
        transition: isSwiping ? "none" : "transform 0.25s ease",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe reply arrow (fades in as you swipe) */}
      {swipeX > 8 && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-7 text-violet-400 pointer-events-none"
          style={{ opacity: Math.min(swipeX / SWIPE_THRESHOLD, 1) }}
        >
          <Reply size={16} />
        </div>
      )}

      {/* ── Bubble ── */}
      <div className={`max-w-[78%] sm:max-w-[65%] rounded-2xl text-sm leading-relaxed overflow-hidden ${
        isMe ? "bg-violet-600 text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
      } ${msg.pending ? "opacity-60" : ""}`}>

        {/* Reply preview strip */}
        {msg.replyTo && (
          <div className={`px-3 pt-2 pb-1 border-l-2 mx-3 mt-2 mb-1 text-xs opacity-70 ${
            isMe ? "border-violet-200 text-violet-100" : "border-violet-500 text-muted-foreground"
          }`}>
            <p className="font-semibold truncate">{msg.replyTo.senderName}</p>
            <p className="truncate">{msg.replyTo.text ?? "📎 Media"}</p>
          </div>
        )}

        {/* Text */}
        {msg.text && <p className="px-3.5 py-2">{msg.text}</p>}

        {/* Time + ticks */}
        <p className={`text-[10px] px-3.5 pb-2 flex items-center gap-1 ${
          isMe ? "text-violet-200 justify-end" : "text-muted-foreground"
        }`}>
          {time}
          {isMe && <Ticks status={msg.status ?? (msg.pending ? "pending" : "sent")} />}
        </p>
      </div>

      {/* ── Three-dot menu (desktop, appears on hover) ── */}
      <div
        ref={menuRef}
        className={`hidden md:flex items-center self-center flex-shrink-0 ${
          isMe ? "order-first mr-1.5" : "order-last ml-1.5"
        }`}
      >
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent text-muted-foreground"
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <div className={`absolute bottom-8 z-50 bg-popover border border-border rounded-xl shadow-lg py-1 w-48 text-sm ${
              isMe ? "right-0" : "left-0"
            }`}>
              <button
                onClick={() => { onReply(msg); setMenuOpen(false); }}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-foreground"
              >
                <Reply size={13} /> Reply
              </button>
              <button
                onClick={() => { onDeleteForMe(msg); setMenuOpen(false); }}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-foreground"
              >
                <Trash2 size={13} /> Delete for me
              </button>
              {isMe && (
                <button
                  onClick={() => { onDeleteForEveryone(msg); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-destructive"
                >
                  <Trash2 size={13} /> Delete for everyone
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reply bar (above input) ──────────────────────────────────────────────────
function ReplyBar({ replyTo, onCancel }) {
  if (!replyTo) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-accent border-t border-border">
      <Reply size={13} className="text-violet-500 flex-shrink-0" />
      <div className="flex-1 border-l-2 border-violet-500 pl-2 min-w-0">
        <p className="text-[10px] font-semibold text-violet-600">{replyTo.senderName}</p>
        <p className="text-xs text-muted-foreground truncate">{replyTo.text ?? "📎 Media"}</p>
      </div>
      <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Chats page ───────────────────────────────────────────────────────────────
export default function Chats() {
  const location  = useLocation();
  const dispatch  = useDispatch();
  const { getUserId, getUserFullName } = useUser();

  const myId   = String(getUserId());
  const myName = getUserFullName();

  useSocket(myId);

  useEffect(() => {
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  const onlineUsers   = useSelector((s) => s.onlineUsers);
  const conversations = useSelector((s) => s.chat.conversations);
  const loadingFor    = useSelector((s) => s.chat.loadingFor);
  const typingUsers   = useSelector((s) => s.chat.typingUsers);
  const reduxContacts = useSelector((s) => s.chat.contacts);

  const [activeContact, setActiveContact] = useState(null);
  const [input,         setInput]         = useState("");
  const [query,         setQuery]         = useState("");
  const [replyTo,       setReplyTo]       = useState(null);
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  const messages        = activeContact ? (conversations[activeContact.id] ?? []) : [];
  const contactIsTyping = activeContact ? !!typingUsers[activeContact.id] : false;

  // ── Persist / load contacts ───────────────────────────────────────────────
  useEffect(() => { if (reduxContacts.length > 0) saveContacts(reduxContacts); }, [reduxContacts]);
  useEffect(() => {
    loadContacts().forEach((c) => dispatch(upsertContact(c)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConfirmed = ({ tempId, id, createdAt }) =>
      dispatch({ type: "chat/confirmMessage", payload: { tempId, id, createdAt, status: "sent" } });

    const onSeen = ({ by, messageIds }) =>
      dispatch({ type: "chat/markSeen", payload: { by, messageIds } });

    const onDeletedForEveryone = ({ messageId }) =>
      dispatch({ type: "chat/deleteForEveryone", payload: { messageId } });

    socket.on("message_confirmed",            onConfirmed);
    socket.on("messages_seen",                onSeen);
    socket.on("message_deleted_for_everyone", onDeletedForEveryone);

    return () => {
      socket.off("message_confirmed",            onConfirmed);
      socket.off("messages_seen",                onSeen);
      socket.off("message_deleted_for_everyone", onDeletedForEveryone);
    };
  }, [dispatch]);

  // ── Emit "seen" for unread incoming messages ──────────────────────────────
  useEffect(() => {
    if (!activeContact || messages.length === 0) return;
    const socket = getSocket();
    if (!socket?.connected) return;
    const unseenIds = messages
      .filter((m) => String(m.senderId) !== myId && m.status !== "seen" && !m.pending)
      .map((m) => m.id);
    if (unseenIds.length > 0)
      socket.emit("messages_seen", { senderId: activeContact.id, messageIds: unseenIds });
  }, [messages, activeContact, myId]);

  // ── Sound ─────────────────────────────────────────────────────────────────
  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (!activeContact) return;
    const count = messages.length;
    if (count > prevMsgCount.current) {
      const latest = messages[count - 1];
      if (latest && String(latest.senderId) !== myId && !latest.pending) playReceiveSound();
    }
    prevMsgCount.current = count;
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open contact ──────────────────────────────────────────────────────────
  const openContact = useCallback((contact) => {
    const c = { ...contact, id: String(contact.id) };
    setActiveContact(c);
    dispatch(upsertContact({ id: c.id, name: c.name, username: c.username ?? "" }));
    dispatch(clearUnread(c.id));
    dispatch(fetchMessages(c.id));
    prevMsgCount.current = 0;
    setReplyTo(null);
  }, [dispatch]);

  useEffect(() => {
    const initContact = location.state?.initContact;
    if (initContact) openContact(initContact);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const select = () => {
      if (mql.matches && !location.state?.initContact)
        setActiveContact((c) => c ?? reduxContacts[0] ?? null);
    };
    select();
    mql.addEventListener("change", select);
    return () => mql.removeEventListener("change", select);
  }, [reduxContacts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, contactIsTyping]);

  // ── Typing ────────────────────────────────────────────────────────────────
  const emitTyping = (isTyping) => {
    const socket = getSocket();
    if (!socket?.connected || !activeContact) return;
    socket.emit("typing", { recipientId: activeContact.id, isTyping });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  };

  useEffect(() => {
    return () => { clearTimeout(typingTimer.current); emitTyping(false); };
  }, [activeContact?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !activeContact) return;
    const socket = getSocket();
    if (!socket?.connected) { console.warn("Socket not connected"); return; }

    clearTimeout(typingTimer.current);
    emitTyping(false);

    const tempId = `temp-${Date.now()}`;
    const text   = input.trim();

    const replyPayload = replyTo
      ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName }
      : null;

    dispatch(appendMessage({
      id: tempId, tempId, text,
      senderId: myId, recipientId: activeContact.id,
      myId, pending: true, status: "pending",
      replyTo: replyPayload,
      createdAt: new Date().toISOString(),
    }));

    dispatch(upsertContact({
      id: activeContact.id, name: activeContact.name,
      username: activeContact.username ?? "",
      lastMsg:  text,
      lastTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    socket.emit("private_message", {
      recipientId: activeContact.id,
      tempId, text,
      replyTo: replyPayload,
    });

    playSentSound();
    setInput("");
    setReplyTo(null);
  };

  // ── Delete for me ─────────────────────────────────────────────────────────
  const handleDeleteForMe = (msg) => {
    dispatch({
      type: "chat/deleteForMe",
      payload: { messageId: msg.id ?? msg.tempId, contactId: activeContact.id },
    });
  };

  // ── Delete for everyone ───────────────────────────────────────────────────
  const handleDeleteForEveryone = (msg) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("delete_message_for_everyone", {
        messageId:   msg.id ?? msg.tempId,
        recipientId: activeContact.id,
      });
    }
    dispatch({
      type: "chat/deleteForEveryone",
      payload: { messageId: msg.id ?? msg.tempId },
    });
  };

  // ── Reply ─────────────────────────────────────────────────────────────────
  const handleReply = (msg) => {
    setReplyTo({
      id:         msg.id ?? msg.tempId,
      text:       msg.text,
      senderName: String(msg.senderId) === myId ? myName : activeContact.name,
    });
  };

  // ── Search filter ─────────────────────────────────────────────────────────
  const filtered = reduxContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.username ?? "").toLowerCase().includes(query.toLowerCase())
  );

  const isOnline = activeContact ? !!onlineUsers[activeContact.id] : false;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden gap-3">

      {/* Contact list */}
      <div className={`flex-col gap-2 w-full md:w-64 md:flex-shrink-0 ${
        activeContact ? "hidden md:flex" : "flex"
      }`}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 rounded-xl text-sm h-9"
          />
        </div>
        <div className="space-y-0.5 overflow-y-auto flex-1">
          {filtered.length > 0 ? (
            filtered.map((c) => (
              <ContactItem
                key={c.id}
                contact={c}
                active={activeContact?.id === c.id}
                onClick={() => openContact(c)}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              {query
                ? `No chats found for "${query}"`
                : "No conversations yet — go to Find People to start one"}
            </p>
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className={`flex-1 flex-col border border-border rounded-2xl overflow-hidden bg-background min-w-0 ${
        activeContact ? "flex" : "hidden md:flex"
      }`}>
        {activeContact ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 md:px-4 py-3 border-b border-border">
              <button
                className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-accent text-muted-foreground"
                onClick={() => setActiveContact(null)}
              >
                <ArrowLeft size={17} />
              </button>
              <div className="relative flex-shrink-0">
                <Avatar name={activeContact.name} size="sm" />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{activeContact.name}</p>
                {contactIsTyping ? (
                  <p className="text-xs text-emerald-500 italic">typing...</p>
                ) : (
                  <p className={`text-xs ${isOnline ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hidden sm:inline-flex">
                  <Phone size={15} />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hidden sm:inline-flex">
                  <Video size={15} />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground">
                  <MoreHorizontal size={15} />
                </Button>
              </div>
            </div>

            {/* Messages area — overflow-x-hidden stops swipe from causing scroll */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
              {loadingFor === activeContact.id ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 && !contactIsTyping ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Say hi to {activeContact.name}!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <Message
                      key={msg.id ?? msg.tempId}
                      msg={msg}
                      myId={myId}
                      onReply={handleReply}
                      onDeleteForMe={handleDeleteForMe}
                      onDeleteForEveryone={handleDeleteForEveryone}
                    />
                  ))}
                  {contactIsTyping && <TypingBubble />}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply bar */}
            <ReplyBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />

            {/* Input bar — no file upload */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 rounded-xl text-sm h-9"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-9 w-9 p-0 flex-shrink-0"
              >
                <Send size={15} />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Send size={22} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-foreground">Select a conversation</p>
            <p className="text-xs">Choose a chat from the list or message someone from Find People</p>
          </div>
        )}
      </div>
    </div>
  );
}