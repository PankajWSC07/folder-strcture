const { pool } = require("../config/db");

const givePermission = async (req, res) => {
  try {
    const { fileId, targetUserId } = req.body;
    const userId = req.userId;

    if (!fileId || !targetUserId) {
      return res
        .status(400)
        .json({ message: "File ID and target user ID are required" });
    }
    const connection = await pool.getConnection();

    try {
      const [UserIdFromItem] = await connection.execute(
        "SELECT userId FROM Items WHERE id = ?",
        [fileId],
      );
      if (UserIdFromItem.length === 0 || UserIdFromItem[0].userId !== userId) {
        return res
          .status(403)
          .json({ message: "You do not have permission to share this file" });
      }

      const [fileRows] = await connection.execute(
        "SELECT id FROM Items WHERE id = ? AND userId = ?",
        [fileId, userId],
      );
      if (fileRows.length === 0) {
        return res.status(404).json({ message: "File not found" });
      }
      const [targetUserRows] = await connection.execute(
        "SELECT id FROM Users WHERE id = ?",
        [targetUserId],
      );
      if (targetUserRows.length === 0) {
        return res.status(404).json({ message: "Target user not found" });
      }
      await connection.execute(
        "INSERT INTO Permissions (fileId, userId) VALUES (?, ?)",
        [fileId, targetUserId],
      );
      res.status(200).json({ message: "Permission granted successfully" });
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to give permission" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Give permission error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to give permission" });
  }
};

const getPermissions = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [permissions] = await connection.execute(
        `SELECT p.id, f.name, u.firstName AS grantedTo
                 FROM Permissions p
                    JOIN Items f ON p.fileId = f.id
                    JOIN Users u ON p.userId = u.id
                    WHERE f.userId = ?`,
        [userId],
      );
      res.status(200).json({ permissions });
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to get permissions" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get permissions error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to get permissions" });
  }
};

const getAllUsersForPermission = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        "SELECT id, firstName, lastName, email FROM Users WHERE id != ?",
        [req.userId],
      );

      res.status(200).json({ users });
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to fetch users" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch users" });
  }
};

const getItemPermissions = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    console.log(
      `[getItemPermissions] Request from userId: ${userId}, itemId: ${itemId}`,
    );

    try {
      const [itemCheck] = await connection.execute(
        "SELECT userId FROM Items WHERE id = ?",
        [itemId],
      );

      if (itemCheck.length === 0) {
        console.log(` [getItemPermissions] Item ${itemId} not found`);
        return res.status(404).json({
          message: "Item not found",
        });
      }

      const itemOwner = itemCheck[0].userId;
      const isOwner = itemOwner === userId;

      console.log(
        ` [getItemPermissions] Item owner: ${itemOwner}, Current user: ${userId}, isOwner: ${isOwner}`,
      );

      let query;
      let params;

      if (isOwner) {
        query = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                        p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                 FROM Permissions p
                 JOIN Users u ON p.userId = u.id
                 WHERE p.itemId = ?`;
        params = [itemId];
      } else {
        query = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                        p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                 FROM Permissions p
                 JOIN Users u ON p.userId = u.id
                 WHERE p.itemId = ? AND p.userId = ?`;
        params = [itemId, userId];
      }

      const [permissions] = await connection.execute(query, params);

      const convertedPermissions = permissions.map((p) => ({
        ...p,
        can_view: Boolean(p.can_view),
        can_create: Boolean(p.can_create),
        can_upload: Boolean(p.can_upload),
        can_edit: Boolean(p.can_edit),
        can_delete: Boolean(p.can_delete),
      }));

      console.log(
        ` [getItemPermissions] Found ${convertedPermissions.length} permission(s):`,
        convertedPermissions,
      );

      res.status(200).json({ permissions: convertedPermissions });
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to fetch permissions" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get item permissions error:", error);
    res
      .status(500) 
      .json({ message: error.message || "Failed to fetch permissions" });
  }
};

const setItemPermission = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId, can_view, can_create, can_upload, can_edit, can_delete } =
      req.body;
    const currentUserId = req.userId;

    console.log(
      ` [setItemPermission] Request from userId: ${currentUserId}, setting permissions for itemId: ${itemId}, targetUserId: ${userId}`,
    );
    console.log(
      `   Permissions: { can_view: ${can_view}, can_create: ${can_create}, can_upload: ${can_upload}, can_edit: ${can_edit}, can_delete: ${can_delete} }`,
    );

    if (!itemId || !userId) {
      return res
        .status(400)
        .json({ message: "Item ID and User ID are required" });
    }

    const connection = await pool.getConnection();

    try {
      const [itemCheck] = await connection.execute(
        "SELECT userId FROM Items WHERE id = ?",
        [itemId],
      );

      if (itemCheck.length === 0 || itemCheck[0].userId !== currentUserId) {
        console.log(` [setItemPermission] Permission denied - not item owner`);
        return res.status(403).json({
          message: "You do not have permission to modify permissions",
        });
      }

      const [existingPermission] = await connection.execute(
        "SELECT id FROM Permissions WHERE itemId = ? AND userId = ?",
        [itemId, userId],
      );

      console.log(
        `   Existing permission found: ${existingPermission.length > 0}`,
      );

      const query =
        existingPermission.length > 0
          ? `UPDATE Permissions SET can_view = ?, can_create = ?, can_upload = ?, can_edit = ?, can_delete = ?, updatedAt = NOW() 
           WHERE itemId = ? AND userId = ?`
          : `INSERT INTO Permissions (itemId, userId, can_view, can_create, can_upload, can_edit, can_delete) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`;

      const params =
        existingPermission.length > 0
          ? [
              can_view,
              can_create,
              can_upload,
              can_edit,
              can_delete,
              itemId,
              userId,
            ]
          : [
              itemId,
              userId,
              can_view,
              can_create,
              can_upload,
              can_edit,
              can_delete,
            ];

      await connection.execute(query, params);

      console.log(` [setItemPermission] Permission updated successfully`);

      res.status(200).json({ message: "Permission updated successfully" });
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to update permission" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Set permission error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update permission" });
  }
};

const removeItemPermission = async (req, res) => {
  try {
    const { itemId, userId } = req.params;
    const currentUserId = req.userId;

    const connection = await pool.getConnection();

    try {
      const [itemCheck] = await connection.execute(
        "SELECT userId FROM Items WHERE id = ?",
        [itemId],
      );

      if (itemCheck.length === 0 || itemCheck[0].userId !== currentUserId) {
        return res.status(403).json({
          message: "You do not have permission to remove permissions",
        });
      }

      await connection.execute(
        "DELETE FROM Permissions WHERE itemId = ? AND userId = ?",
        [itemId, userId],
      );

      res.status(200).json({ message: "Permission removed successfully" });
    } catch (error) {
      console.error("Database error:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to remove permission" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Remove permission error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to remove permission" });
  }
};

module.exports = {
  givePermission,
  getPermissions,
  getAllUsersForPermission,
  getItemPermissions,
  setItemPermission,
  removeItemPermission,
};
