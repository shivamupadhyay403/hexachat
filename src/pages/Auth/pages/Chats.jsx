// pages/Chats.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Send,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Avatar from "../ui/Avatar";
import { fetchMessages, appendMessage } from "@/store/slices/chatSlice";
import { getSocket } from "@/socket/socketClient";
import useUser from "@/hooks/useUser";

// ─── ContactItem ────────────────────────────────────────────────────────────
function ContactItem({ contact, active, onClick }) {
  const onlineUsers = useSelector((s) => s.onlineUsers);
  const isOnline = !!onlineUsers[contact.id];

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
          <p className="text-sm font-semibold text-foreground truncate">
            {contact.name}
          </p>
          {contact.lastTime && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {contact.lastTime}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {contact.lastMsg || "Say hi!"}
        </p>
      </div>
    </div>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────
function Message({ msg, myId }) {
  const isMe = msg.senderId === myId;
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : (msg.time ?? "");

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? "bg-violet-600 text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        } ${msg.pending ? "opacity-60" : ""}`}
      >
        <p>{msg.text}</p>
        <p
          className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? "text-violet-200 justify-end" : "text-muted-foreground"}`}
        >
          {time}
          {isMe && msg.pending && <Loader2 size={9} className="animate-spin" />}
        </p>
      </div>
    </div>
  );
}

// ─── Chats page ─────────────────────────────────────────────────────────────
export default function Chats() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { getUserId } = useUser();
  const onlineUsers = useSelector((s) => s.onlineUsers);
  const conversations = useSelector((s) => s.chat.conversations);
  const loadingFor = useSelector((s) => s.chat.loadingFor);

  const [activeContact, setActiveContact] = useState(null);
  const [recentContacts, setRecentContacts] = useState([]); // contacts we've chatted with
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const bottomRef = useRef(null);

  // ── Messages for active conversation ──────────────────────────────────────
  const messages = activeContact ? (conversations[activeContact.id] ?? []) : [];

  // ── Open a contact (fetch history) ────────────────────────────────────────
  const openContact = useCallback(
    (contact) => {
      setActiveContact(contact);
      // add to recent list if not already present
      setRecentContacts((prev) =>
        prev.some((c) => c.id === contact.id) ? prev : [contact, ...prev],
      );
      dispatch(fetchMessages(contact.id));
    },
    [dispatch],
  );

  // ── Handle navigation from FindPeople ─────────────────────────────────────
  useEffect(() => {
    const initContact = location.state?.initContact;
    if (initContact) openContact(initContact);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-select on desktop when no initContact ────────────────────────────
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const select = () => {
      if (mql.matches && !location.state?.initContact) {
        setActiveContact((c) => c ?? recentContacts[0] ?? null);
      }
    };
    select();
    mql.addEventListener("change", select);
    return () => mql.removeEventListener("change", select);
  }, [recentContacts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !activeContact) return;
    const socket = getSocket();
    const tempId = `temp-${Date.now()}`;
    const text = input.trim();

    // Optimistic update
    dispatch(
      appendMessage({
        id: tempId,
        tempId,
        text,
        senderId: myId,
        recipientId: activeContact.id,
        myId,
        pending: true,
        createdAt: new Date().toISOString(),
      }),
    );

    socket.emit("private_message", {
      recipientId: activeContact.id,
      tempId,
      text,
    });

    setInput("");
  };

  // ── Filter recent contacts by search ─────────────────────────────────────
  const filtered = recentContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.username ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const isOnline = activeContact ? !!onlineUsers[activeContact.id] : false;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden gap-3">
      {/* ── Contact list ── */}
      <div
        className={`
          flex-col gap-2
          w-full md:w-64 md:flex-shrink-0
          ${activeContact ? "hidden md:flex" : "flex"}
        `}
      >
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
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
              {query ? `No chats found for "${query}"` : "No conversations yet"}
            </p>
          )}
        </div>
      </div>

      {/* ── Chat window ── */}
      <div
        className={`
          flex-1 flex-col border border-border rounded-2xl overflow-hidden bg-background min-w-0
          ${activeContact ? "flex" : "hidden md:flex"}
        `}
      >
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
                <p
                  className={`text-xs ${isOnline ? "text-emerald-500" : "text-muted-foreground"}`}
                >
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>

              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hidden sm:inline-flex"
                >
                  <Phone size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hidden sm:inline-flex"
                >
                  <Video size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground"
                >
                  <MoreHorizontal size={15} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingFor === activeContact.id ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2
                    size={20}
                    className="animate-spin text-muted-foreground"
                  />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Say hi to {activeContact.name}!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <Message
                    key={msg.id ?? msg.tempId}
                    msg={msg}
                    myId={getUserId()}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
            <p className="text-sm font-medium text-foreground">
              Select a conversation
            </p>
            <p className="text-xs">
              Choose a chat from the list or message someone from Find People
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
