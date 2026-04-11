import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ALL_USERS } from "../api";
import api from "@/assets/api";

export const getUsers = createAsyncThunk(
  "/getUsers",
  async (_ ,{ rejectWithValue }) => {
    try {
      const response = await api.get(ALL_USERS);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Something went wrong while fetching the users.",
      );
    }
  },
);

const initialState = {
  data: [],
  isLoading: false,
  error: null,
};

const getAllUsersSlice = createSlice({
  name: "getAllUsers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load the Users.";
      });
  },
});

export default getAllUsersSlice.reducer;
