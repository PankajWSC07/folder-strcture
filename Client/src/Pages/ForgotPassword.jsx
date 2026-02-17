import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, clearError } from "../store/authSlice";
import "../App.css";

function ForgotPassword() {
  const toast = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (emailValue) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailValue);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { value } = e.target;
    setEmail(value);

    // Clear error on field change
    if (errors.email) {
      setErrors((prev) => ({
        ...prev,
        email: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitted(true);
    dispatch(forgotPassword(email));
  };

  // Handle success
  useEffect(() => {
    if (submitted && !isLoading && !error) {
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Password reset link has been sent to your email",
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
    }
  }, [error, dispatch]);

  // Track when submit button is clicked
  useEffect(() => {
    if (!isLoading && submitted && !error) {
      setSubmitted(false);
    }
  }, [isLoading, submitted, error]);

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitted(true);
      dispatch(forgotPassword(email));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toast ref={toast} />

      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-600">
            Enter your email to receive a password reset link
          </p>
        </div>

        <form onSubmit={handleForgotSubmit}>
          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <InputText
              placeholder="Enter your email"
              name="email"
              value={email}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full ${errors.email ? "ng-invalid ng-touched p-invalid" : ""}`}
              style={{ height: "48px" }}
            />
            {errors.email && <small className="p-error">{errors.email}</small>}
          </div>

          {/* Submit Button */}
          <Button
            label={isLoading ? "Sending..." : "Send Reset Link"}
            onClick={handleForgotSubmit}
            loading={isLoading}
            className="w-full mb-4"
            style={{ height: "48px", fontSize: "16px" }}
          />
        </form>

        {/* Links */}
        <div className="text-center space-y-2">
          <p className="text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ForgotPassword;
