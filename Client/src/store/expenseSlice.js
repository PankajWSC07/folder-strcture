import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

const EXPENSES_API_URL = "http://localhost:5000/api/expenses";

// Get all expenses thunk
export const getAllExpenses = createAsyncThunk(
  "expense/getAllExpenses",
  async (_, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(EXPENSES_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch expenses");
    }
  }
);

// Create expense thunk
export const createExpense = createAsyncThunk(
  "expense/createExpense",
  async (expenseData, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      const response = await axios.post(EXPENSES_API_URL, expenseData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.expense;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create expense");
    }
  }
);  

// Update expense thunk
export const updateExpense = createAsyncThunk(
  "expense/updateExpense",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      const response = await axios.put(`${EXPENSES_API_URL}/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.expense;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update expense");
    }
  }
);

// Delete expense thunk
export const deleteExpense = createAsyncThunk(
  "expense/deleteExpense",
  async (id, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      await axios.delete(`${EXPENSES_API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete expense");
    }
  }
);

const initialState = {
  expenses: [],
  totalExpenses: 0,
  isLoading: false,
  error: null,
};

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get All Expenses
    builder
      .addCase(getAllExpenses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload.expenses;
        state.totalExpenses = action.payload.totalAmount;
      })
      .addCase(getAllExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Expense
    builder
      .addCase(createExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
        state.totalExpenses += action.payload.amount;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update Expense
    builder
      .addCase(updateExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          const oldAmount = state.expenses[index].amount;
          state.expenses[index] = action.payload;
          state.totalExpenses = state.totalExpenses - oldAmount + action.payload.amount;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete Expense
    builder
      .addCase(deleteExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        const expense = state.expenses.find((e) => e.id === action.payload);
        if (expense) {
          state.totalExpenses -= expense.amount;
        }
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError } = expenseSlice.actions;
export default expenseSlice.reducer;
