const { pool } = require("../config/db");

const VALID_EXTENSIONS = {
  // Programming Languages
  ".js": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript React",
  ".jsx": "JavaScript React",
  ".py": "Python",
  ".java": "Java",
  ".cpp": "C++",
  ".c": "C",
  ".cs": "C#",
  ".rb": "Ruby",
  ".go": "Go",
  ".rs": "Rust",
  ".php": "PHP",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".scala": "Scala",
  ".r": "R",
  ".lua": "Lua",
  ".pl": "Perl",
  ".sh": "Shell Script",
  ".bash": "Bash",
  ".groovy": "Groovy",
  ".gradle": "Gradle",
  ".m": "Objective-C",
  ".mm": "Objective-C++",
  ".h": "C Header",
  ".hpp": "C++ Header",
  ".vb": "Visual Basic",
  ".vbs": "VBScript",
  ".ps1": "PowerShell",
  ".asm": "Assembly",
  ".clj": "Clojure",
  ".cljs": "ClojureScript",
  ".ex": "Elixir",
  ".exs": "Elixir Script",
  ".erl": "Erlang",
  ".hrl": "Erlang Header",
  ".fs": "F#",
  ".fsx": "F# Script",
  ".fsi": "F# Interface",
  ".ml": "OCaml",
  ".mli": "OCaml Interface",
  ".hs": "Haskell",
  ".lhs": "Literate Haskell",
  ".jl": "Julia",
  ".nim": "Nim",
  ".nims": "Nim Script",
  ".d": "D Language",
  ".dart": "Dart",
  ".pas": "Pascal",
  ".pp": "Pascal",
  ".s": "Assembly",

  // Markup & Web
  ".html": "HTML",
  ".htm": "HTML",
  ".xml": "XML",
  ".xhtml": "XHTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "SASS",
  ".less": "LESS",
  ".json": "JSON",
  ".jsonc": "JSON with Comments",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".ini": "INI",
  ".cfg": "Configuration",
  ".conf": "Configuration",
  ".config": "Configuration",
  ".properties": "Properties",

  // Documents & Text
  ".pdf": "PDF",
  ".txt": "Plain Text",
  ".md": "Markdown",
  ".markdown": "Markdown",
  ".rst": "reStructuredText",
  ".tex": "LaTeX",
  ".doc": "Word Document",
  ".docx": "Word Document",
  ".odt": "OpenDocument Text",
  ".rtf": "Rich Text Format",
  ".csv": "CSV",
  ".tsv": "TSV",
  ".xlsx": "Excel Spreadsheet",
  ".xls": "Excel Spreadsheet",
  ".ods": "OpenDocument Spreadsheet",

  // Images
  ".jpg": "JPEG Image",
  ".jpeg": "JPEG Image",
  ".png": "PNG Image",
  ".gif": "GIF Image",
  ".svg": "SVG Image",
  ".ico": "Icon",
  ".webp": "WebP Image",
  ".bmp": "Bitmap Image",
  ".tiff": "TIFF Image",
  ".tif": "TIFF Image",
  ".psd": "Photoshop",
  ".ai": "Adobe Illustrator",

  // Archives & Compression
  ".zip": "ZIP Archive",
  ".rar": "RAR Archive",
  ".7z": "7-Zip Archive",
  ".tar": "TAR Archive",
  ".gz": "GZIP Archive",
  ".tar.gz": "TAR GZIP Archive",
  ".bz2": "BZIP2 Archive",
  ".xz": "XZ Archive",

  // Data & Database
  ".sql": "SQL Script",
  ".db": "Database",
  ".sqlite": "SQLite Database",
  ".sqlite3": "SQLite Database",
  ".mdb": "Microsoft Access",

  // Other Common Files
  ".env": "Environment Variables",
  ".gitignore": "Git Ignore",
  ".gitattributes": "Git Attributes",
  ".editorconfig": "Editor Config",
  ".eslintrc": "ESLint Config",
  ".prettierrc": "Prettier Config",
  ".babelrc": "Babel Config",
  ".npmrc": "NPM Config",
  ".yarnrc": "Yarn Config",
  ".log": "Log File",
  ".lock": "Lock File",
  ".map": "Source Map",
  ".min.js": "Minified JavaScript",
  ".min.css": "Minified CSS",
};

