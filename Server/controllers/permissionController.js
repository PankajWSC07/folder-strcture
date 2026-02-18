const {pool} = require("../config/db");

const givePermission = async (req, res) => {
  try {
    const { fileId, targetUserId } = req.body;
    const userId = req.userId;

    console.log(
      `[givePermission] Request from userId: ${userId}, fileId: ${fileId}, targetUserId: ${targetUserId}`,
    );

    if (!fileId || !targetUserId) {
      return res
        .status(400)
        .json({ message: "File ID and target user ID are required" });
    }

    if (isNaN(fileId) || isNaN(targetUserId)) {
      return res
        .status(400)
        .json({ message: "File ID and target user ID must be valid numbers" });
    }

    const connection = await pool.getConnection()

    try {
      const [UserIdFromItem] = await connection.execute(
        "SELECT userId, rootFolderId FROM Items WHERE id = ?",
        [parseInt(fileId)],
      );

      if (UserIdFromItem.length === 0 || UserIdFromItem[0].userId !== userId) {
        console.log(
          `[givePermission] Permission denied - not owner or item not found`,
        );
        return res.status(403).json({
          message: "You do not have permission to share this file",
        });
      }

      const [fileRows] = await connection.execute(
        "SELECT id FROM Items WHERE id = ? AND userId = ?",
        [parseInt(fileId), userId],
      );

      if (fileRows.length === 0) {
        console.log(`[givePermission] File not found: ${fileId}`);
        return res.status(404).json({ message: "File not found" });
      }

      const [targetUserRows] = await connection.execute(
        "SELECT id FROM Users WHERE id = ?",
        [parseInt(targetUserId)],
      );

      if (targetUserRows.length === 0) {
        console.log(`[givePermission] Target user not found: ${targetUserId}`);
        return res.status(404).json({ message: "Target user not found" });
      }

      const rootFolderId =
        UserIdFromItem[0].rootFolderId === 0 ||
        UserIdFromItem[0].rootFolderId === null
          ? parseInt(fileId)
          : UserIdFromItem[0].rootFolderId;

      console.log(
        `[givePermission] Setting permissions on rootFolderId: ${rootFolderId} for targetUserId: ${targetUserId}`,
      );

      await connection.execute(
        `INSERT INTO Permissions (itemId, userId, can_view) 
         VALUES (?, ?, 1) 
         ON DUPLICATE KEY UPDATE can_view=1`,
        [rootFolderId, parseInt(targetUserId)],
      );

      console.log(
        `[givePermission] Permission granted successfully on rootFolderId: ${rootFolderId}`,
      );

      res.status(200).json({
        message: "Permission granted successfully",
        data: {
          rootFolderId,
          userId: parseInt(targetUserId),
          fileId: parseInt(fileId),
        },
      });
    } catch (error) {
      console.error("Database error in givePermission:", error);
      console.error("Error code:", error.code, "Error message:", error.message);
      res.status(500).json({
        message: error.message || "Failed to give permission",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Give permission error:", error);
    res.status(500).json({
      message: error.message || "Failed to give permission",
    });
  }
};

const getPermissions = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();

    console.log(`[getPermissions] Fetching permissions for userId: ${userId}`);

    try {
      const [permissions] = await connection.execute(
        `SELECT p.id, i.name, u.firstName, u.lastName, u.email, 
                 p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete,
                 i.id as itemId, i.rootFolderId
         FROM Permissions p
         JOIN Items i ON p.itemId = i.id
         JOIN Users u ON p.userId = u.id
         WHERE i.userId = ? AND (i.rootFolderId = 0 OR i.rootFolderId IS NULL)
         ORDER BY i.name, u.firstName`,
        [userId],
      );

      console.log(
        `[getPermissions] Found ${permissions.length} permission(s) for user ${userId}`,
        permissions,
      );

      res.status(200).json({
        permissions: permissions.map((p) => ({
          ...p,
          can_view: Boolean(p.can_view),
          can_create: Boolean(p.can_create),
          can_upload: Boolean(p.can_upload),
          can_edit: Boolean(p.can_edit),
          can_delete: Boolean(p.can_delete),
        })),
      });
    } catch (error) {
      console.error("Database error in getPermissions:", error);
      res.status(500).json({
        message: error.message || "Failed to get permissions",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get permissions error:", error);
    res.status(500).json({
      message: error.message || "Failed to get permissions",
    });
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
      if (!itemId || isNaN(itemId)) {
        console.log(`[getItemPermissions] Invalid itemId: ${itemId}`);
        return res.status(400).json({
          message: "Valid Item ID is required",
        });
      }

      const [itemCheck] = await connection.execute(
        "SELECT userId, rootFolderId FROM Items WHERE id = ?",
        [parseInt(itemId)],
      );

      if (itemCheck.length === 0) {
        console.log(` [getItemPermissions] Item ${itemId} not found`);
        return res.status(404).json({
          message: "Item not found",
        });
      }

      const itemOwner = itemCheck[0].userId;
      const isOwner = itemOwner === userId;

      const rootFolderId =
        itemCheck[0].rootFolderId === 0 || itemCheck[0].rootFolderId === null
          ? parseInt(itemId)
          : itemCheck[0].rootFolderId;

      console.log(
        ` [getItemPermissions] Item owner: ${itemOwner}, Current user: ${userId}, isOwner: ${isOwner}, rootFolderId: ${rootFolderId}, itemRootFolderId: ${itemCheck[0].rootFolderId}`,
      );

      let query;
      let params;

      if (isOwner) {
        query = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                        p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                 FROM Permissions p
                 JOIN Users u ON p.userId = u.id
                 WHERE p.itemId = ?
                 ORDER BY u.firstName, u.lastName`;
        params = [rootFolderId];
      } else {
        query = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                        p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                 FROM Permissions p
                 JOIN Users u ON p.userId = u.id
                 WHERE p.itemId = ? AND p.userId = ?`;
        params = [rootFolderId, userId];
      }

      console.log(`[getItemPermissions] Executing query with params:`, params);

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
        ` [getItemPermissions] Found ${convertedPermissions.length} permission(s) for rootFolderId ${rootFolderId}:`,
        convertedPermissions,
      );

      res.status(200).json({ permissions: convertedPermissions });
    } catch (error) {
      console.error("Database error in getItemPermissions:", error);
      console.error("Error details:", error.code, error.message);
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
      console.log("[setItemPermission] Missing itemId or userId");
      return res
        .status(400)
        .json({ message: "Item ID and User ID are required" });
    }

    const permissionValues = {
      can_view: can_view === true || can_view === 1 || can_view === "true",
      can_create:
        can_create === true || can_create === 1 || can_create === "true",
      can_upload:
        can_upload === true || can_upload === 1 || can_upload === "true",
      can_edit: can_edit === true || can_edit === 1 || can_edit === "true",
      can_delete:
        can_delete === true || can_delete === 1 || can_delete === "true",
    };

    console.log(`   Normalized permissions:`, permissionValues);

    if (isNaN(itemId) || isNaN(userId)) {
      console.log("[setItemPermission] Invalid itemId or userId format");
      return res
        .status(400)
        .json({ message: "Item ID and User ID must be valid numbers" });
    }

    const connection = await pool.getConnection();

    try {
      const [itemCheck] = await connection.execute(
        "SELECT userId, rootFolderId FROM Items WHERE id = ?",
        [parseInt(itemId)],
      );

      if (itemCheck.length === 0) {
        console.log(`[setItemPermission] Item ${itemId} not found`);
        return res.status(404).json({ message: "Item not found" });
      }

      const itemOwner = itemCheck[0].userId;

      if (itemOwner !== currentUserId) {
        console.log(
          ` [setItemPermission] Permission denied - not item owner. Owner: ${itemOwner}, Current: ${currentUserId}`,
        );
        return res.status(403).json({
          message: "You do not have permission to modify permissions",
        });
      }

      const [targetUserCheck] = await connection.execute(
        "SELECT id FROM Users WHERE id = ?",
        [parseInt(userId)],
      );

      if (targetUserCheck.length === 0) {
        console.log(`[setItemPermission] Target user ${userId} not found`);
        return res.status(404).json({ message: "Target user not found" });
      }

      const rootFolderId =
        itemCheck[0].rootFolderId === 0 || itemCheck[0].rootFolderId === null
          ? parseInt(itemId)
          : itemCheck[0].rootFolderId;

      console.log(
        ` [setItemPermission] Setting permissions on root folder: ${rootFolderId}`,
      );

      const [existingPermission] = await connection.execute(
        "SELECT id FROM Permissions WHERE itemId = ? AND userId = ?",
        [rootFolderId, parseInt(userId)],
      );

      console.log(
        `   Existing permission found: ${existingPermission.length > 0}`,
      );

      let query;
      let params;

      if (existingPermission.length > 0) {
        query = `UPDATE Permissions 
                 SET can_view = ?, can_create = ?, can_upload = ?, can_edit = ?, can_delete = ?, updatedAt = NOW() 
                 WHERE itemId = ? AND userId = ?`;
        params = [
          permissionValues.can_view ? 1 : 0,
          permissionValues.can_create ? 1 : 0,
          permissionValues.can_upload ? 1 : 0,
          permissionValues.can_edit ? 1 : 0,
          permissionValues.can_delete ? 1 : 0,
          rootFolderId,
          parseInt(userId),
        ];
      } else {
        query = `INSERT INTO Permissions (itemId, userId, can_view, can_create, can_upload, can_edit, can_delete) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [
          rootFolderId,
          parseInt(userId),
          permissionValues.can_view ? 1 : 0,
          permissionValues.can_create ? 1 : 0,
          permissionValues.can_upload ? 1 : 0,
          permissionValues.can_edit ? 1 : 0,
          permissionValues.can_delete ? 1 : 0,
        ];
      }

      console.log(`   Executing query with params:`, params);

      const result = await connection.execute(query, params);

      console.log(
        ` [setItemPermission] Permission ${existingPermission.length > 0 ? "updated" : "created"} successfully on root folder ${rootFolderId} for user ${userId}`,
      );

      res.status(200).json({
        message: "Permission updated successfully",
        data: {
          rootFolderId,
          userId: parseInt(userId),
          permissions: permissionValues,
        },
      });
    } catch (error) {
      console.error("Database error in setItemPermission:", error);
      console.error("Error code:", error.code, "Error message:", error.message);
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

    console.log(
      ` [removeItemPermission] Request from userId: ${currentUserId}, removing permission for itemId: ${itemId}, targetUserId: ${userId}`,
    );

    if (!itemId || !userId || isNaN(itemId) || isNaN(userId)) {
      console.log("[removeItemPermission] Invalid itemId or userId");
      return res
        .status(400)
        .json({ message: "Valid Item ID and User ID are required" });
    }

    const connection = await pool.getConnection();

    try {
      const [itemCheck] = await connection.execute(
        "SELECT userId, rootFolderId FROM Items WHERE id = ?",
        [parseInt(itemId)],
      );

      if (itemCheck.length === 0) {
        console.log(`[removeItemPermission] Item ${itemId} not found`);
        return res.status(404).json({ message: "Item not found" });
      }

      const itemOwner = itemCheck[0].userId;

      if (itemOwner !== currentUserId) {
        console.log(
          ` [removeItemPermission] Permission denied - not item owner`,
        );
        return res.status(403).json({
          message: "You do not have permission to remove permissions",
        });
      }

      const rootFolderId =
        itemCheck[0].rootFolderId === 0 || itemCheck[0].rootFolderId === null
          ? parseInt(itemId)
          : itemCheck[0].rootFolderId;

      console.log(
        ` [removeItemPermission] Removing permissions from root folder: ${rootFolderId} for user: ${userId}`,
      );

      await connection.execute(
        "DELETE FROM Permissions WHERE itemId = ? AND userId = ?",
        [rootFolderId, parseInt(userId)],
      );

      console.log(
        ` [removeItemPermission] Permission removed successfully from root folder ${rootFolderId}`,
      );

      res.status(200).json({ message: "Permission removed successfully" });
    } catch (error) {
      console.error("Database error in removeItemPermission:", error);
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
