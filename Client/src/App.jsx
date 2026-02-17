import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import "./App.css";
import Login from "./Pages/Login";
import NotFound from "./Pages/Components/NotFound";
import Navbar from "./Pages/Components/Navbar";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import Profile from "./Pages/Profile";
import Users from "./Pages/Users";
import ProtectedRoute, {
  RoleProtectedRoute,
} from "./features/ProtectedRoute";
import { getProfile } from "./store/authSlice";
import Todo from "./Pages/Todo";
import Expense from "./Pages/Expense";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import FolderStructure from "./Pages/FolderStructure";


function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isLoginPage = location.pathname === "/login";
  const isSignUpPage = location.pathname === "/register";
  const isForgotPasswordPage = location.pathname === "/forgot-password";
  const isResetPasswordPage = location.pathname.startsWith("/reset-password");

  // Restore user data on page refresh if token exists in cookies
  useEffect(() => {
    const token = Cookies.get("token");
    if (token && isAuthenticated && !user) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, user]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        {!isLoginPage &&
          !isSignUpPage &&
          !isForgotPasswordPage &&
          !isResetPasswordPage && <Navbar />}
        <Routes>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/register" element={<Register />}></Route>
          <Route path="/forgot-password" element={<ForgotPassword />}></Route>
          <Route
            path="/reset-password/:token"
            element={<ResetPassword />}
          ></Route>
          <Route path="*" element={<NotFound />}></Route>
          <Route path="/" element={<Navigate to="/dashboard" />}></Route>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/users"
            element={
              <RoleProtectedRoute requiredRole="admin">
                <Users />
              </RoleProtectedRoute>
            }
          ></Route>
          <Route
            path="/todo"
            element={
              <ProtectedRoute>
                <Todo />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/expense"
            element={
              <ProtectedRoute>
                <Expense />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/folderstructure"
            element={
              <ProtectedRoute>
                <FolderStructure />
              </ProtectedRoute>
            }
          ></Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
