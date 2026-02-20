import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = "http://localhost:5000/api/folders";

const getToken = () => Cookies.get("token");

export const fetchFolderStructure = createAsyncThunk(
  "folder/fetchFolderStructure",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error("Fetch folder structure error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch folder structure",
      );
    }
  },
);

// Create folder or file
export const createItem = createAsyncThunk(
  "folder/createItem",
  async ({ name, type, parentId }, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await axios.post(
        `${API_URL}/create`,
        { name, type, parentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Create item response:", response.data);
      return response.data.item;
    } catch (error) {
      console.error("Create item error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create item",
      );
    }
  },
);

// Delete item
export const deleteItem = createAsyncThunk(
  "folder/deleteItem",
  async (itemId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${itemId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return itemId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete item",
      );
    }
  },
);

// Rename item
export const renameItem = createAsyncThunk(
  "folder/renameItem",
  async ({ itemId, name }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/${itemId}/rename`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      return response.data.item;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to rename item",
      );
    }
  },
);

export const fetchFolderChildren = createAsyncThunk(
  "folder/fetchFolderChildren",
  async (parentId, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/items/${parentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { parentId, children: response.data.data || [] };
    } catch (error) {
      console.error("Fetch folder children error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch folder children",
      );
    }
  },
);

const initialState = {
  folders: [],
  childrenMap: {},
  filesMap: {},
  loading: false,
  error: null,
  success: false,
};

const folderSlice = createSlice({
  name: "folder",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolderStructure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolderStructure.fulfilled, (state, action) => {
        state.loading = false;
        const items = Array.isArray(action.payload) ? action.payload : [];
        const folders = items.filter((item) => item.type === "folder");
        const files = items.filter((item) => item.type === "file");

        state.folders = folders;
        state.filesMap[null] = files;
      })
      .addCase(fetchFolderStructure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.folders = [];
      });

    // Create item
    builder
      .addCase(createItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete item
    builder
      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const itemId = action.payload;

        state.folders = state.folders.filter((folder) => folder.id !== itemId);

        Object.keys(state.childrenMap).forEach((parentId) => {
          state.childrenMap[parentId] = state.childrenMap[parentId].filter(
            (item) => item.id !== itemId,
          );
        });

        delete state.childrenMap[itemId];

        delete state.filesMap[itemId];
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Rename item
    builder
      .addCase(renameItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(renameItem.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(renameItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch folder children
    builder
      .addCase(fetchFolderChildren.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchFolderChildren.fulfilled, (state, action) => {
        const { parentId, children } = action.payload;
        const folders = children.filter((item) => item.type === "folder");
        const files = children.filter((item) => item.type === "file");

        state.childrenMap[parentId] = folders;
        state.filesMap[parentId] = files;
      })
      .addCase(fetchFolderChildren.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess } = folderSlice.actions;
export default folderSlice.reducer;
