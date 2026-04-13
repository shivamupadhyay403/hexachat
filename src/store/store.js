import { configureStore } from "@reduxjs/toolkit";
import getAllUsersSlice from "./slices/getAllUsersSlice";
import chatSlice from "./slices/chatSlice";
import onlineUsersSlice from "./slices/onlineUsersSlice";
import getUserDetailSlice from "./slices/getUserDetailSlice";
import followSlice from "./slices/followSlice"
const store = configureStore({
  reducer: {
    getAllUsers: getAllUsersSlice,
    chat: chatSlice,
    onlineUsers: onlineUsersSlice,
    getUserDetail: getUserDetailSlice,
    follow:followSlice
  },
});

export default store;
