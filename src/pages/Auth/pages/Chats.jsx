// pages/Chats.jsx
// Two-panel chat UI — responsive: contact list on mobile, side-by-side on md+

import { useState, useRef, useEffect } from "react";
import { Send, Search, Phone, Video, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Avatar from "../ui/Avatar";

const CONTACTS = [
  { id: 1, name: "Aman Verma",   lastMsg: "Let's catch up tomorrow!", time: "2m", online: true,  unread: 2 },
  { id: 2, name: "Priya Sharma", lastMsg: "Sent you the design files.", time: "1h", online: true,  unread: 0 },
  { id: 3, name: "Ravi Mehta",   lastMsg: "Thanks for the help 🙏",    time: "3h", online: false, unread: 0 },
  { id: 4, name: "Neha Gupta",   lastMsg: "Check this out!",           time: "1d", online: false, unread: 1 },
];

const DUMMY_MESSAGES = [
  { id: 1, from: "other", text: "Hey! How's it going?",                  time: "10:00 AM" },
  { id: 2, from: "me",    text: "All good! Just wrapping up some work.", time: "10:01 AM" },
  { id: 3, from: "other", text: "Let's catch up tomorrow!",              time: "10:03 AM" },
  { id: 4, from: "me",    text: "Sure! Morning works for me 🙌",         time: "10:05 AM" },
];

function ContactItem({ contact, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
        active ? "bg-violet-50 dark:bg-violet-900/20" : "hover:bg-accent"
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar name={contact.name} size="sm" />
        {contact.online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold text-foreground truncate">{contact.name}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{contact.time}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{contact.lastMsg}</p>
      </div>
      {contact.unread > 0 && (
        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
          {contact.unread}
        </span>
      )}
    </div>
  );
}

function Message({ msg }) {
  const isMe = msg.from === "me";
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? "bg-violet-600 text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        <p>{msg.text}</p>
        <p className={`text-[10px] mt-1 ${isMe ? "text-violet-200 text-right" : "text-muted-foreground"}`}>
          {msg.time}
        </p>
      </div>
    </div>
  );
}

export default function Chats() {
  // null = show contact list on mobile; contact = show chat
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages]           = useState(DUMMY_MESSAGES);
  const [input, setInput]                 = useState("");
  const [query, setQuery]                 = useState("");
  const bottomRef = useRef(null);

  // Auto-select first contact on desktop
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const select = () => { if (mql.matches) setActiveContact((c) => c ?? CONTACTS[0]); };
    select();
    mql.addEventListener("change", select);
    return () => mql.removeEventListener("change", select);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: "me",
        text: input.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInput("");
  };

  const filtered = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden gap-3">

      {/* ── Contact list ──
          Mobile: full width, hidden when a chat is open
          Desktop (md+): fixed 256px column, always visible */}
      <div
        className={`
          flex-col gap-2
          w-full md:w-64 md:flex-shrink-0
          ${activeContact ? "hidden md:flex" : "flex"}
        `}
      >
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
          {filtered.map((c) => (
            <ContactItem
              key={c.id}
              contact={c}
              active={activeContact?.id === c.id}
              onClick={() => setActiveContact(c)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No chats found</p>
          )}
        </div>
      </div>

      {/* ── Chat window ──
          Mobile: full width, hidden when no contact selected
          Desktop (md+): fills remaining space, always visible */}
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
              {/* Back — mobile only */}
              <button
                className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-accent text-muted-foreground"
                onClick={() => setActiveContact(null)}
              >
                <ArrowLeft size={17} />
              </button>

              <div className="relative flex-shrink-0">
                <Avatar name={activeContact.name} size="sm" />
                {activeContact.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{activeContact.name}</p>
                <p className={`text-xs ${activeContact.online ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {activeContact.online ? "Online" : "Offline"}
                </p>
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
              {messages.map((msg) => (
                <Message key={msg.id} msg={msg} />
              ))}
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
          /* Empty state on desktop when nothing selected */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Send size={22} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-foreground">Select a conversation</p>
            <p className="text-xs">Choose a chat from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}
