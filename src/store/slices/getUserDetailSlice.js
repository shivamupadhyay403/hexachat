import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { GET_USER_DETAIL } from "../api";
import api from "@/assets/api";

export const getUserData = createAsyncThunk(
  "/getUserData",
  async (_ ,{ rejectWithValue }) => {
    try {
      const response = await api.get(GET_USER_DETAIL);
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

const getUserDetailSlice = createSlice({
  name: "getUserDetail",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUserData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data;
      })
      .addCase(getUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to load the Users.";
      });
  },
});

export default getUserDetailSlice.reducer;
