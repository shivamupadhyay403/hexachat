import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

/* ─── Helpers ─────────────────────────────────────────── */
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
function getTimeLeft(expiresAt) {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return null;
  return Math.ceil(remaining / 1000);
}

const COLORS = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE","#85C1E9","#F1948A","#82E0AA","#F0B27A"];
function randomColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

/* ─── Fake auth/storage helpers (localStorage-based) ──── */
function getUsers() {
  return JSON.parse(localStorage.getItem("hc_users") || "[]");
}
function saveUsers(users) {
  localStorage.setItem("hc_users", JSON.stringify(users));
}
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("hc_me") || "null");
}
function setCurrentUser(u) {
  localStorage.setItem("hc_me", JSON.stringify(u));
}
function clearCurrentUser() {
  localStorage.removeItem("hc_me");
}

/* ═══════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("login"); // login | register | reset | chat
  const [me, setMe] = useState(getCurrentUser);
  const [authError, setAuthError] = useState("");

  /* friends & conversations (in memory + localStorage) */
  const [friends, setFriends] = useState(() => {
    if (!getCurrentUser()) return [];
    return JSON.parse(localStorage.getItem(`hc_friends_${getCurrentUser()?.id}`) || "[]");
  });
  const [friendRequests, setFriendRequests] = useState([]);
  const [conversations, setConversations] = useState({}); // { friendId: [msg] }
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unread, setUnread] = useState({});
  const [sidebarTab, setSidebarTab] = useState("chats"); // chats | friends | requests
  const [friendSearch, setFriendSearch] = useState("");
  const [addFriendQuery, setAddFriendQuery] = useState("");
  const [addFriendResult, setAddFriendResult] = useState(null);
  const [addFriendMsg, setAddFriendMsg] = useState("");
  const [input, setInput] = useState("");
  const [disappearTimer, setDisappearTimer] = useState(0); // 0 = off, seconds
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [focused, setFocused] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(me?.photo || null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  /* ── window focus ── */
  useEffect(() => {
    const f = () => setFocused(true);
    const b = () => setFocused(false);
    window.addEventListener("focus", f);
    window.addEventListener("blur", b);
    return () => { window.removeEventListener("focus", f); window.removeEventListener("blur", b); };
  }, []);

  /* ── persist friends ── */
  useEffect(() => {
    if (me) localStorage.setItem(`hc_friends_${me.id}`, JSON.stringify(friends));
  }, [friends, me]);

  /* ── scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeChat]);

  /* ── disappearing messages ticker ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setConversations((prev) => {
        let changed = false;
        const next = {};
        for (const [fid, msgs] of Object.entries(prev)) {
          const filtered = msgs.filter((m) => {
            if (!m.expiresAt) return true;
            if (Date.now() >= m.expiresAt) { changed = true; return false; }
            return true;
          });
          next[fid] = filtered;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ── socket ── */
  useEffect(() => {
    if (!me) return;
    const socket = io(SOCKET_URL, { reconnectionAttempts: 5, reconnectionDelay: 2000, timeout: 10000 });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register_user", { userId: me.id, username: me.username });
    });

    socket.on("online_users", (list) => setOnlineUsers(list));

    socket.on("private_message", (msg) => {
      const fid = msg.senderId;
      setConversations((prev) => {
        const msgs = [...(prev[fid] || []), msg];
        return { ...prev, [fid]: msgs };
      });
      if (!focused || activeChat !== fid) {
        setUnread((prev) => ({ ...prev, [fid]: (prev[fid] || 0) + 1 }));
        pushNotification(`${msg.senderName}: ${msg.text.slice(0, 60)}`);
      }
    });

    socket.on("message_delivered", ({ tempId, msgId, recipientId }) => {
      setConversations((prev) => {
        const msgs = (prev[recipientId] || []).map((m) =>
          m.id === tempId ? { ...m, id: msgId, status: "delivered" } : m
        );
        return { ...prev, [recipientId]: msgs };
      });
    });

    socket.on("friend_request", ({ from }) => {
      setFriendRequests((prev) => [...prev, from]);
      pushNotification(`${from.username} sent you a friend request`);
    });

    socket.on("friend_accepted", ({ user }) => {
      setFriends((prev) => [...prev, user]);
      pushNotification(`${user.username} accepted your friend request`);
    });

    socket.on("user_typing", ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const n = { ...prev };
        if (isTyping) n[userId] = true; else delete n[userId];
        return n;
      });
    });

    return () => { socket.off(); socket.disconnect(); socketRef.current = null; };
  }, [me]);

  /* ── notifications ── */
  function pushNotification(text) {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4000);
  }

  /* ════════════════ AUTH ═══════════════════════════════ */
  function handleRegister({ username, email, password }) {
    setAuthError("");
    const users = getUsers();
    if (users.find((u) => u.email === email)) return setAuthError("Email already registered.");
    const user = { id: Date.now().toString(), username, email, password, color: randomColor(), photo: null };
    saveUsers([...users, user]);
    const { password: _, ...safe } = user;
    setCurrentUser(safe);
    setMe(safe);
    setFriends([]);
    setScreen("chat");
  }

  function handleLogin({ email, password }) {
    setAuthError("");
    const users = getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return setAuthError("Invalid email or password.");
    const { password: _, ...safe } = user;
    setCurrentUser(safe);
    setMe(safe);
    setFriends(JSON.parse(localStorage.getItem(`hc_friends_${safe.id}`) || "[]"));
    setScreen("chat");
  }

  function handleReset({ email, newPassword }) {
    setAuthError("");
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) return setAuthError("No account found with that email.");
    users[idx].password = newPassword;
    saveUsers(users);
    setAuthError("✓ Password reset! Please login.");
    setTimeout(() => setScreen("login"), 1500);
  }

  function handleLogout() {
    clearCurrentUser();
    setMe(null);
    setFriends([]);
    setConversations({});
    setActiveChat(null);
    if (socketRef.current) { socketRef.current.off(); socketRef.current.disconnect(); socketRef.current = null; }
    setScreen("login");
  }

  /* ════════════════ PROFILE PHOTO ═════════════════════ */
  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const photo = ev.target.result;
      setProfilePhoto(photo);
      const users = getUsers();
      const idx = users.findIndex((u) => u.id === me.id);
      if (idx !== -1) { users[idx].photo = photo; saveUsers(users); }
      const updated = { ...me, photo };
      setCurrentUser(updated);
      setMe(updated);
    };
    reader.readAsDataURL(file);
  }

  /* ════════════════ FRIENDS ═══════════════════════════ */
  function searchUser() {
    const users = getUsers();
    const found = users.find((u) => u.username.toLowerCase() === addFriendQuery.toLowerCase().trim() && u.id !== me.id);
    if (!found) { setAddFriendResult(null); setAddFriendMsg("User not found."); return; }
    if (friends.find((f) => f.id === found.id)) { setAddFriendResult(null); setAddFriendMsg("Already friends."); return; }
    setAddFriendResult(found);
    setAddFriendMsg("");
  }

  function sendFriendRequest(target) {
    // Simulate instant accept for demo (since both users are on same browser)
    setFriends((prev) => [...prev, { id: target.id, username: target.username, color: target.color, photo: target.photo }]);
    // Also add reverse friendship
    const targetFriends = JSON.parse(localStorage.getItem(`hc_friends_${target.id}`) || "[]");
    if (!targetFriends.find((f) => f.id === me.id)) {
      localStorage.setItem(`hc_friends_${target.id}`, JSON.stringify([...targetFriends, { id: me.id, username: me.username, color: me.color, photo: me.photo }]));
    }
    setAddFriendMsg(`✓ ${target.username} added as friend!`);
    setAddFriendResult(null);
    setAddFriendQuery("");
    socketRef.current?.emit("send_friend_request", { to: target.id, from: { id: me.id, username: me.username, color: me.color } });
  }

  function removeFriend(friendId) {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    if (activeChat === friendId) setActiveChat(null);
  }

  /* ════════════════ MESSAGES ══════════════════════════ */
  function sendMessage() {
    if (!input.trim() || !activeChat) return;
    const friend = friends.find((f) => f.id === activeChat);
    if (!friend) return;
    const tempId = `temp-${Date.now()}`;
    const expiresAt = disappearTimer > 0 ? Date.now() + disappearTimer * 1000 : null;
    const msg = {
      id: tempId,
      text: input.trim(),
      senderId: me.id,
      senderName: me.username,
      recipientId: activeChat,
      timestamp: Date.now(),
      status: "sent",
      expiresAt,
      disappearTimer,
    };
    setConversations((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), msg],
    }));
    socketRef.current?.emit("private_message", { ...msg, tempId });
    setInput("");
    socketRef.current?.emit("typing", { to: activeChat, isTyping: false });
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    socketRef.current?.emit("typing", { to: activeChat, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("typing", { to: activeChat, isTyping: false });
    }, 1500);
  }

  function openChat(friendId) {
    setActiveChat(friendId);
    setUnread((prev) => ({ ...prev, [friendId]: 0 }));
    setSidebarTab("chats");
    setInput("");
  }

  /* ─── get sorted conversation list ─── */
  const chatList = friends.map((f) => {
    const msgs = conversations[f.id] || [];
    const last = msgs[msgs.length - 1];
    return { ...f, lastMsg: last, unreadCount: unread[f.id] || 0 };
  }).sort((a, b) => (b.lastMsg?.timestamp || 0) - (a.lastMsg?.timestamp || 0));

  const activeMsgs = activeChat ? (conversations[activeChat] || []) : [];
  const activeFriend = friends.find((f) => f.id === activeChat);

  /* ══════════════════════════════════════════════════════
     AUTH SCREENS
  ══════════════════════════════════════════════════════ */
  if (screen !== "chat") {
    return <AuthScreen screen={screen} setScreen={setScreen} onLogin={handleLogin} onRegister={handleRegister} onReset={handleReset} error={authError} />;
  }

  /* ══════════════════════════════════════════════════════
     CHAT SCREEN
  ══════════════════════════════════════════════════════ */
  return (
    <div style={styles.root}>
      {/* Notifications */}
      <div style={styles.notifStack}>
        {notifications.map((n) => (
          <div key={n.id} style={styles.notif}>{n.text}</div>
        ))}
      </div>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Profile */}
        <div style={styles.profileBar}>
          <div style={styles.avatarWrap} onClick={() => fileInputRef.current?.click()}>
            {me.photo || profilePhoto ? (
              <img src={me.photo || profilePhoto} alt="me" style={styles.avatarImg} />
            ) : (
              <div style={{ ...styles.avatar, background: me.color }}>{getInitials(me.username)}</div>
            )}
            <div style={styles.avatarOverlay}>📷</div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.profileName}>{me.username}</div>
            <div style={styles.profileEmail}>{me.email}</div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">⏻</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["chats", "friends", "add"].map((t) => (
            <button key={t} style={{ ...styles.tab, ...(sidebarTab === t ? styles.tabActive : {}) }} onClick={() => setSidebarTab(t)}>
              {t === "chats" ? "💬" : t === "friends" ? "👥" : "➕"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={styles.sidebarContent}>
          {sidebarTab === "chats" && (
            <>
              <div style={styles.sidebarSearch}>
                <input placeholder="Search chats…" style={styles.searchInput} value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)} />
              </div>
              {chatList.filter((f) => f.username.toLowerCase().includes(friendSearch.toLowerCase())).map((f) => (
                <div key={f.id} style={{ ...styles.chatItem, ...(activeChat === f.id ? styles.chatItemActive : {}) }}
                  onClick={() => openChat(f.id)}>
                  <div style={styles.chatAvatarWrap}>
                    {f.photo ? <img src={f.photo} alt="" style={styles.avatarImg} /> :
                      <div style={{ ...styles.avatar, ...styles.avatarSm, background: f.color }}>{getInitials(f.username)}</div>}
                    {onlineUsers[f.id] && <div style={styles.onlineDot} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.chatItemName}>{f.username}</div>
                    {f.lastMsg && <div style={styles.chatItemPreview}>{f.lastMsg.text.slice(0, 30)}{f.lastMsg.text.length > 30 ? "…" : ""}</div>}
                  </div>
                  {f.unreadCount > 0 && <div style={styles.badge}>{f.unreadCount}</div>}
                </div>
              ))}
              {chatList.length === 0 && <div style={styles.emptyHint}>Add friends to start chatting</div>}
            </>
          )}

          {sidebarTab === "friends" && (
            <>
              <div style={styles.sectionLabel}>Friends ({friends.length})</div>
              {friends.map((f) => (
                <div key={f.id} style={styles.friendRow}>
                  <div style={styles.chatAvatarWrap}>
                    {f.photo ? <img src={f.photo} alt="" style={styles.avatarImg} /> :
                      <div style={{ ...styles.avatar, ...styles.avatarSm, background: f.color }}>{getInitials(f.username)}</div>}
                    {onlineUsers[f.id] && <div style={styles.onlineDot} />}
                  </div>
                  <span style={{ flex: 1, color: "#E8E3F0", fontSize: 14 }}>{f.username}</span>
                  <button style={styles.msgBtn} onClick={() => openChat(f.id)}>💬</button>
                  <button style={styles.removeBtn} onClick={() => removeFriend(f.id)}>✕</button>
                </div>
              ))}
              {friends.length === 0 && <div style={styles.emptyHint}>No friends yet</div>}
            </>
          )}

          {sidebarTab === "add" && (
            <div style={{ padding: "12px 16px" }}>
              <div style={styles.sectionLabel}>Add Friend</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input placeholder="Search by username…" style={{ ...styles.searchInput, flex: 1 }}
                  value={addFriendQuery} onChange={(e) => setAddFriendQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUser()} />
                <button style={styles.searchBtn} onClick={searchUser}>🔍</button>
              </div>
              {addFriendMsg && <div style={{ fontSize: 12, color: addFriendMsg.startsWith("✓") ? "#4ECDC4" : "#FF6B6B", marginBottom: 8 }}>{addFriendMsg}</div>}
              {addFriendResult && (
                <div style={styles.friendRow}>
                  <div style={{ ...styles.avatar, ...styles.avatarSm, background: addFriendResult.color }}>{getInitials(addFriendResult.username)}</div>
                  <span style={{ flex: 1, color: "#E8E3F0", fontSize: 14 }}>{addFriendResult.username}</span>
                  <button style={styles.msgBtn} onClick={() => sendFriendRequest(addFriendResult)}>Add</button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat */}
      <main style={styles.main}>
        {!activeChat ? (
          <div style={styles.emptyChat}>
            <div style={styles.emptyChatIcon}>💬</div>
            <div style={styles.emptyChatTitle}>Select a conversation</div>
            <div style={styles.emptyChatSub}>Choose a friend from the sidebar to start messaging</div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatAvatarWrap}>
                {activeFriend?.photo ? <img src={activeFriend.photo} alt="" style={styles.avatarImg} /> :
                  <div style={{ ...styles.avatar, ...styles.avatarSm, background: activeFriend?.color }}>{getInitials(activeFriend?.username || "")}</div>}
                {onlineUsers[activeChat] && <div style={styles.onlineDot} />}
              </div>
              <div>
                <div style={{ color: "#F0EBF8", fontWeight: 700, fontSize: 15 }}>{activeFriend?.username}</div>
                <div style={{ color: "#8B7FA8", fontSize: 12 }}>
                  {typingUsers[activeChat] ? "typing…" : onlineUsers[activeChat] ? "online" : "offline"}
                </div>
              </div>
              <div style={{ flex: 1 }} />
              {/* Disappearing messages */}
              <div style={{ position: "relative" }}>
                <button style={{ ...styles.headerBtn, color: disappearTimer > 0 ? "#FF6B6B" : "#8B7FA8" }}
                  onClick={() => setShowTimerMenu(!showTimerMenu)} title="Disappearing messages">
                  ⏱ {disappearTimer > 0 ? `${disappearTimer}s` : ""}
                </button>
                {showTimerMenu && (
                  <div style={styles.timerMenu}>
                    <div style={styles.timerTitle}>Disappearing Messages</div>
                    {[0, 10, 30, 60, 300].map((t) => (
                      <button key={t} style={{ ...styles.timerOption, ...(disappearTimer === t ? styles.timerOptionActive : {}) }}
                        onClick={() => { setDisappearTimer(t); setShowTimerMenu(false); }}>
                        {t === 0 ? "Off" : t < 60 ? `${t} seconds` : `${t / 60} minute${t / 60 > 1 ? "s" : ""}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messages} onClick={() => setShowTimerMenu(false)}>
              {activeMsgs.map((msg, i) => {
                const isMe = msg.senderId === me.id;
                const prev = activeMsgs[i - 1];
                const showDate = !prev || formatDate(msg.timestamp) !== formatDate(prev.timestamp);
                const timeLeft = msg.expiresAt ? getTimeLeft(msg.expiresAt) : null;
                const isExpiringSoon = timeLeft !== null && timeLeft <= 10;
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && <div style={styles.dateSep}><span>{formatDate(msg.timestamp)}</span></div>}
                    <div style={{ ...styles.msgRow, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      {!isMe && (
                        activeFriend?.photo
                          ? <img src={activeFriend.photo} alt="" style={{ ...styles.avatarImg, width: 32, height: 32, borderRadius: "50%", marginRight: 8, flexShrink: 0 }} />
                          : <div style={{ ...styles.avatar, width: 32, height: 32, fontSize: 11, marginRight: 8, flexShrink: 0, background: activeFriend?.color }}>{getInitials(activeFriend?.username || "")}</div>
                      )}
                      <div style={{ maxWidth: "62%" }}>
                        <div style={{
                          ...styles.bubble,
                          background: isMe ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "#2A2040",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          opacity: isExpiringSoon ? 0.5 : 1,
                          transition: "opacity 1s",
                        }}>
                          {msg.text}
                          {msg.expiresAt && (
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, color: isExpiringSoon ? "#FF6B6B" : "inherit" }}>
                              ⏱ {timeLeft !== null ? `${timeLeft}s` : ""}
                            </div>
                          )}
                        </div>
                        <div style={{ ...styles.msgMeta, textAlign: isMe ? "right" : "left" }}>
                          {formatTime(msg.timestamp)}
                          {isMe && <span style={{ marginLeft: 4, opacity: 0.6 }}>{msg.status === "delivered" ? "✓✓" : "✓"}</span>}
                        </div>
                      </div>
                      {isMe && (
                        me.photo
                          ? <img src={me.photo} alt="" style={{ ...styles.avatarImg, width: 32, height: 32, borderRadius: "50%", marginLeft: 8, flexShrink: 0 }} />
                          : <div style={{ ...styles.avatar, width: 32, height: 32, fontSize: 11, marginLeft: 8, flexShrink: 0, background: me.color }}>{getInitials(me.username)}</div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              {typingUsers[activeChat] && (
                <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
                  <div style={{ ...styles.bubble, background: "#2A2040" }}>
                    <span style={styles.typingDots}><span>·</span><span>·</span><span>·</span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={styles.inputBar}>
              {disappearTimer > 0 && (
                <div style={styles.disappearBadge}>⏱ {disappearTimer < 60 ? `${disappearTimer}s` : `${disappearTimer / 60}m`}</div>
              )}
              <input ref={null} style={styles.msgInput} placeholder={`Message ${activeFriend?.username}…`}
                value={input} onChange={handleInputChange} onKeyDown={handleKey} />
              <button style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
                onClick={sendMessage} disabled={!input.trim()}>↑</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════════════════ */
function AuthScreen({ screen, setScreen, onLogin, onRegister, onReset, error }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", newPassword: "", confirm: "" });
  const [localErr, setLocalErr] = useState("");

  function set(k) { return (e) => setForm((p) => ({ ...p, [k]: e.target.value })); }

  function handleSubmit(e) {
    e.preventDefault();
    setLocalErr("");
    if (screen === "register") {
      if (!form.username.trim()) return setLocalErr("Username required.");
      if (!form.email.includes("@")) return setLocalErr("Valid email required.");
      if (form.password.length < 6) return setLocalErr("Password must be 6+ chars.");
      onRegister({ username: form.username, email: form.email, password: form.password });
    } else if (screen === "login") {
      onLogin({ email: form.email, password: form.password });
    } else {
      if (!form.email.includes("@")) return setLocalErr("Valid email required.");
      if (form.newPassword.length < 6) return setLocalErr("New password must be 6+ chars.");
      if (form.newPassword !== form.confirm) return setLocalErr("Passwords don't match.");
      onReset({ email: form.email, newPassword: form.newPassword });
    }
  }

  const err = localErr || error;

  return (
    <div style={authStyles.bg}>
      <div style={authStyles.card}>
        <div style={authStyles.logo}>
          <span style={{ fontSize: 36 }}>⬡</span>
          <h1 style={authStyles.logoText}>Hexa<span style={{ color: "#A855F7" }}>Chat</span></h1>
        </div>
        <p style={authStyles.sub}>
          {screen === "login" ? "Welcome back" : screen === "register" ? "Create your account" : "Reset your password"}
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {screen === "register" && (
            <input style={authStyles.input} placeholder="Username" value={form.username} onChange={set("username")} autoFocus />
          )}
          <input style={authStyles.input} placeholder="Email" type="email" value={form.email} onChange={set("email")} autoFocus={screen === "login"} />
          {screen !== "reset" && (
            <input style={authStyles.input} placeholder="Password" type="password" value={form.password} onChange={set("password")} />
          )}
          {screen === "reset" && (
            <>
              <input style={authStyles.input} placeholder="New password" type="password" value={form.newPassword} onChange={set("newPassword")} />
              <input style={authStyles.input} placeholder="Confirm password" type="password" value={form.confirm} onChange={set("confirm")} />
            </>
          )}
          {err && <div style={{ color: err.startsWith("✓") ? "#4ECDC4" : "#FF6B6B", fontSize: 13 }}>{err}</div>}
          <button type="submit" style={authStyles.btn}>
            {screen === "login" ? "Sign in →" : screen === "register" ? "Create account →" : "Reset password →"}
          </button>
        </form>
        <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center" }}>
          {screen !== "login" && <button style={authStyles.link} onClick={() => setScreen("login")}>Sign in</button>}
          {screen !== "register" && <button style={authStyles.link} onClick={() => setScreen("register")}>Register</button>}
          {screen !== "reset" && <button style={authStyles.link} onClick={() => setScreen("reset")}>Forgot password?</button>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const styles = {
  root: { display: "flex", height: "100vh", background: "#0F0B1A", fontFamily: "'Sora', 'Segoe UI', sans-serif", overflow: "hidden", position: "relative" },
  sidebar: { width: 300, minWidth: 280, background: "#16112A", borderRight: "1px solid #2D1F4E", display: "flex", flexDirection: "column", height: "100vh" },
  profileBar: { display: "flex", alignItems: "center", gap: 10, padding: "16px 14px", borderBottom: "1px solid #2D1F4E" },
  avatarWrap: { position: "relative", cursor: "pointer", flexShrink: 0 },
  avatar: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0 },
  avatarSm: { width: 38, height: 38, fontSize: 12 },
  avatarImg: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover" },
  avatarOverlay: { position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, opacity: 0, transition: "opacity 0.2s" },
  profileName: { color: "#F0EBF8", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  profileEmail: { color: "#8B7FA8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logoutBtn: { background: "none", border: "none", color: "#8B7FA8", fontSize: 18, cursor: "pointer", padding: "4px 6px", borderRadius: 8 },
  tabs: { display: "flex", borderBottom: "1px solid #2D1F4E" },
  tab: { flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#8B7FA8" },
  tabActive: { color: "#A855F7", borderBottom: "2px solid #A855F7" },
  sidebarContent: { flex: 1, overflowY: "auto" },
  sidebarSearch: { padding: "10px 12px 6px" },
  searchInput: { width: "100%", background: "#0F0B1A", border: "1px solid #2D1F4E", borderRadius: 10, padding: "8px 12px", color: "#E8E3F0", fontSize: 13, outline: "none", boxSizing: "border-box" },
  searchBtn: { background: "#2D1F4E", border: "none", color: "#A855F7", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 14 },
  chatItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderRadius: 12, margin: "2px 8px", transition: "background 0.15s" },
  chatItemActive: { background: "#2D1F4E" },
  chatAvatarWrap: { position: "relative", flexShrink: 0 },
  onlineDot: { position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "#4ECDC4", border: "2px solid #16112A" },
  chatItemName: { color: "#E8E3F0", fontSize: 14, fontWeight: 600 },
  chatItemPreview: { color: "#8B7FA8", fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  badge: { background: "#A855F7", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sectionLabel: { color: "#8B7FA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "12px 16px 6px" },
  friendRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 14px" },
  msgBtn: { background: "#2D1F4E", border: "none", color: "#A855F7", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13 },
  removeBtn: { background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", fontSize: 14, padding: "4px 6px" },
  emptyHint: { color: "#8B7FA8", fontSize: 13, textAlign: "center", padding: "24px 16px" },
  /* main */
  main: { flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" },
  emptyChat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  emptyChatIcon: { fontSize: 64, marginBottom: 16, opacity: 0.3 },
  emptyChatTitle: { color: "#E8E3F0", fontSize: 20, fontWeight: 700, marginBottom: 8 },
  emptyChatSub: { color: "#8B7FA8", fontSize: 14 },
  chatHeader: { display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "#16112A", borderBottom: "1px solid #2D1F4E" },
  headerBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "6px 10px", borderRadius: 8, background: "#2D1F4E" },
  messages: { flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 4 },
  dateSep: { textAlign: "center", color: "#8B7FA8", fontSize: 11, margin: "12px 0", display: "flex", alignItems: "center", gap: 8 },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 0, marginBottom: 2 },
  bubble: { padding: "10px 14px", color: "#F0EBF8", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" },
  msgMeta: { color: "#8B7FA8", fontSize: 11, marginTop: 3, paddingLeft: 4, paddingRight: 4 },
  typingDots: { display: "flex", gap: 3 },
  inputBar: { padding: "12px 20px", background: "#16112A", borderTop: "1px solid #2D1F4E", display: "flex", alignItems: "center", gap: 10, position: "relative" },
  disappearBadge: { background: "#FF6B6B22", color: "#FF6B6B", fontSize: 11, padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap" },
  msgInput: { flex: 1, background: "#0F0B1A", border: "1px solid #2D1F4E", borderRadius: 20, padding: "10px 16px", color: "#E8E3F0", fontSize: 14, outline: "none" },
  sendBtn: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 },
  timerMenu: { position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#1E1535", border: "1px solid #2D1F4E", borderRadius: 12, padding: 8, zIndex: 100, minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
  timerTitle: { color: "#8B7FA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "4px 8px 8px" },
  timerOption: { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "#E8E3F0", padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  timerOptionActive: { background: "#2D1F4E", color: "#A855F7" },
  notifStack: { position: "fixed", top: 16, right: 16, zIndex: 999, display: "flex", flexDirection: "column", gap: 8 },
  notif: { background: "#1E1535", border: "1px solid #2D1F4E", color: "#E8E3F0", padding: "12px 16px", borderRadius: 12, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: 300, animation: "slideIn 0.3s ease" },
};

const authStyles = {
  bg: { minHeight: "100vh", background: "#0F0B1A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora','Segoe UI',sans-serif" },
  card: { background: "#16112A", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 400, border: "1px solid #2D1F4E", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logoText: { margin: 0, color: "#F0EBF8", fontSize: 28, fontWeight: 900, letterSpacing: -1 },
  sub: { color: "#8B7FA8", fontSize: 14, marginBottom: 24 },
  input: { width: "100%", background: "#0F0B1A", border: "1px solid #2D1F4E", borderRadius: 12, padding: "12px 16px", color: "#E8E3F0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  btn: { width: "100%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", border: "none", borderRadius: 12, padding: "13px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 },
  link: { background: "none", border: "none", color: "#A855F7", fontSize: 13, cursor: "pointer", padding: 0 },
};

