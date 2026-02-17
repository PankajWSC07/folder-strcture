import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = "http://localhost:5000/api/permissions";

const getToken = () => Cookies.get("token");

export const fetchPermissions = createAsyncThunk(
  "permissions/fetchPermissions",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.permissions;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const givePermission = createAsyncThunk(
  "permissions/givePermission",
  async ({ fileId, targetUserId }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/give`,
        { fileId, targetUserId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const fetchAvailableUsers = createAsyncThunk(
  "permissions/fetchAvailableUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/users/available/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.users;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchItemPermissions = createAsyncThunk(
  "permissions/fetchItemPermissions",
  async ({ itemId }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.permissions;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const updateItemPermission = createAsyncThunk(
  "permissions/updateItemPermission",
  async ({ itemId, userId, can_view, can_create, can_upload, can_edit, can_delete }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/item/${itemId}`,
        { userId, can_view, can_create, can_upload, can_edit, can_delete },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return { userId, can_view, can_create, can_upload, can_edit, can_delete };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const removeItemPermission = createAsyncThunk(
  "permissions/removeItemPermission",
  async ({ itemId, userId }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/item/${itemId}/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const permissionSlice = createSlice({
  name: "permissions",
  initialState: {
    permissions: [],
    availableUsers: [],
    itemPermissions: [],
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Failed to fetch permissions";
      })
      .addCase(givePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(givePermission.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload || "Permission granted successfully";
      })
      .addCase(givePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Failed to give permission";
      })
      .addCase(fetchAvailableUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.availableUsers = action.payload;
      })
      .addCase(fetchAvailableUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Failed to fetch users";
      })
      .addCase(fetchItemPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.itemPermissions = action.payload;
      })
      .addCase(fetchItemPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Failed to fetch item permissions";
      })
      .addCase(updateItemPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItemPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Permission updated successfully";
        const existingIndex = state.itemPermissions.findIndex(
          (p) => p.userId === action.payload.userId
        );
        if (existingIndex >= 0) {
          state.itemPermissions[existingIndex] = {
            ...state.itemPermissions[existingIndex],
            ...action.payload,
          };
        } else {
          state.itemPermissions.push(action.payload);
        }
      })
      .addCase(updateItemPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Failed to update permission";
      })
      .addCase(removeItemPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeItemPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Permission removed successfully";
        state.itemPermissions = state.itemPermissions.filter(
          (p) => p.userId !== action.payload
        );
      })
      .addCase(removeItemPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Failed to remove permission";
      });
  },
});

export default permissionSlice.reducer;
export const { clearError, clearSuccess } = permissionSlice.actions;