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
    // { [userId]: Message[] }
    conversations: {},
    loadingFor: null,
  },
  reducers: {
    appendMessage(state, { payload }) {
      // payload: { senderId, recipientId, ...msg }
      const key =
        payload.senderId === payload.myId
          ? payload.recipientId
          : payload.senderId;
      if (!state.conversations[key]) state.conversations[key] = [];
      // avoid duplicate if message_delivered fires alongside private_message
      const exists = state.conversations[key].some(
        (m) => m.id === payload.id || (payload.tempId && m.tempId === payload.tempId)
      );
      if (!exists) state.conversations[key].push(payload);
    },
    replaceTempMessage(state, { payload }) {
      // swap optimistic message with confirmed one
      const { recipientId, tempId, ...confirmed } = payload;
      const key = recipientId;
      if (!state.conversations[key]) return;
      const idx = state.conversations[key].findIndex((m) => m.tempId === tempId);
      if (idx !== -1) state.conversations[key][idx] = { ...confirmed, recipientId };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, { meta }) => {
        state.loadingFor = meta.arg;
      })
      .addCase(fetchMessages.fulfilled, (state, { payload }) => {
        state.loadingFor = null;
        state.conversations[payload.userId] = payload.messages.map((m) => ({
          id: m._id,
          text: m.text,
          senderId: m.sender,
          recipientId: m.receiver,
          createdAt: m.createdAt,
        }));
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.loadingFor = null;
      });
  },
});

export const { appendMessage, replaceTempMessage } = chatSlice.actions;
export default chatSlice.reducer;