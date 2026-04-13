import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/assets/api";

export const fetchFollowers = createAsyncThunk("follow/fetchFollowers", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/followers");
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const fetchFollowing = createAsyncThunk("follow/fetchFollowing", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/following");
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const removeFollower = createAsyncThunk("follow/removeFollower", async (userId, { rejectWithValue }) => {
  try {
    await api.delete(`/followers/${userId}`);
    return userId;           // return id so reducer can pull it out
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const unfollowUser = createAsyncThunk("follow/unfollowUser", async (userId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/following/${userId}`);
    return userId;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

const followSlice = createSlice({
  name: "follow",
  initialState: {
    followers: [],
    following: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFollowers.fulfilled,  (s, a) => { s.followers = a.payload; })
      .addCase(fetchFollowing.fulfilled,  (s, a) => { s.following = a.payload; })
      // Optimistic removal — update local list immediately, count re-syncs on modal close
      .addCase(removeFollower.fulfilled,  (s, a) => { s.followers = s.followers.filter(u => u._id !== a.payload); })
      .addCase(unfollowUser.fulfilled,    (s, a) => { s.following = s.following.filter(u => u._id !== a.payload); });
  },
});

export default followSlice.reducer;