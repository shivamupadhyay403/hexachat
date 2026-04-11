import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Send, Search, Phone, Video,
  MoreHorizontal, ArrowLeft, Loader2,
} from "lucide-react";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Avatar     from "../ui/Avatar";
import {
  fetchMessages, appendMessage,
  upsertContact, clearUnread,
} from "@/store/slices/chatSlice";
import { getSocket }             from "@/socket/socketClient";
import { useSocket }             from "@/hooks/useSocket";
import useUser                   from "@/hooks/useUser";
import { playReceiveSound, playSentSound } from "@/utils/chatSound";

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
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {contact.lastTime}
            </span>
          )}
        </div>
        <p className={`text-xs truncate ${isTyping ? "text-emerald-500 italic" : "text-muted-foreground"}`}>
          {isTyping ? "typing..." : (contact.lastMsg || "Say hi!")}
        </p>
      </div>

      {/* Unread badge */}
      {unread > 0 && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Message({ msg, myId }) {
  const isMe = String(msg.senderId) === String(myId);
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : (msg.time ?? "");

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
        isMe
          ? "bg-violet-600 text-white rounded-br-sm"
          : "bg-muted text-foreground rounded-bl-sm"
      } ${msg.pending ? "opacity-60" : ""}`}>
        <p>{msg.text}</p>
        <p className={`text-[10px] mt-1 flex items-center gap-1 ${
          isMe ? "text-violet-200 justify-end" : "text-muted-foreground"
        }`}>
          {time}
          {isMe && msg.pending && <Loader2 size={9} className="animate-spin" />}
        </p>
      </div>
    </div>
  );
}

// ─── Chats page ───────────────────────────────────────────────────────────────
export default function Chats() {
  const location  = useLocation();
  const dispatch  = useDispatch();
  const { getUserId } = useUser();

  const myId = String(getUserId());

  useSocket(myId);

  // Request notification permission once on mount
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const onlineUsers   = useSelector((s) => s.onlineUsers);
  const conversations = useSelector((s) => s.chat.conversations);
  const loadingFor    = useSelector((s) => s.chat.loadingFor);
  const typingUsers   = useSelector((s) => s.chat.typingUsers);
  const reduxContacts = useSelector((s) => s.chat.contacts); // ← from Redux now

  const [activeContact,  setActiveContact]  = useState(null);
  const [input,  setInput]  = useState("");
  const [query,  setQuery]  = useState("");
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  const messages        = activeContact ? (conversations[activeContact.id] ?? []) : [];
  const contactIsTyping = activeContact ? !!typingUsers[activeContact.id] : false;

  // ── Play sound for incoming messages ──────────────────────────────────────
  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (!activeContact) return;
    const count = messages.length;
    if (count > prevMsgCount.current) {
      const latest = messages[count - 1];
      if (latest && String(latest.senderId) !== myId && !latest.pending) {
        playReceiveSound();
      }
    }
    prevMsgCount.current = count;
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open a contact + fetch history ────────────────────────────────────────
  const openContact = useCallback((contact) => {
    const c = { ...contact, id: String(contact.id) };
    setActiveContact(c);

    // Sync into Redux contacts list (so it persists if navigated away)
    dispatch(upsertContact({ id: c.id, name: c.name, username: c.username ?? "" }));

    // Clear unread badge
    dispatch(clearUnread(c.id));

    dispatch(fetchMessages(c.id));
    prevMsgCount.current = 0;
  }, [dispatch]);

  // ── Handle navigation from FindPeople ─────────────────────────────────────
  useEffect(() => {
    const initContact = location.state?.initContact;
    if (initContact) openContact(initContact);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-select first contact on desktop ──────────────────────────────────
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

  // ── Typing helpers ────────────────────────────────────────────────────────
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
    return () => {
      clearTimeout(typingTimer.current);
      emitTyping(false);
    };
  }, [activeContact?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !activeContact) return;
    const socket = getSocket();
    if (!socket?.connected) { console.warn("Socket not connected"); return; }

    clearTimeout(typingTimer.current);
    emitTyping(false);

    const tempId = `temp-${Date.now()}`;
    const text   = input.trim();

    dispatch(appendMessage({
      id: tempId, tempId, text,
      senderId: myId, recipientId: activeContact.id,
      myId, pending: true,
      createdAt: new Date().toISOString(),
    }));

    // Update contact preview in sidebar
    dispatch(upsertContact({
      id:       activeContact.id,
      name:     activeContact.name,
      username: activeContact.username ?? "",
      lastMsg:  text,
      lastTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    socket.emit("private_message", { recipientId: activeContact.id, tempId, text });
    playSentSound();
    setInput("");
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

      {/* ── Contact list ── */}
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

      {/* ── Chat window ── */}
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
                <p className="text-sm font-semibold text-foreground truncate">
                  {activeContact.name}
                </p>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    <Message key={msg.id ?? msg.tempId} msg={msg} myId={myId} />
                  ))}
                  {contactIsTyping && <TypingBubble />}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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