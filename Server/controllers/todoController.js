const { pool } = require("../config/db");

// Get all todos for authenticated user
exports.getAllTodos = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [todos] = await connection.execute(
        "SELECT id, todo, description, date, status, createdAt FROM Todos WHERE userId = ? ORDER BY createdAt DESC",
        [req.userId]
      );

      res.status(200).json({
        todos: todos.map((todo) => ({
          id: todo.id,
          todo: todo.todo,
          description: todo.description,
          date: todo.date,
          status: todo.status,
          createdAt: todo.createdAt,
        })),
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get todos error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch todos" });
  }
};

// Create new todo
exports.createTodo = async (req, res) => {
  try {
    const { todo, description, date } = req.body;

    // Validation
    if (!todo || !date) {
      return res
        .status(400)
        .json({ message: "Todo and date are required" });
    }

    const connection = await pool.getConnection();

    try {
      // Convert ISO date to MySQL DATETIME format
      const dateObj = new Date(date);
      const mysqlDate = dateObj.toISOString().slice(0, 19).replace('T', ' ');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const [result] = await connection.execute(
        "INSERT INTO Todos (todo, description, date, userId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [todo, description || "", mysqlDate, req.userId, "pending", now, now]
      );

      const newTodoId = result.insertId;

      res.status(201).json({
        message: "Todo created successfully",
        todo: {
          id: newTodoId,
          todo,
          description: description || "",
          date,
          status: "pending",
          createdAt: new Date(),
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Create todo error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to create todo" });
  }
};

// Update todo
exports.updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { todo, description, date, status } = req.body;

    const connection = await pool.getConnection();

    try {
      const [existingTodos] = await connection.execute(
        "SELECT id, todo, description, date, status FROM Todos WHERE id = ? AND userId = ?",
        [id, req.userId]
      );

      if (existingTodos.length === 0) {
        return res.status(404).json({ message: "Todo not found" });
      }

      const existingTodo = existingTodos[0];

      // Build update query
      const updates = [];
      const values = [];

      if (todo) {
        updates.push("todo = ?");
        values.push(todo);
      }
      if (description !== undefined) {
        updates.push("description = ?");
        values.push(description);
      }
      if (date) {
        updates.push("date = ?");
        const dateObj = new Date(date);
        const mysqlDate = dateObj.toISOString().slice(0, 19).replace('T', ' ');
        values.push(mysqlDate);
      }
      if (status) {
        updates.push("status = ?");
        values.push(status);
      }

      if (updates.length === 0) {
        return res
          .status(400)
          .json({ message: "No fields to update provided" });
      }

      values.push(id);
      values.push(req.userId);

      const query = `UPDATE Todos SET ${updates.join(", ")} WHERE id = ? AND userId = ?`;
      await connection.execute(query, values);

      // Fetch updated todo
      const [updatedTodos] = await connection.execute(
        "SELECT id, todo, description, date, status, createdAt FROM Todos WHERE id = ?",
        [id]
      );

      const updatedTodo = updatedTodos[0];

      res.status(200).json({
        message: "Todo updated successfully",
        todo: {
          id: updatedTodo.id,
          todo: updatedTodo.todo,
          description: updatedTodo.description,
          date: updatedTodo.date,
          status: updatedTodo.status,
          createdAt: updatedTodo.createdAt,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Update todo error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update todo" });
  }
};

// Delete todo
exports.deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
      const [todos] = await connection.execute(
        "SELECT id FROM Todos WHERE id = ? AND userId = ?",
        [id, req.userId]
      );

      if (todos.length === 0) {
        return res.status(404).json({ message: "Todo not found" });
      }

      await connection.execute("DELETE FROM Todos WHERE id = ?", [id]);

      res.status(200).json({ message: "Todo deleted successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete todo error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to delete todo" });
  }
};