const validateFileExtension = (filename) => {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return VALID_EXTENSIONS.hasOwnProperty(ext) ? ext : null;
};

  exports.createItem = async (req, res) => {
  try {
    const { name, type, parentId } = req.body;
    const userId = req.userId;

    console.log("Creating item - Request data:", {
      name,
      type,
      parentId,
      userId,
    });

    if (!name || !type || !["folder", "file"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid input. Name and type are required." });
    }

    const connection = await pool.getConnection();

    try {
      let extension = null;
      if (type === "file") {
        extension = validateFileExtension(name);
        if (!extension) {
          const supportedExts = Object.keys(VALID_EXTENSIONS)
            .slice(0, 10)
            .join(", ");
          return res.status(400).json({
            message: `Invalid file extension. Examples: ${supportedExts}...`,
          });
        }
      }

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

      if (parentId) {
        const [ownFolders] = await connection.execute(
          "SELECT id, type, userId FROM Items WHERE id = ? AND userId = ? AND type = ?",
          [parentId, userId, "folder"],
        );

        if (ownFolders.length > 0) {
          const now = new Date().toISOString().slice(0, 19).replace("T", " ");
          const [result] = await connection.execute(
            "INSERT INTO Items (name, type, userId, parentId, rootFolderId, extension, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [name, type, userId, parentId || null, rootFolderId, extension, now, now],
          );

          return res.status(201).json({
            message: `${type === "folder" ? "Folder" : "File"} created successfully`,
            item: {
              id: result.insertId,
              name,
              type,
              userId,
              parentId: parentId || null,
              rootFolderId,
              extension,
              createdAt: now,
              updatedAt: now,
            },
          });
        }

 
        const [sharedFolder] = await connection.execute(
          `SELECT i.id, i.type, i.userId 
           FROM Items i
           INNER JOIN Permissions p ON i.id = p.itemId
           WHERE i.id = ? AND p.userId = ? AND p.can_create = 1 AND i.type = ?`,
          [rootFolderId, userId, "folder"],
        );

        if (sharedFolder.length === 0) {
          console.log(
            `[createItem] Permission check failed for userId: ${userId}, parentId: ${parentId}, rootFolderId: ${rootFolderId}`,
          );
          return res.status(403).json({
            message:
              "You do not have permission to create items in this folder",
          });
        }

        const parentOwnerUserId = sharedFolder[0].userId;
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const [result] = await connection.execute(
          "INSERT INTO Items (name, type, userId, parentId, rootFolderId, extension, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [name, type, parentOwnerUserId, parentId || null, rootFolderId, extension, now, now],
        );

        const newItemId = result.insertId;

        console.log(
          ` [createItem] Created new ${type} (${newItemId}) with rootFolderId: ${rootFolderId}, parentOwner: ${parentOwnerUserId}, creator: ${userId}`,
        );

        if (userId !== parentOwnerUserId) {
          console.log(` [createItem] Fetching creator's permissions on rootFolderId (${rootFolderId})...`);
          const [creatorPerms] = await connection.execute(
            `SELECT can_view, can_create, can_upload, can_edit, can_delete FROM Permissions 
             WHERE itemId = ? AND userId = ?`,
            [rootFolderId, userId],
          );

          if (creatorPerms.length > 0) {
            const perm = creatorPerms[0];
            console.log(
              ` [createItem] Auto-granting creator (${userId}) the same permissions on rootFolderId (${rootFolderId}):`,
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

        return res.status(201).json({
          message: `${type === "folder" ? "Folder" : "File"} created successfully`,
          item: {
            id: newItemId,
            name,
            type,
            userId: parentOwnerUserId,
            parentId: parentId || null,
            rootFolderId,
            extension,
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const [result] = await connection.execute(
        "INSERT INTO Items (name, type, userId, parentId, rootFolderId, extension, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [name, type, userId, parentId || null, rootFolderId, extension, now, now],
      );

      const newItemId = result.insertId;

      res.status(201).json({
        message: `${type === "folder" ? "Folder" : "File"} created successfully`,
        item: {
          id: newItemId,
          name,
          type,
          userId,
          parentId: parentId || null,
          rootFolderId,
          extension,
          createdAt: now,
          updatedAt: now,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ message: "Error creating item" });
  }
};
  
exports.getFolderStructure = async (req, res) => {
  try {
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      console.log(
        ` [getFolderStructure] Fetching structure for user ${userId}`,
      );

      const query = `
        SELECT i.id, i.name, i.type, i.parentId, i.rootFolderId, i.extension, i.createdAt, i.userId, 
        u.firstName as creatorName,
        NULL as filePath, NULL as originalName, NULL as size, NULL as mimeType
        FROM Items i
        JOIN Users u ON i.userId = u.id
        WHERE i.parentId IS NULL AND (
          i.userId = ? 
          OR i.id IN (SELECT itemId FROM Permissions WHERE userId = ? AND can_view = 1)
        )
        
        UNION ALL
        
        SELECT f.id, f.name, 'file' as type, f.parentId, f.rootFolderId, NULL as extension, f.createdAt, f.userId,
        u.firstName as creatorName,
        f.filePath, f.originalName, f.size, f.mimeType
        FROM Files f
        JOIN Users u ON f.userId = u.id
        WHERE f.parentId IS NULL AND (
          f.userId = ?
          OR f.id IN (SELECT fileId FROM Permissions WHERE userId = ? AND can_view = 1)
        )
        
        ORDER BY type DESC, name ASC
      `;

      const [items] = await connection.execute(query, [
        userId,
        userId,
        userId,
        userId,
      ]);

      // Fetch permissions for each item
      const itemsWithPermissions = await Promise.all(
        items.map(async (item) => {
          const rootFolderId =
            item.rootFolderId === 0 || item.rootFolderId === null
              ? item.id
              : item.rootFolderId;

          const isOwner = item.userId === userId;

          let permissionQuery;
          let permissionParams;

          if (isOwner) {
            permissionQuery = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                              p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                       FROM Permissions p
                       JOIN Users u ON p.userId = u.id
                       WHERE p.itemId = ?
                       ORDER BY u.firstName, u.lastName`;
            permissionParams = [rootFolderId];
          } else {
            permissionQuery = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                              p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                       FROM Permissions p
                       JOIN Users u ON p.userId = u.id
                       WHERE p.itemId = ? AND p.userId = ?`;
            permissionParams = [rootFolderId, userId];
          }

          try {
            const [permissions] = await connection.execute(
              permissionQuery,
              permissionParams,
            );

            const convertedPermissions = permissions.map((p) => ({
              ...p,
              can_view: Boolean(p.can_view),
              can_create: Boolean(p.can_create),
              can_upload: Boolean(p.can_upload),
              can_edit: Boolean(p.can_edit),
              can_delete: Boolean(p.can_delete),
            }));

            return {
              ...item,
              permissions: convertedPermissions,
            };
          } catch (error) {
            console.error(
              ` Error fetching permissions for item ${item.id}:`,
              error,
            );
            return {
              ...item,
              permissions: [],
            };
          }
        }),
      );

      console.log(
        ` [getFolderStructure] Returning ${itemsWithPermissions.length} root items for user ${userId}`,
      );

      res.status(200).json({
        message: "Folder structure retrieved successfully",
        data: itemsWithPermissions,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching folder structure:", error);
    res.status(500).json({ message: "Error fetching folder structure" });
  }
};

exports.getItemsByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    const userId = req.userId;

    const connection = await pool.getConnection();

    try {
      if (!parentId || parentId === "null") {
        console.log(
          ` [getItemsByParent] Getting root items for user ${userId}`,
        );

        const [rootItems] = await connection.execute(
          `
          SELECT i.id, i.name, i.type, i.parentId, i.rootFolderId, i.extension, i.createdAt, i.userId,
          u.firstName as creatorName,
          NULL as filePath, NULL as originalName, NULL as size, NULL as mimeType
          FROM Items i
          JOIN Users u ON i.userId = u.id
          WHERE i.parentId IS NULL AND (
            i.userId = ? OR i.id IN (
              SELECT itemId FROM Permissions WHERE userId = ? AND can_view = 1
            )
          )
          ORDER BY i.type DESC, i.name ASC
          `,
          [userId, userId],
        );

        const [rootFiles] = await connection.execute(
          `
          SELECT f.id, f.name, 'file' as type, f.parentId, f.rootFolderId,
          NULL as extension, f.createdAt, f.userId,
          u.firstName as creatorName,
          f.filePath, f.originalName, f.size, f.mimeType
          FROM Files f
          JOIN Users u ON f.userId = u.id
          WHERE f.parentId IS NULL AND (
            f.userId = ? OR f.id IN (
              SELECT fileId FROM Permissions WHERE userId = ? AND can_view = 1
            )
          )
          ORDER BY f.name ASC
          `,
          [userId, userId],
        );

        const data = [...rootItems, ...rootFiles];

        // Fetch permissions for each root item
        const dataWithPermissions = await Promise.all(
          data.map(async (item) => {
            const rootFolderId =
              item.rootFolderId === 0 || item.rootFolderId === null
                ? item.id
                : item.rootFolderId;

            const isOwner = item.userId === userId;

            let permissionQuery;
            let permissionParams;

            if (isOwner) {
              permissionQuery = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                                p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                         FROM Permissions p
                         JOIN Users u ON p.userId = u.id
                         WHERE p.itemId = ?
                         ORDER BY u.firstName, u.lastName`;
              permissionParams = [rootFolderId];
            } else {
              permissionQuery = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                                p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                         FROM Permissions p
                         JOIN Users u ON p.userId = u.id
                         WHERE p.itemId = ? AND p.userId = ?`;
              permissionParams = [rootFolderId, userId];
            }

            try {
              const [permissions] = await connection.execute(
                permissionQuery,
                permissionParams,
              );

              const convertedPermissions = permissions.map((p) => ({
                ...p,
                can_view: Boolean(p.can_view),
                can_create: Boolean(p.can_create),
                can_upload: Boolean(p.can_upload),
                can_edit: Boolean(p.can_edit),
                can_delete: Boolean(p.can_delete),
              }));

              return {
                ...item,
                permissions: convertedPermissions,
              };
            } catch (error) {
              console.error(
                ` Error fetching permissions for item ${item.id}:`,
                error,
              );
              return {
                ...item,
                permissions: [],
              };
            }
          }),
        );

        return res.status(200).json({
          message: "Root items retrieved successfully",
          data: dataWithPermissions,
        });
      }

      const accessQuery = `
      WITH RECURSIVE folder_path AS (
          SELECT id, parentId, userId
          FROM Items
          WHERE id = ?

          UNION ALL

          SELECT i.id, i.parentId, i.userId
          FROM Items i
          INNER JOIN folder_path fp ON fp.parentId = i.id
      )

      SELECT COUNT(*) as hasAccess
      FROM folder_path fp
      LEFT JOIN Permissions p 
          ON p.itemId = fp.id 
          AND p.userId = ?
          AND p.can_view = 1
      WHERE 
          fp.userId = ?  -- owner
          OR p.itemId IS NOT NULL
      LIMIT 1;
      `;

      const [accessResult] = await connection.execute(accessQuery, [
        parentId,
        userId,
        userId,
      ]);

      if (accessResult[0].hasAccess === 0) {
        return res.status(403).json({
          message: "Access denied to this folder",
        });
      }

      const [items] = await connection.execute(
        `
        SELECT i.id, i.name, i.type, i.parentId, i.rootFolderId, i.extension, i.createdAt, i.userId,
        u.firstName as creatorName,
        NULL as filePath, NULL as originalName, NULL as size, NULL as mimeType
        FROM Items i
        JOIN Users u ON i.userId = u.id
        WHERE i.parentId = ?
        ORDER BY i.type DESC, i.name ASC
        `,
        [parentId],
      );

      const [files] = await connection.execute(
        `
        SELECT f.id, f.name, 'file' as type, f.parentId, f.rootFolderId,
        NULL as extension, f.createdAt, f.userId,
        u.firstName as creatorName,
        f.filePath, f.originalName, f.size, f.mimeType
        FROM Files f
        JOIN Users u ON f.userId = u.id
        WHERE f.parentId = ?
        ORDER BY f.name ASC
        `,
        [parentId],
      );

      const data = [...items, ...files].sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === "folder" ? -1 : 1;
      });

      // Fetch permissions for each item
      const dataWithPermissions = await Promise.all(
        data.map(async (item) => {
          const rootFolderId =
            item.rootFolderId === 0 || item.rootFolderId === null
              ? item.id
              : item.rootFolderId;

          const isOwner = item.userId === userId;

          let permissionQuery;
          let permissionParams;

          if (isOwner) {
            permissionQuery = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                              p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                       FROM Permissions p
                       JOIN Users u ON p.userId = u.id
                       WHERE p.itemId = ?
                       ORDER BY u.firstName, u.lastName`;
            permissionParams = [rootFolderId];
          } else {
            permissionQuery = `SELECT p.id, p.userId, u.firstName, u.lastName, u.email,
                              p.can_view, p.can_create, p.can_upload, p.can_edit, p.can_delete
                       FROM Permissions p
                       JOIN Users u ON p.userId = u.id
                       WHERE p.itemId = ? AND p.userId = ?`;
            permissionParams = [rootFolderId, userId];
          }

          try {
            const [permissions] = await connection.execute(
              permissionQuery,
              permissionParams,
            );

            const convertedPermissions = permissions.map((p) => ({
              ...p,
              can_view: Boolean(p.can_view),
              can_create: Boolean(p.can_create),
              can_upload: Boolean(p.can_upload),
              can_edit: Boolean(p.can_edit),
              can_delete: Boolean(p.can_delete),
            }));

            return {
              ...item,
              permissions: convertedPermissions,
            };
          } catch (error) {
            console.error(
              ` Error fetching permissions for item ${item.id}:`,
              error,
            );
            return {
              ...item,
              permissions: [],
            };
          }
        }),
      );

      res.status(200).json({
        message: "Items retrieved successfully",
        data: dataWithPermissions,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const path = require("path");
const fs = require("fs");

exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;
    const connection = await pool.getConnection();

    try {
      const [items] = await connection.execute(
        `SELECT i.id, i.type, i.userId, i.rootFolderId FROM Items i
         WHERE i.id = ? AND (i.userId = ? OR i.rootFolderId IN (
           SELECT itemId FROM Permissions WHERE userId = ? AND can_delete = 1
         ) OR i.id IN (
           SELECT itemId FROM Permissions WHERE userId = ? AND can_delete = 1
         ))`,
        [itemId, userId, userId, userId],
      );

      if (items.length === 0) {
        console.log(
          ` [deleteItem] User ${userId} not authorized to delete item ${itemId}`,
        );
        return res
          .status(403)
          .json({ message: "Item not found or unauthorized" });
      }

      console.log(` [deleteItem] Deleting item ${itemId} by user ${userId}`);

      const item = items[0];
      // const isOwner = item.userId === userId;

      if (item.type === "folder") {
        const deleteChildren = async (parentId) => {
          const [children] = await connection.execute(
            "SELECT id, type FROM Items WHERE parentId = ?",
            [parentId],
          );

          for (const child of children) {
            if (child.type === "folder") {
              await deleteChildren(child.id);
            }
            await connection.execute("DELETE FROM Items WHERE id = ?", [
              child.id,
            ]);
          }

          const [uploadedFiles] = await connection.execute(
            "SELECT filePath FROM Files WHERE parentId = ?",
            [parentId],
          );

          for (const file of uploadedFiles) {
            const uploadsDir = path.join(__dirname, "../Uploads");
            const filePath = path.join(
              uploadsDir,
              path.basename(file.filePath),
            );
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }

          await connection.execute("DELETE FROM Files WHERE parentId = ?", [
            parentId,
          ]);
        };

        await deleteChildren(itemId);

        const [directFiles] = await connection.execute(
          "SELECT filePath FROM Files WHERE parentId = ?",
          [itemId],
        );

        for (const file of directFiles) {
          const uploadsDir = path.join(__dirname, "../Uploads");
          const filePath = path.join(uploadsDir, path.basename(file.filePath));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        await connection.execute("DELETE FROM Files WHERE parentId = ?", [
          itemId,
        ]);
      }

      await connection.execute("DELETE FROM Items WHERE id = ?", [itemId]);

      res.status(200).json({
        message: "Item deleted successfully",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Error deleting item" });
  }
};

exports.renameItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const connection = await pool.getConnection();

    try {
      const [items] = await connection.execute(
        `SELECT i.id, i.type, i.rootFolderId FROM Items i
         WHERE i.id = ? AND (i.userId = ? OR i.rootFolderId IN (
           SELECT itemId FROM Permissions WHERE userId = ? AND can_edit = 1
         ) OR i.id IN (
           SELECT itemId FROM Permissions WHERE userId = ? AND can_edit = 1
         ))`,
        [itemId, userId, userId, userId],
      );

      if (items.length === 0) {
        console.log(
          ` [renameItem] User ${userId} not authorized to rename item ${itemId}`,
        );
        return res
          .status(403)
          .json({ message: "Item not found or unauthorized" });
      }

      console.log(
        ` [renameItem] Renaming item ${itemId} to "${name}" by user ${userId}`,
      );

      const item = items[0];
      let extension = null;

      if (item.type === "file") {
        extension = validateFileExtension(name);
        if (!extension) {
          const supportedExts = Object.keys(VALID_EXTENSIONS)
            .slice(0, 10)
            .join(", ");
          return res.status(400).json({
            message: "Invalid file extension",
          });
        }
      }

      await connection.execute(
        "UPDATE Items SET name = ?, extension = ? WHERE id = ?",
        [name, extension, itemId],
      );

      const [updatedItems] = await connection.execute(
        "SELECT id, name, type, parentId, extension, createdAt FROM Items WHERE id = ?",
        [itemId],
      );

      res.status(200).json({
        message: "Item renamed successfully",
        item: updatedItems[0],
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error renaming item:", error);
    res.status(500).json({ message: "Error renaming item" });
  }
};
