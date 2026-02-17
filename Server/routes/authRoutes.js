const express = require("express");
const {
  register,
  login,
  getProfile,
  getAllUsers,
  forgotPassword,
  resetPassword,
  updateUser,
  deleteUser,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.get("/users", authMiddleware, getAllUsers);
router.put("/users/:id", authMiddleware, updateUser);
router.delete("/users/:id", authMiddleware, deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
