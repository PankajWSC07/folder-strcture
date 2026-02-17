const express = require("express");
const {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, getAllExpenses);
router.post("/", authMiddleware, createExpense);
router.put("/:id", authMiddleware, updateExpense);
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;
