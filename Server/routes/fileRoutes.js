const express = require("express");
const { upload } = require("../config/multer");
const authMiddleware = require("../middleware/auth");
const {
  uploadFile,
  getFilesByParent,
  getAllFiles,
  deleteFile,
  downloadFile,
} = require("../controllers/fileController");

const router = express.Router();

router.use(authMiddleware);

router.post("/upload", upload.single("file"), uploadFile);
router.get("/", getAllFiles);
router.get("/download/:fileId", downloadFile);
router.get("/:parentId", getFilesByParent);
router.delete("/:fileId", deleteFile);

module.exports = router;
