import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import todoReducer from "./todoSlice";
import expenseReducer from "./expenseSlice";
import folderReducer from "./folderSlice";
import fileReducer from "./fileSlice";
import permissionReducer from "./permissionSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    todo: todoReducer,
    expense: expenseReducer,
    folder: folderReducer,
    file: fileReducer,
    permissions: permissionReducer,
  },
});

export default store;
