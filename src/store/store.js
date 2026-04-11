import { configureStore } from "@reduxjs/toolkit";
import getAllUsersSlice from "./slices/getAllUsersSlice";
import chatSlice from "./slices/chatSlice";
import onlineUsersSlice from "./slices/onlineUsersSlice";
const store = configureStore({
  reducer: {
    getAllUsers: getAllUsersSlice,
    chat: chatSlice,
    onlineUsers: onlineUsersSlice,
  },
});

export default store;
