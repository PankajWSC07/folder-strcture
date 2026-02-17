const { pool } = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "kjfdnkdjnmdplkmnbvs", {
    expiresIn: "7d",
  });
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const connection = await pool.getConnection();

    try {
      // Check if user already exists
      const [existingUser] = await connection.execute(
        "SELECT id FROM Users WHERE email = ?",
        [email],
      );

      if (existingUser.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      // Create new user
      const [result] = await connection.execute(
        "INSERT INTO Users (firstName, lastName, email, password,  createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
        [firstName, lastName, email, hashedPassword, now ,now]
      );

      const userId = result.insertId;

      // Generate token
      const token = generateToken(userId);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: userId,
          firstName,
          lastName,
          email,
          role: "user",
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message || "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const connection = await pool.getConnection();

    try {
      // Find user by email
      const [users] = await connection.execute(
        "SELECT * FROM Users WHERE email = ?",
        [email],
      );

      if (users.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = users[0];

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate token
      const token = generateToken(user.id);

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          email: user.email,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message || "Login failed" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        "SELECT id, firstName, lastName, email, role, createdAt FROM Users WHERE id = ?",
        [req.userId],
      );

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = users[0];

      res.status(200).json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get profile error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch profile" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // Check if current user is admin
      const [currentUserResult] = await connection.execute(
        "SELECT role FROM Users WHERE id = ?",
        [req.userId],
      );

      if (
        currentUserResult.length === 0 ||
        currentUserResult[0].role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Access denied. Admin role required." });
      }

      // Get all users
      const [users] = await connection.execute(
        "SELECT id, firstName, lastName, email, role, createdAt FROM Users",
      );

      res.status(200).json({
        users: users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        })),
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch users" });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const connection = await pool.getConnection();

    try {
      // Find user by email
      const [users] = await connection.execute(
        "SELECT id, firstName, email FROM Users WHERE email = ?",
        [email],
      );

      if (users.length === 0) {
        return res.status(200).json({
          message: "If email exists, password reset link has been sent",
        });
      }

      const user = users[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Set reset token and expiration in 30 minutes
      const resetExpire = new Date(Date.now() + 30 * 60 * 1000);

      await connection.execute(
        "UPDATE Users SET resetPasswordToken = ?, resetPasswordExpire = ? WHERE id = ?",
        [resetTokenHash, resetExpire, user.id],
      );

      // Create reset URL
      const resetUrl = `${
        process.env.CLIENT_URL || "http://localhost:5173"
      }/reset-password/${resetToken}`;

      // Send email
      try {
        const transporter = createTransporter();

        // Test connection
        await transporter.verify();
        console.log("✅ Email transporter verified successfully");

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Password Reset Request",
          html: `
            <h2>Password Reset Request</h2>
            <p>Hi ${user.firstName},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}"  target="_blank"  rel="noopener noreferrer" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
            <p>Or copy and paste this link: <b> ${resetUrl} <b></p>
            <p>This link will expire in 30 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>our Team</p>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully:", info.response);

        res.status(200).json({
          message:
            "Password reset link has been sent to your email. Please check your inbox.",
        });
      } catch (emailError) {
        console.error("❌ Email send error:", emailError);
        // Reset the token if email fails
        await connection.execute(
          "UPDATE Users SET resetPasswordToken = NULL, resetPasswordExpire = NULL WHERE id = ?",
          [user.id],
        );
        return res.status(500).json({
          message: "Failed to send reset email. Please try again later.",
          error: emailError.message,
        });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to process password reset" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validation
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Hash the token to compare
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const connection = await pool.getConnection();

    try {
      // Find user with valid reset token
      const [users] = await connection.execute(
        "SELECT id FROM Users WHERE resetPasswordToken = ? AND resetPasswordExpire > NOW()",
        [resetTokenHash],
      );

      if (users.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      const user = users[0];

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update password
      await connection.execute(
        "UPDATE Users SET password = ?, resetPasswordToken = NULL, resetPasswordExpire = NULL WHERE id = ?",
        [hashedPassword, user.id],
      );

      res.status(200).json({
        message:
          "Password reset successful. Please login with your new password.",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to reset password" });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role } = req.body;

    const connection = await pool.getConnection();

    try {
      // Check if user exists
      const [users] = await connection.execute(
        "SELECT id FROM Users WHERE id = ?",
        [id],
      );

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build dynamic update query
      const updates = [];
      const values = [];

      if (firstName) {
        updates.push("firstName = ?");
        values.push(firstName);
      }
      if (lastName) {
        updates.push("lastName = ?");
        values.push(lastName);
      }
      if (email) {
        updates.push("email = ?");
        values.push(email);
      }
      if (role) {
        updates.push("role = ?");
        values.push(role);
      }

      if (updates.length === 0) {
        return res
          .status(400)
          .json({ message: "No fields to update provided" });
      }

      values.push(id);

      const query = `UPDATE Users SET ${updates.join(", ")} WHERE id = ?`;
      await connection.execute(query, values);

      // Fetch updated user
      const [updatedUsers] = await connection.execute(
        "SELECT id, firstName, lastName, email, role FROM Users WHERE id = ?",
        [id],
      );

      const user = updatedUsers[0];

      res.status(200).json({
        message: "User updated successfully",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: error.message || "Failed to update user" });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
      // Check if user exists
      const [users] = await connection.execute(
        "SELECT id FROM Users WHERE id = ?",
        [id],
      );

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete user
      await connection.execute("DELETE FROM Users WHERE id = ?", [id]);

      res.status(200).json({
        message: "User deleted successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: error.message || "Failed to delete user" });
  }
};
