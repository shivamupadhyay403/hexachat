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
    conversations: {},  // { [userId]: Message[] }
    loadingFor:    null,
    typingUsers:   {},  // { [userId]: true }
  },
  reducers: {
    appendMessage(state, { payload }) {
      const myId        = String(payload.myId);
      const senderId    = String(payload.senderId);
      const recipientId = String(payload.recipientId);
      const key         = senderId === myId ? recipientId : senderId;

      if (!state.conversations[key]) state.conversations[key] = [];

      const exists = state.conversations[key].some(
        (m) =>
          (payload.id && m.id === payload.id) ||
          (payload.tempId && m.tempId === payload.tempId)
      );
      if (exists) return;

      state.conversations[key].push({ ...payload, senderId, recipientId, myId });
    },

    replaceTempMessage(state, { payload }) {
      const recipientId = String(payload.recipientId);
      const key = recipientId;
      if (!state.conversations[key]) return;
      const idx = state.conversations[key].findIndex(
        (m) => m.tempId === payload.tempId
      );
      if (idx !== -1) {
        state.conversations[key][idx] = {
          ...payload,
          senderId:    String(payload.senderId),
          recipientId: String(payload.recipientId),
          pending:     false,
        };
      }
    },

    setTyping(state, { payload }) {
      const { userId, isTyping } = payload;
      if (isTyping) {
        state.typingUsers[userId] = true;
      } else {
        delete state.typingUsers[userId];
      }
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
          id:          String(m._id),
          text:        m.text,
          senderId:    String(m.sender),
          recipientId: String(m.receiver),
          createdAt:   m.createdAt,
          pending:     false,
        }));
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.loadingFor = null;
      });
  },
});

export const { appendMessage, replaceTempMessage, setTyping } = chatSlice.actions;
export default chatSlice.reducer;