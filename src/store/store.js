import { configureStore } from "@reduxjs/toolkit";
import getAllUsersSlice from "./slices/getAllUsersSlice";
const store = configureStore({
  reducer: {
    getAllUsers: getAllUsersSlice,
  },
});

export default store;
