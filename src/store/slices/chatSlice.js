import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/assets/api";

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/messages/${userId}`);
      return { userId, messages: data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: {},   // { [userId]: Message[] }
    contacts:      [],   // [{ id, name, username, lastMsg, lastTime }]
    loadingFor:    null,
    typingUsers:   {},   // { [userId]: true }
    unread:        {},   // { [userId]: count }
  },
  reducers: {

    // ── Append an incoming or optimistic message ───────────────────────────
    appendMessage(state, { payload }) {
      const myId        = String(payload.myId);
      const senderId    = String(payload.senderId);
      const recipientId = String(payload.recipientId);
      const key         = senderId === myId ? recipientId : senderId;

      if (!state.conversations[key]) state.conversations[key] = [];

      const exists = state.conversations[key].some(
        (m) =>
          (payload.id     && m.id     === payload.id) ||
          (payload.tempId && m.tempId === payload.tempId)
      );
      if (exists) return;

      state.conversations[key].push({
        ...payload,
        senderId,
        recipientId,
        myId,
        status: payload.status ?? (payload.pending ? "pending" : "sent"),
      });
    },

    // ── Replace a temp (optimistic) message once server confirms ──────────
    replaceTempMessage(state, { payload }) {
      const recipientId = String(payload.recipientId);
      if (!state.conversations[recipientId]) return;
      const idx = state.conversations[recipientId].findIndex(
        (m) => m.tempId === payload.tempId
      );
      if (idx !== -1) {
        state.conversations[recipientId][idx] = {
          ...payload,
          senderId:    String(payload.senderId),
          recipientId: String(payload.recipientId),
          pending:     false,
          status:      payload.status ?? "sent",
        };
      }
    },

    // ── Server confirmed our message: swap tempId → real id ───────────────
    confirmMessage(state, { payload: { tempId, id, createdAt, status } }) {
      for (const contactId in state.conversations) {
        const msgs = state.conversations[contactId];
        const idx  = msgs.findIndex((m) => m.tempId === tempId);
        if (idx !== -1) {
          msgs[idx] = {
            ...msgs[idx],
            id,
            createdAt,
            status:  status ?? "sent",
            pending: false,
          };
          break;
        }
      }
    },

    // ── Other user saw our messages → turn ticks blue ─────────────────────
    markSeen(state, { payload: { by, messageIds } }) {
      const ids  = new Set(messageIds);
      const conv = state.conversations[String(by)];
      if (!conv) return;
      conv.forEach((m) => {
        if (ids.has(m.id)) m.status = "seen";
      });
    },

    // ── Delete a message locally only (for this user) ─────────────────────
    deleteForMe(state, { payload: { messageId, contactId } }) {
      const conv = state.conversations[String(contactId)];
      if (!conv) return;
      const idx = conv.findIndex((m) => (m.id ?? m.tempId) === messageId);
      if (idx !== -1) conv[idx] = { ...conv[idx], deletedForMe: true };
    },

    // ── Delete for everyone (both sides see "message deleted") ────────────
    deleteForEveryone(state, { payload: { messageId } }) {
      for (const contactId in state.conversations) {
        const conv = state.conversations[contactId];
        const idx  = conv.findIndex((m) => (m.id ?? m.tempId) === messageId);
        if (idx !== -1) {
          conv[idx] = {
            ...conv[idx],
            deletedForEveryone: true,
            text:  "",
            media: null,
          };
          break;
        }
      }
    },

    // ── Typing indicator ──────────────────────────────────────────────────
    setTyping(state, { payload }) {
      const { userId, isTyping } = payload;
      if (isTyping) state.typingUsers[userId] = true;
      else delete state.typingUsers[userId];
    },

    // ── Add / update a contact in the sidebar list ────────────────────────
    upsertContact(state, { payload }) {
      const idx = state.contacts.findIndex((c) => c.id === payload.id);
      if (idx !== -1) {
        const updated = { ...state.contacts[idx], ...payload };
        state.contacts.splice(idx, 1);
        state.contacts.unshift(updated);
      } else {
        state.contacts.unshift(payload);
      }
      if (payload.bumpUnread) {
        state.unread[payload.id] = (state.unread[payload.id] ?? 0) + 1;
      }
    },

    // ── Clear unread badge when conversation is opened ────────────────────
    clearUnread(state, { payload: userId }) {
      delete state.unread[userId];
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, { meta }) => {
        state.loadingFor = String(meta.arg);
      })
      .addCase(fetchMessages.fulfilled, (state, { payload }) => {
        state.loadingFor = null;
        state.conversations[payload.userId] = payload.messages.map((m) => ({
          id:                 String(m._id),
          text:               m.text        ?? "",
          media:              m.media       ?? null,   // { url, name, type }
          replyTo:            m.replyTo     ?? null,   // { id, text, media, senderName }
          senderId:           String(m.sender),
          recipientId:        String(m.receiver),
          createdAt:          m.createdAt,
          status:             m.status      ?? "sent", // "sent" | "seen"
          deletedForMe:       m.deletedForMe       ?? false,
          deletedForEveryone: m.deletedForEveryone ?? false,
          pending:            false,
        }));
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.loadingFor = null;
      });
  },
});

export const {
  appendMessage,
  replaceTempMessage,
  confirmMessage,
  markSeen,
  deleteForMe,
  deleteForEveryone,
  setTyping,
  upsertContact,
  clearUnread,
} = chatSlice.actions;

export default chatSlice.reducer;