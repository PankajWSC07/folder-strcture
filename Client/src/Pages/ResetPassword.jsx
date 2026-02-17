import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "primereact/card";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword, clearError } from "../store/authSlice";
import "../App.css";

function ResetPassword() {
  const toast = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!token) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Invalid reset token",
        life: 3000,
      });
      return;
    }

    setSubmitted(true);
    dispatch(
      resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      }),
    );
  };

  // Handle success
  useEffect(() => {
    if (submitted && !isLoading && !error) {
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Password reset successful. Redirecting to login...",
        life: 3000,
      });

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [submitted, isLoading, error, navigate]);

  // Handle error
  useEffect(() => {
    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error,
        life: 3000,
      });
      dispatch(clearError());
      setSubmitted(false);
    }
  }, [error, dispatch]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Invalid reset link",
        life: 3000,
      });
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toast ref={toast} />

      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>

            <Password
              placeholder="Enter new password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              toggleMask
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

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>

            <Password
              placeholder="Confirm password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              toggleMask
              className={`w-full ${errors.password ? "ng-invalid ng-touched" : ""}`}
              inputStyle={{
                height: "48px",
                width: "100%",
                paddingRight: "11rem",
              }}
              invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <small className="p-error">{errors.confirmPassword}</small>
            )}
          </div>

          {/* Submit Button */}
          <Button
            label={isLoading ? "Resetting..." : "Reset Password"}
            onClick={handleSubmit}
            loading={isLoading}
            className="w-full mb-4"
            style={{ height: "48px", fontSize: "16px" }}
          />
        </form>

        {/* Links */}
        <div className="text-center">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ResetPassword;
