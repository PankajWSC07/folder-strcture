const { pool } = require("../config/db");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../Uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { parentId } = req.body;
    const userId = req.userId;
    const file = req.file;

    if (parentId) {
      const connection = await pool.getConnection();
      try {
        const [ownFolders] = await connection.execute(
          "SELECT id FROM Items WHERE id = ? AND userId = ? AND type = 'folder'",
          [parentId, userId],
        );

        if (ownFolders.length === 0) {
          const [parentItem] = await connection.execute(
            "SELECT rootFolderId FROM Items WHERE id = ?",
            [parentId],
          );

          if (parentItem.length > 0) {
            const rootFolderId = parentItem[0].rootFolderId === 0 || parentItem[0].rootFolderId === null 
              ? parentId 
              : parentItem[0].rootFolderId;

            const [sharedFolder] = await connection.execute(
              `SELECT i.id FROM Items i
               INNER JOIN Permissions p ON i.id = p.itemId
               WHERE i.id = ? AND p.userId = ? AND p.can_upload = 1 AND i.type = 'folder'`,
              [rootFolderId, userId],
            );

            if (sharedFolder.length === 0) {
              const filePath = path.join(uploadsDir, file.filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
              return res.status(403).json({
                message: "You do not have permission to upload files to this folder",
              });
            }
          } else {
            const filePath = path.join(uploadsDir, file.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            return res.status(404).json({
              message: "Parent folder not found",
            });
          }
        }
      } finally {
        connection.release();
      }
    }

    const connection = await pool.getConnection();

    try {
      let rootFolderId = 0;
      if (parentId) {
        const [parentItem] = await connection.execute(
          "SELECT rootFolderId FROM Items WHERE id = ?",
          [parentId],
        );
        
        if (parentItem.length > 0) {
          rootFolderId = parentItem[0].rootFolderId === 0 ? parentId : parentItem[0].rootFolderId;
        }
      }

      const filePath = `/uploads/${file.filename}`;
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      const [fileResult] = await connection.execute(
        "INSERT INTO Files (name, filePath, originalName, size, mimeType, userId, parentId, rootFolderId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          file.filename,
          filePath,
          file.originalname,
          file.size,
          file.mimetype,
          userId,
          parentId || null,
          rootFolderId,
          now,
          now,
        ],
      );

      const fileId = fileResult.insertId;

      if (parentId) {
        const [parentItem] = await connection.execute(
          "SELECT userId FROM Items WHERE id = ?",
          [parentId],
        );

        if (parentItem.length > 0 && parentItem[0].userId !== userId) {
          // Parent owner is different from uploader
          // Grant parent owner full permissions (since it's their folder)
          console.log(` [uploadFile] Auto-granting parent owner (${parentItem[0].userId}) full permissions on rootFolderId (${rootFolderId})`);
          await connection.execute(
            `INSERT INTO Permissions (itemId, userId, can_view, can_create, can_upload, can_edit, can_delete)
             VALUES (?, ?, 1, 1, 1, 1, 1)
             ON DUPLICATE KEY UPDATE can_view=1, can_create=1, can_upload=1, can_edit=1, can_delete=1`,
            [rootFolderId, parentItem[0].userId],
          );
          
          // Grant uploader the SAME permissions they have on root folder
          console.log(` [uploadFile] Fetching uploader's permissions on rootFolderId (${rootFolderId})...`);
          const [uploaderPerms] = await connection.execute(
            `SELECT can_view, can_create, can_upload, can_edit, can_delete FROM Permissions 
             WHERE itemId = ? AND userId = ?`,
            [rootFolderId, userId],
          );

          if (uploaderPerms.length > 0) {
            const perm = uploaderPerms[0];
            console.log(
              ` [uploadFile] Auto-granting uploader (${userId}) the same permissions on rootFolderId (${rootFolderId}):`,
              perm,
            );
            await connection.execute(
              `INSERT INTO Permissions (itemId, userId, can_view, can_create, can_upload, can_edit, can_delete)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE can_view=?, can_create=?, can_upload=?, can_edit=?, can_delete=?`,
              [
                rootFolderId,
                userId,
                perm.can_view ? 1 : 0,
                perm.can_create ? 1 : 0,
                perm.can_upload ? 1 : 0,
                perm.can_edit ? 1 : 0,
                perm.can_delete ? 1 : 0,
                perm.can_view ? 1 : 0,
                perm.can_create ? 1 : 0,
                perm.can_upload ? 1 : 0,
                perm.can_edit ? 1 : 0,
                perm.can_delete ? 1 : 0,
              ],
            );
          }
        }
      }

      res.status(201).json({
        message: "File uploaded successfully",
        file: {
          id: fileId,
          name: file.originalname,
          filePath: filePath,
          size: file.size,
          mimeType: file.mimetype,
          userId: userId,
          parentId: parentId || null,
          createdAt: now,
        },
      });
    } catch (error) {
      const filePath = path.join(uploadsDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Error uploading file" });
  }
};

// Get files by parent ID
exports.getFilesByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      let query = "SELECT f.* FROM Files f WHERE f.userId = ?";
      const params = [userId];

      if (parentId && parentId !== "null") {
        query += " AND f.parentId = ?";
        params.push(parentId);
      } else {
        query += " AND f.parentId IS NULL";
      }

      query += " ORDER BY f.createdAt DESC";
      const [files] = await connection.execute(query, params);

      res.status(200).json({
        message: "Files retrieved successfully",
        data: files,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Error fetching files" });
  }
};

// Get all files for logged-in user
exports.getAllFiles = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [files] = await connection.execute(
        "SELECT f.* FROM Files f WHERE f.userId = ? ORDER BY f.createdAt DESC",
        [userId],
      );

      res.status(200).json({
        message: "All files retrieved successfully",
        data: files,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching all files:", error);
    res.status(500).json({ message: "Error fetching all files" });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [uploadedFiles] = await connection.execute(
        `SELECT f.id, f.filePath, f.userId, f.parentId, f.rootFolderId FROM Files f 
         WHERE f.id = ?`,
        [fileId],
      );

      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0];
        const rootFolderId = file.rootFolderId === 0 || file.rootFolderId === null 
          ? file.parentId 
          : file.rootFolderId;

        let isAuthorized = file.userId === userId; 

        if (!isAuthorized && file.parentId) {
          const [parentOwner] = await connection.execute(
            `SELECT userId FROM Items WHERE id = ?`,
            [file.parentId],
          );
          if (parentOwner.length > 0 && parentOwner[0].userId === userId) {
            isAuthorized = true;
          }
        }

        if (!isAuthorized && rootFolderId) {
          const [perm] = await connection.execute(
            `SELECT 1 FROM Permissions WHERE itemId = ? AND userId = ? AND can_delete = 1`,
            [rootFolderId, userId],
          );
          isAuthorized = perm.length > 0;
        }

        if (!isAuthorized) {
          console.log(` [deleteFile] User ${userId} not authorized to delete file ${fileId}`);
          await connection.rollback();
          return res.status(403).json({ message: "You do not have permission to delete this file" });
        }

        console.log(` [deleteFile] Deleting uploaded file ${fileId} by user ${userId}`);
        const filePath = path.join(uploadsDir, path.basename(file.filePath));

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        await connection.execute(
          "DELETE FROM Files WHERE id = ?",
          [fileId],
        );

        await connection.commit();
        return res.status(200).json({ message: "File deleted successfully" });
      }

      const [itemFiles] = await connection.execute(
        `SELECT i.id, i.userId, i.parentId, i.rootFolderId FROM Items i 
         WHERE i.id = ? AND i.type = 'file'`,
        [fileId],
      );

      if (itemFiles.length > 0) {
        const file = itemFiles[0];
        const rootFolderId = file.rootFolderId === 0 || file.rootFolderId === null 
          ? file.parentId 
          : file.rootFolderId;

        let isAuthorized = file.userId === userId; 

        if (!isAuthorized && file.parentId) {
          const [parentOwner] = await connection.execute(
            `SELECT userId FROM Items WHERE id = ?`,
            [file.parentId],
          );
          if (parentOwner.length > 0 && parentOwner[0].userId === userId) {
            isAuthorized = true;
          }
        }

        if (!isAuthorized && rootFolderId) {
          const [perm] = await connection.execute(
            `SELECT 1 FROM Permissions WHERE itemId = ? AND userId = ? AND can_delete = 1`,
            [rootFolderId, userId],
          );
          isAuthorized = perm.length > 0;
        }

        if (!isAuthorized) {
          console.log(` [deleteFile] User ${userId} not authorized to delete file ${fileId}`);
          await connection.rollback();
          return res.status(403).json({ message: "You do not have permission to delete this file" });
        }

        console.log(` [deleteFile] Deleting item file ${fileId} by user ${userId}`);
        await connection.execute(
          "DELETE FROM Items WHERE id = ?",
          [fileId],
        );

        await connection.commit();
        return res.status(200).json({ message: "File deleted successfully" });
      }

      console.log(` [deleteFile] File ${fileId} not found`);
      await connection.rollback();
      return res.status(404).json({ message: "File not found" });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Error deleting file" });
  }
};
// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [files] = await connection.execute(
        `SELECT f.id, f.filePath, f.originalName, f.userId, f.parentId, f.rootFolderId 
         FROM Files f 
         WHERE f.id = ?`,
        [fileId],
      );

      if (files.length === 0) {
        console.log(` [downloadFile] File ${fileId} not found`);
        return res.status(404).json({ message: "File not found" });
      }

      const file = files[0];
      const rootFolderId = file.rootFolderId === 0 || file.rootFolderId === null 
        ? file.parentId 
        : file.rootFolderId;

      let isAuthorized = file.userId === userId;

      if (!isAuthorized && file.parentId) {
        const [parentOwner] = await connection.execute(
          `SELECT userId FROM Items WHERE id = ?`,
          [file.parentId],
        );
        if (parentOwner.length > 0 && parentOwner[0].userId === userId) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized && rootFolderId) {
        const [perm] = await connection.execute(
          `SELECT 1 FROM Permissions WHERE itemId = ? AND userId = ? AND can_view = 1`,
          [rootFolderId, userId],
        );
        isAuthorized = perm.length > 0;
      }

      if (!isAuthorized) {
        console.log(` [downloadFile] User ${userId} not authorized to download file ${fileId}`);
        return res.status(403).json({ message: "You do not have permission to download this file" });
      }

      const filePath = path.join(uploadsDir, path.basename(file.filePath));

      console.log(` [downloadFile] User ${userId} downloading file ${fileId}`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on server" });
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.originalName}"`,
      );
      res.setHeader("Content-Type", "application/octet-stream");

      // Send file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on("error", (error) => {
        console.error("Error streaming file:", error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error downloading file" });
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ message: "Error downloading file" });
  }
};
