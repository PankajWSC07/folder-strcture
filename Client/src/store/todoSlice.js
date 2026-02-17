import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

const TODOS_API_URL = "http://localhost:5000/api/todos";

// Get all todos thunk
export const getAllTodos = createAsyncThunk(
  "todo/getAllTodos",
  async (_, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(TODOS_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch todos");
    }
  }
);

// Create todo thunk
export const createTodo = createAsyncThunk(
  "todo/createTodo",
  async (todoData, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      const response = await axios.post(TODOS_API_URL, todoData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.todo;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create todo");
    }
  }
);

// Update todo thunk
export const updateTodo = createAsyncThunk(
  "todo/updateTodo",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      const response = await axios.put(`${TODOS_API_URL}/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.todo;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update todo");
    }
  }
);

// Delete todo thunk
export const deleteTodo = createAsyncThunk(
  "todo/deleteTodo",
  async (id, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      await axios.delete(`${TODOS_API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete todo");
    }
  }
);

const initialState = {
  todos: [],
  isLoading: false,
  error: null,
};

const todoSlice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get All Todos
    builder
      .addCase(getAllTodos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllTodos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todos = action.payload.todos;
      })
      .addCase(getAllTodos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Todo
    builder
      .addCase(createTodo.pending, (state) => {
        state.error = null;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.todos.unshift(action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update Todo
    builder
      .addCase(updateTodo.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        const index = state.todos.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete Todo
    builder
      .addCase(deleteTodo.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.todos = state.todos.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError } = todoSlice.actions;
export default todoSlice.reducer;
