const { pool } = require("../config/db");

// Get all expenses for authenticated user
exports.getAllExpenses = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [expenses] = await connection.execute(
        "SELECT id, amount, date, description, category, createdAt FROM Expenses WHERE userId = ? ORDER BY createdAt DESC",
        [req.userId],
      );

      const totalAmount = expenses.reduce(
        (sum, exp) => sum + parseFloat(exp.amount),
        0,
      );

      res.status(200).json({
        expenses: expenses.map((expense) => ({
          id: expense.id,
          amount: expense.amount,
          date: expense.date,
          description: expense.description,
          category: expense.category,
          createdAt: expense.createdAt,
        })),
        totalAmount,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get expenses error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch expenses" });
  }
};
// Create new expense
exports.createExpense = async (req, res) => {
  try {
    const { amount, date, description, category } = req.body;

    // Validation
    if (!amount || !date || !description || !category) {
      return res.status(400).json({
        message: "Amount, date, description, and category are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const connection = await pool.getConnection();

    try {
      const dateObj = new Date(date);
      const mysqlDate = dateObj.toISOString().slice(0, 19).replace("T", " ");
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      const [result] = await connection.execute(
        "INSERT INTO Expenses (amount, date, description, category, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [amount, mysqlDate, description, category, req.userId, now, now],
      );

      const newExpenseId = result.insertId;

      res.status(201).json({
        message: "Expense created successfully",
        expense: {
          id: newExpenseId,
          amount,
          date,
          description,
          category,
          createdAt: new Date(),
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Create expense error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to create expense" });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, description, category } = req.body;

    const connection = await pool.getConnection();

    try {
      // Check if expense exists and belongs to user
      const [existingExpenses] = await connection.execute(
        "SELECT id, amount, date, description, category FROM Expenses WHERE id = ? AND userId = ?",
        [id, req.userId],
      );

      if (existingExpenses.length === 0) {
        return res.status(404).json({ message: "Expense not found" });
      }

      // Build update query
      const updates = [];
      const values = [];

      if (amount !== undefined) {
        if (amount <= 0) {
          return res
            .status(400)
            .json({ message: "Amount must be greater than 0" });
        }
        updates.push("amount = ?");
        values.push(amount);
      }
      if (date) {
        updates.push("date = ?");
        const dateObj = new Date(date);
        const mysqlDate = dateObj.toISOString().slice(0, 19).replace("T", " ");
        values.push(mysqlDate);
      }
      if (description) {
        updates.push("description = ?");
        values.push(description);
      }
      if (category) {
        updates.push("category = ?");
        values.push(category);
      }

      if (updates.length === 0) {
        return res
          .status(400)
          .json({ message: "No fields to update provided" });
      }

      values.push(id);
      values.push(req.userId);

      const query = `UPDATE Expenses SET ${updates.join(", ")} WHERE id = ? AND userId = ?`;
      await connection.execute(query, values);

      // Fetch updated expense
      const [updatedExpenses] = await connection.execute(
        "SELECT id, amount, date, description, category, createdAt FROM Expenses WHERE id = ?",
        [id],
      );

      const updatedExpense = updatedExpenses[0];

      res.status(200).json({
        message: "Expense updated successfully",
        expense: {
          id: updatedExpense.id,
          amount: updatedExpense.amount,
          date: updatedExpense.date,
          description: updatedExpense.description,
          category: updatedExpense.category,
          createdAt: updatedExpense.createdAt,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Update expense error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update expense" });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
      // Check if expense exists and belongs to user
      const [expenses] = await connection.execute(
        "SELECT id FROM Expenses WHERE id = ? AND userId = ?",
        [id, req.userId],
      );

      if (expenses.length === 0) {
        return res.status(404).json({ message: "Expense not found" });
      }

      await connection.execute("DELETE FROM Expenses WHERE id = ?", [id]);

      res.status(200).json({ message: "Expense deleted successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete expense error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to delete expense" });
  }
};
