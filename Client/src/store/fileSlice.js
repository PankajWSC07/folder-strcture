import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = "http://localhost:5000/api/files";

// Get token
const getToken = () => Cookies.get("token");

// Upload file
export const uploadFile = createAsyncThunk(
  "file/uploadFile",
  async ({ file, parentId }, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const formData = new FormData();
      formData.append("file", file);
      if (parentId) {
        formData.append("parentId", parentId);
      }

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.file;
    } catch (error) {
      console.error("File upload error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload file",
      );
    }
  },
);

// Fetch files by parent ID
export const fetchFilesByParent = createAsyncThunk(
  "file/fetchFilesByParent",
  async (parentId, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/${parentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { parentId, files: response.data.data || [] };
    } catch (error) {
      console.error("Fetch files error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch files",
      );
    }
  },
);

// Download file
export const downloadFile = createAsyncThunk(
  "file/downloadFile",
  async ({ fileId, fileName }, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await axios.get(`${API_URL}/download/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "download");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { fileId, fileName };
    } catch (error) {
      console.error("Download file error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to download file",
      );
    }
  },
);

// Delete file
export const deleteFile = createAsyncThunk(
  "file/deleteFile",
  async (fileId, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      await axios.delete(`${API_URL}/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return fileId;
    } catch (error) {
      console.error("Delete file error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete file",
      );
    }
  },
);

// Get all files
export const fetchAllFiles = createAsyncThunk(
  "file/fetchAllFiles",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error("Fetch all files error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch files",
      );
    }
  },
);

const initialState = {
  files: [],
  filesMap: {},
  loading: false,
  error: null,
  success: false,
  uploadProgress: 0,
  downloadLoading: false,
};

const fileSlice = createSlice({
  name: "file",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    // Upload file
    builder
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.uploadProgress = 100;

        const uploadedFile = action.payload;
        const parentId = uploadedFile.parentId || null;

        // Ensure filesMap[parentId] exists
        if (!state.filesMap[parentId]) {
          state.filesMap[parentId] = [];
        }

        // Add the uploaded file to the correct parent
        state.filesMap[parentId].push(uploadedFile);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
      });

    // Fetch files by parent
    builder
      .addCase(fetchFilesByParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilesByParent.fulfilled, (state, action) => {
        state.loading = false;
        state.filesMap[action.payload.parentId] = action.payload.files;
      })
      .addCase(fetchFilesByParent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete file
    builder
      .addCase(deleteFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.files = state.files.filter((file) => file.id !== action.payload);
        Object.keys(state.filesMap).forEach((parentId) => {
          state.filesMap[parentId] = state.filesMap[parentId].filter(
            (file) => file.id !== action.payload,
          );
        });
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch all files
    builder
      .addCase(fetchAllFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.files = [];
      });

    // Download file
    builder
      .addCase(downloadFile.pending, (state) => {
        state.downloadLoading = true;
        state.error = null;
      })
      .addCase(downloadFile.fulfilled, (state) => {
        state.downloadLoading = false;
        state.success = true;
      })
      .addCase(downloadFile.rejected, (state, action) => {
        state.downloadLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, resetUploadProgress } =
  fileSlice.actions;
export default fileSlice.reducer;
