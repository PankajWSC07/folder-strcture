import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../store/authSlice";
import "../App.css";

function Login() {
  const toast = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error } = useSelector(
    (state) => state.auth,
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error on field change
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    dispatch(loginUser(formData));
  };

  // Handle login success
  useEffect(() => {
    if (isAuthenticated) {
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Login successful!",
        life: 3000,
      });

      // Reset form
      setFormData({
        email: "",
        password: "",
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    }
  }, [isAuthenticated, navigate]);

  // Handle login error
  useEffect(() => {
    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error,
        life: 3000,
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toast ref={toast} />

      <Card className="w-full max-w-md shadow-2xl ">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <InputText
              placeholder="Enter your email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full ${errors.email ? "ng-invalid ng-touched p-invalid" : ""}`}
              style={{ height: "48px" }}
            />
            {errors.email && <small className="p-error">{errors.email}</small>}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <Password
              placeholder="Enter password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              toggleMask
              feedback={false}
              className={`w-full ${errors.password ? "ng-invalid ng-touched" : ""}`}
              inputStyle={{
                height: "48px",
                width: "100%",
                paddingRight: "11rem",
              }}
              invalid={!!errors.password}
            />

            {errors.password && (
              <small className="p-error">{errors.password}</small>
            )}
          </div>

          <Button
            label="Sign In"
            icon="pi pi-sign-in"
            className="w-full p-button-primary"
            loading={isLoading}
            disabled={isLoading}
            onClick={handleLogin}
            type="button"
          />
        </form>

        {/* Forgot Password Link */}
        <div className="text-right mt-2">
          <Link
            to="/forgot-password"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-semibold hover:text-indigo-700"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default Login;
