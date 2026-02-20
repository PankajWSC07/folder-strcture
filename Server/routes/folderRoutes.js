const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createItem,
  getItems,
  deleteItem,
  renameItem,
} = require("../controllers/folderController");

router.use(authMiddleware);
router.post("/create", createItem);
router.get("/items", getItems);
router.get("/items/:parentId", getItems);
router.put("/:itemId/rename", renameItem);
router.delete("/:itemId", deleteItem);

module.exports = router;
