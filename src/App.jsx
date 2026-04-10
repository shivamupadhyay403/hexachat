import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import "./App.css";

const SOCKET_URL = "https://hexachatback.onrender.com";
const ROOMS = ["general", "design", "dev", "random"];

let socket;

function getInitials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [screen, setScreen] = useState("join");
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const [focused, setFocused] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);
  const myId = useRef(null);

  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => { window.removeEventListener("focus", onFocus); window.removeEventListener("blur", onBlur); };
  }, []);

  useEffect(() => { if (focused) setUnread(0); }, [focused]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!focused) setUnread((u) => u + 1);
  }, [messages]);

  const connect = useCallback(() => {
    if (!username.trim()) return;
    socket = io(SOCKET_URL);
    socket.on("connect", () => {
      setConnected(true);
      myId.current = socket.id;
      socket.emit("join_room", { username: username.trim(), room });
      setScreen("chat");
      setTimeout(() => inputRef.current?.focus(), 100);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("message_history", (history) => setMessages(history));
    socket.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("system_message", (msg) => {
      setSystemMessages((prev) => [...prev, msg]);
      setMessages((prev) => [...prev, { ...msg, type: "system" }]);
    });
    socket.on("room_users", (u) => setUsers(u));
    socket.on("user_typing", ({ username: name, userId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[userId] = name; else delete next[userId];
        return next;
      });
    });
  }, [username, room]);

  const switchRoom = (newRoom) => {
    if (newRoom === room) return;
    setRoom(newRoom); setMessages([]); setTypingUsers({}); setSidebarOpen(false);
    socket.emit("join_room", { username, room: newRoom });
  };

  const sendMessage = () => {
    if (!input.trim() || !connected) return;
    socket.emit("send_message", { text: input, room });
    setInput("");
    socket.emit("typing", { room, isTyping: false });
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit("typing", { room, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("typing", { room, isTyping: false }), 1500);
  };

  const typingList = Object.values(typingUsers);

  if (screen === "join") {
    return (
      <div className="join-screen">
        <div className="join-card">
          <div className="join-logo">
            <div className="logo-icon">⬡</div>
            <h1>Hexa<span>Chat</span></h1>
          </div>
          <p className="join-sub">Real-time rooms. No noise.</p>
          <div className="join-form">
            <label>Your name</label>
            <input className="join-input" placeholder="e.g. Alex Rivera" value={username}
              onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && connect()} autoFocus />
            <label>Pick a room</label>
            <div className="room-grid">
              {ROOMS.map((r) => (
                <button key={r} className={`room-chip ${room === r ? "active" : ""}`} onClick={() => setRoom(r)}># {r}</button>
              ))}
            </div>
            <button className="join-btn" onClick={connect} disabled={!username.trim()}>Join Room →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span className="logo-sm">⬡ Hexa</span>
          <span className={`status-dot ${connected ? "online" : "offline"}`} />
        </div>
        <div className="sidebar-section">
          <p className="sidebar-label">Rooms</p>
          {ROOMS.map((r) => (
            <button key={r} className={`room-btn ${room === r ? "active" : ""}`} onClick={() => switchRoom(r)}>
              <span># {r}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-section">
          <p className="sidebar-label">Online — {users.length}</p>
          <div className="user-list">
            {users.map((u) => (
              <div key={u.id} className="user-item">
                <div className="avatar-sm" style={{ background: u.color }}>{getInitials(u.username)}</div>
                <span className={u.id === myId.current ? "me" : ""}>{u.username}{u.id === myId.current ? " (you)" : ""}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="avatar-sm" style={{ background: "#4ECDC4" }}>{getInitials(username)}</div>
          <span className="my-name">{username}</span>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="header-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="room-title"># {room}</span>
            <span className="header-count">{users.length} online</span>
          </div>
          <div className="header-right">
            {unread > 0 && !focused && <span className="unread-badge">{unread} new</span>}
            {!connected && <span className="offline-pill">Reconnecting…</span>}
          </div>
        </header>

        <div className="messages">
          {messages.map((msg, i) => {
            if (msg.type === "system") {
              return (
                <div key={`sys-${i}`} className="system-msg">
                  <span>{msg.text}</span>
                  <span className="msg-time">{formatTime(msg.timestamp)}</span>
                </div>
              );
            }
            const isMe = msg.userId === myId.current;
            const prevMsg = messages[i - 1];
            const grouped = prevMsg && prevMsg.type !== "system" && prevMsg.userId === msg.userId && msg.timestamp - prevMsg.timestamp < 60000;
            return (
              <div key={msg.id} className={`msg ${isMe ? "mine" : "theirs"} ${grouped ? "grouped" : ""}`}>
                {!grouped && <div className="avatar-sm" style={{ background: msg.color }}>{getInitials(msg.username)}</div>}
                {grouped && <div className="avatar-placeholder" />}
                <div className="msg-body">
                  {!grouped && (
                    <div className="msg-meta">
                      <span className="msg-name" style={{ color: msg.color }}>{isMe ? "You" : msg.username}</span>
                      <span className="msg-time">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className="bubble">{msg.text}</div>
                </div>
              </div>
            );
          })}
          {typingList.length > 0 && (
            <div className="typing-indicator">
              <span className="dots"><span /><span /><span /></span>
              <span>{typingList.join(", ")} {typingList.length === 1 ? "is" : "are"} typing…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-bar">
          <input ref={inputRef} className="msg-input" placeholder={`Message #${room}`}
            value={input} onChange={handleInputChange} onKeyDown={handleKey} disabled={!connected} />
          <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || !connected}>↑</button>
        </div>
      </main>
    </div>
  );
}