const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createItem,
  getFolderStructure,
  getItemsByParent,
  deleteItem,
  renameItem,
} = require("../controllers/folderController");

router.use(authMiddleware);
router.post("/create", createItem);
router.get("/structure", getFolderStructure);
router.get("/items/:parentId", getItemsByParent);
router.get("/items", getItemsByParent);
router.delete("/:itemId", deleteItem);
router.put("/:itemId/rename", renameItem);

module.exports = router;
