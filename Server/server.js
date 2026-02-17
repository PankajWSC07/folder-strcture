const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { connectDB } = require("./config/db");
const { createTables } = require("./model/Table");
const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const folderRoutes = require("./routes/folderRoutes");
const fileRoutes = require("./routes/fileRoutes");
const permissionRoutes = require("./routes/permissionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

const GetDatabaseConnection = async () => {
  await connectDB();
  await createTables();
};

GetDatabaseConnection();

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/permissions", permissionRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on  http://localhost:${PORT}`);
});
