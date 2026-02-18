import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFolderStructure,
  fetchFolderChildren,
  createItem,
  deleteItem,
  renameItem,
  clearSuccess,
} from "../../store/folderSlice";
import {
  deleteFile,
  downloadFile,
  clearSuccess as clearFileSuccess,
} from "../../store/fileSlice";
import { fetchItemPermissions } from "../../store/permissionSlice";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import "./FolderManager.css";
import FileUpload from "./FileUpload";
import ImagePreviewModal from "../Components/Preview";
import PermissionModal from "../Components/PermissionModal";

function FolderManager() {
  const dispatch = useDispatch();
  const { folders, childrenMap, filesMap, loading, error, success } =
    useSelector((state) => state.folder);
  const { success: fileSuccess } = useSelector((state) => state.file);

  const { permissions } = useSelector((state) => state.permissions);
  const { error: permissionError, success: permissionSuccess } = useSelector(
    (state) => state.permissions,
  );

  const { user: currentUser } = useSelector((state) => state.auth);
  const currentUserId = currentUser?.id;

  const [openFolders, setOpenFolders] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [createType, setCreateType] = useState("folder");
  const [newItemName, setNewItemName] = useState("");
  const [renameItemId, setRenameItemId] = useState(null);
  const [renameNewName, setRenameNewName] = useState("");
  const [parentIdForCreate, setParentIdForCreate] = useState(null);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [parentToRefresh, setParentToRefresh] = useState(null);
  const [parentOfRenamingItem, setParentOfRenamingItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedItemForPermission, setSelectedItemForPermission] =
    useState(null);
  const [itemPermissions, setItemPermissions] = useState({});

  const fetchedPermissionsRef = React.useRef(new Set());

  useEffect(() => {
    dispatch(fetchFolderStructure());
  }, [dispatch]);

  useEffect(() => {
    if (success && parentToRefresh) {
      if (parentToRefresh === "root") {
        dispatch(fetchFolderStructure());
      } else {
        setOpenFolders((prev) => ({
          ...prev,
          [parentToRefresh]: true,
        }));
        dispatch(fetchFolderChildren(parentToRefresh));
      }
      dispatch(clearSuccess());
      setParentToRefresh(null);
    } else if (success) {
      dispatch(clearSuccess());
    }
  }, [success, dispatch, parentToRefresh]);

  useEffect(() => {
    if (fileSuccess && parentToRefresh) {
      if (parentToRefresh === "root") {
        dispatch(fetchFolderStructure());
      } else {
        setOpenFolders((prev) => ({
          ...prev,
          [parentToRefresh]: true,
        }));
        dispatch(fetchFolderChildren(parentToRefresh));
      }
      dispatch(clearFileSuccess());
      setParentToRefresh(null);
    }
  }, [fileSuccess, dispatch, parentToRefresh]);

  useEffect(() => {
    const fetchPermissionsForFolders = async () => {
      console.log(
        " Permission fetching - itemPermissions is:",
        itemPermissions,
      );

      const allFolderIds = new Set();

      const collectAllDescendants = (folderId) => {
        allFolderIds.add(folderId);
        const children = childrenMap[folderId] || [];
        children.forEach((child) => {
          if (child.type === "folder") {
            collectAllDescendants(child.id);
          } else {
            allFolderIds.add(child.id);
          }
        });
      };

      // Add root folders
      folders.forEach((folder) => {
        allFolderIds.add(folder.id);
      });

      Object.keys(openFolders).forEach((folderId) => {
        const folder = findFolderById(folders, parseInt(folderId));
        if (folder) {
          const children = childrenMap[folderId] || [];
          children.forEach((child) => {
            if (child.type === "folder") {
              collectAllDescendants(child.id);
            } else {
              allFolderIds.add(child.id);
            }
          });
        }
      });

      console.log(" All folder IDs to check permissions for:", allFolderIds);

      for (const folderId of allFolderIds) {
        if (fetchedPermissionsRef.current.has(folderId)) {
          continue;
        }

        let folder = findFolderById(folders, parseInt(folderId));
        if (!folder) {
          for (const parentId of Object.keys(childrenMap)) {
            folder = childrenMap[parentId]?.find(
              (child) => child.id === parseInt(folderId),
            );
            if (folder) break;
          }
        }

        if (folder) {
          try {
            console.log(
              ` Fetching permissions for ${folder.type} ${folderId} (${folder.name})...`,
            );
            const response = await dispatch(
              fetchItemPermissions({ itemId: folderId }),
            );
            fetchedPermissionsRef.current.add(folderId);

            console.log(` API Response for ${folderId}:`, {
              payload: response.payload,
              length: response.payload?.length,
            });

            if (
              response.payload &&
              Array.isArray(response.payload) &&
              response.payload.length > 0
            ) {
              const currentUserPermission = response.payload.find(
                (p) => p.userId === currentUserId,
              );

              if (currentUserPermission) {
                console.log(
                  ` Storing permission object for ${folderId}:`,
                  currentUserPermission,
                );

                setItemPermissions((prev) => ({
                  ...prev,
                  [folderId]: {
                    can_create: Boolean(currentUserPermission.can_create),
                    can_upload: Boolean(currentUserPermission.can_upload),
                    can_edit: Boolean(currentUserPermission.can_edit),
                    can_delete: Boolean(currentUserPermission.can_delete),
                    can_view: Boolean(currentUserPermission.can_view),
                  },
                }));
              } else {
                console.warn(
                  ` No permissions found for current user on ${folderId}, setting defaults`,
                );
                setItemPermissions((prev) => ({
                  ...prev,
                  [folderId]: {
                    can_create: false,
                    can_upload: false,
                    can_edit: false,
                    can_delete: false,
                    can_view: false,
                  },
                }));
              }
            } else {
              console.warn(
                ` No permissions found for ${folderId}, setting defaults`,
              );
              setItemPermissions((prev) => ({
                ...prev,
                [folderId]: {
                  can_create: false,
                  can_upload: false,
                  can_edit: false,
                  can_delete: false,
                  can_view: false,
                },
              }));
            }
          } catch (error) {
            console.error(
              ` Error fetching permissions for ${folderId}:`,
              error,
            );
          }
        }
      }
    };

    if (
      currentUserId &&
      (folders.length > 0 || Object.keys(childrenMap).length > 0)
    ) {
      fetchPermissionsForFolders();
    }
  }, [folders, currentUserId, openFolders, childrenMap, dispatch]);

  const findFolderById = (items, id) => {
    for (let item of items) {
      if (item.id === id) return item;
      const children = childrenMap[item.id] || [];
      const result = findFolderById(children, id);
      if (result) return result;
    }
    return null;
  };

  const hasPermission = (folderId, permissionType) => {
    const folder = findFolderById(folders, folderId);
    if (!folder) return false;

    if (folder.userId === currentUserId) return true;

    const folderPerms = itemPermissions[folderId];
    if (!folderPerms) return false;

    return folderPerms[permissionType] === true;
  };

  const toggleFolder = (folderId) => {
    const isOpen = openFolders[folderId];

    if (!isOpen) {
      if (!childrenMap[folderId]) {
        dispatch(fetchFolderChildren(folderId));
      }
    }

    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !isOpen,
    }));
  };

  const handleCreateClick = (parentId = null) => {
    if (parentId) {
      const targetFolder = findFolderById(folders, parentId);

      if (targetFolder && targetFolder.userId !== currentUserId) {
        const permission = itemPermissions[parentId];
        if (!permission || permission.can_create !== true) {
          alert(
            "You do not have permission to create items in this shared folder",
          );
          return;
        }
      }
    }

    setParentIdForCreate(parentId);
    setCreateType("folder");
    setNewItemName("");
    setShowCreateModal(true);
    setExpandedMenu(null);
  };

  const handleCreateSubmit = () => {
    if (!newItemName.trim()) {
      alert("Please enter a name");
      return;
    }

    console.log("Creating item:", {
      name: newItemName,
      type: createType,
      parentId: parentIdForCreate,
    });

    if (parentIdForCreate) {
      setParentToRefresh(parentIdForCreate);
    } else {
      setParentToRefresh("root");
    }

    dispatch(
      createItem({
        name: newItemName,
        type: createType,
        parentId: parentIdForCreate,
      }),
    );

    setShowCreateModal(false);
    setNewItemName("");
    setParentIdForCreate(null);
  };

  const handleDeleteClick = (itemId) => {
    confirmDialog({
      message: "Are you sure you want to delete this item?",
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        const findParentId = (items, targetId) => {
          for (let item of items) {
            if (item.id === targetId) return item.parentId;
            if (childrenMap[item.id]) {
              const result = findParentId(childrenMap[item.id], targetId);
              if (result !== undefined) return result;
            }
          }
          return null;
        };

        const parentId = findParentId(folders, itemId);
        if (parentId) {
          setParentToRefresh(parentId);
        } else {
          setParentToRefresh("root");
        }

        dispatch(deleteItem(itemId));
        setSelectedItem(null);
      },
      reject: () => {},
    });
  };

  const handleRenameClick = (item) => {
    setRenameItemId(item.id);
    setRenameNewName(item.name);
    setParentOfRenamingItem(item.parentId || "root");
    setShowRenameModal(true);
    setExpandedMenu(null);
  };

  const handleRenameSubmit = () => {
    if (!renameNewName.trim()) {
      alert("Please enter a name");
      return;
    }

    if (parentOfRenamingItem) {
      setParentToRefresh(parentOfRenamingItem);
    }

    dispatch(renameItem({ itemId: renameItemId, name: renameNewName }));
    setShowRenameModal(false);
    setRenameItemId(null);
    setRenameNewName("");
    setParentOfRenamingItem(null);
  };

  const handleDeleteFile = (fileId, parentId) => {
    confirmDialog({
      message: "Are you sure you want to delete this file?",
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",

      accept: () => {
        if (parentId) {
          setParentToRefresh(parentId);
        } else {
          setParentToRefresh("root");
        }
        dispatch(deleteFile(fileId));
      },
      reject: () => {},
    });
  };

  const handleDownloadFile = (file) => {
    dispatch(downloadFile({ fileId: file.id, fileName: file.originalName }));
  };

  const handlePreviewFile = (file) => {
    const isPdfFile =
      file.mimeType === "application/pdf" ||
      file.originalName?.toLowerCase().endsWith(".pdf");

    if (isPdfFile) {
      const pdfUrl = `http://localhost:5000${file.filePath}`;
      window.open(pdfUrl, "_blank");
    } else if (isImageFile(file.mimeType)) {
      setPreviewFile(file);
    }
  };

  const isImageFile = (mimeType) => {
    return mimeType && mimeType.startsWith("image/");
  };

  const isPdfFile = (mimeType, fileName) => {
    return (
      mimeType === "application/pdf" ||
      (fileName && fileName.toLowerCase().endsWith(".pdf"))
    );
  };

  const getItemIcon = (item) => {
    if (item.type === "folder") {
      return openFolders[item.id] ? "📂" : "📁";
    }

    let ext = item.extension?.toLowerCase() || "";
    if (!ext && item.originalName) {
      ext = item.originalName
        .substring(item.originalName.lastIndexOf("."))
        .toLowerCase();
    }
    const fileIcons = {
      ".js": "📜",
      ".py": "🐍",
      ".html": "🌐",
      ".css": "🎨",
      ".json": "📋",
      ".txt": "📄",
      ".pdf": "📕",
      ".jpg": "🖼️",
      ".png": "🖼️",
      ".zip": "📦",
    };
    return fileIcons[ext] || "📄";
  };

  const popUpHandler = (folderId) => {
    let folder = folders.find((f) => f.id === folderId);

    if (!folder) {
      for (const parentId of Object.keys(childrenMap)) {
        folder = childrenMap[parentId]?.find((child) => child.id === folderId);
        if (folder) break;
      }
    }

    if (!folder) {
      alert("Folder not found");
      return;
    }
    setSelectedItemForPermission(folder);
    setShowPermissionModal(true);
  };

  const renderFolder = (folder, level = 0) => {
    const isOpen = openFolders[folder.id];
    const children = childrenMap[folder.id] || [];
    const isLoading = loading[folder.id] || false;
    const isSelected = selectedItem?.id === folder.id;
    const CreateDate = new Date(folder.createdAt).toISOString().split("T")[0];

    const isOwner = folder.userId === currentUserId;

    const folderPerms = itemPermissions[folder.id] || {};
    const canCreate = isOwner || Boolean(folderPerms.can_create);
    const canUpload = isOwner || Boolean(folderPerms.can_upload);
    const canEdit = isOwner || Boolean(folderPerms.can_edit);
    const canDelete = isOwner || Boolean(folderPerms.can_delete);
    const name = folderPerms?.firstName ? folderPerms.firstName : "NA";
    console.log(name);

    // if (!isOwner) {
    //   console.log(`Folder "${folder.name}" (ID: ${folder.id}) - Perms:`, {
    //     isOwner,
    //     folderPerms,
    //     canCreate,
    //     canUpload,
    //     canEdit,
    //     canDelete,
    //   });
    // }

    return (
      <div key={folder.id} className="folder-item-wrapper">
        <div
          className={`folder-item ${isSelected ? "selected" : ""}`}
          style={{ paddingLeft: `${level * 20}px` }}
        >
          <div className="folder-content">
            {folder.type === "folder" && (
              <button
                className="toggle-btn"
                onClick={() => toggleFolder(folder.id)}
              >
                {isOpen ? "▼" : "▶"}
              </button>
            )}

            <span className="folder-icon">{getItemIcon(folder)}</span>

            <span
              className="folder-name"
              onClick={() => setSelectedItem(folder)}
            >
              {folder.name}
            </span>
             
            <div className="folder-inline-actions">
              <span className="mt-2 mr-4">{folder.creatorName || "NA"}</span>
              <span className="mt-2 mr-4">{`${CreateDate || "NA"}`}</span>

              {isOwner && (
                <button
                  className="action-icon-btn mr-2"
                  title="Manage permissions"
                  onClick={() => popUpHandler(folder.id)}
                >
                  <i className="pi pi-lock"></i>
                </button>
              )}

              {!isOwner && (
                <span
                  className="lock-indicator"
                  title="This is a shared folder"
                  onClick={() => {
                    popUpHandler(folder.id);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  🔒
                </span>
              )}
              {folder.type === "folder" && canCreate && (
                <button
                  className="action-icon-btn"
                  title="Add subfolder"
                  onClick={() => handleCreateClick(folder.id)}
                >
                  <i className="pi pi-plus"></i>
                </button>
              )}
              {folder.type === "folder" && canUpload && (
                <FileUpload
                  parentId={folder.id}
                  onUploadSuccess={() => {
                    setOpenFolders((prev) => ({
                      ...prev,
                      [folder.id]: true,
                    }));
                    dispatch(fetchFolderChildren(folder.id));
                  }}
                />
              )}
              {canEdit && (
                <button
                  className="action-icon-btn"
                  title="Edit"
                  onClick={() => handleRenameClick(folder)}
                >
                  <i className="pi pi-file-edit"></i>
                </button>
              )}
              {canDelete && (
                <button
                  className="action-icon-btn delete-icon"
                  title="Delete"
                  onClick={() => handleDeleteClick(folder.id)}
                >
                  <i className="pi pi-trash"></i>
                </button>
              )}
            </div>
          </div>

          {isOpen && !childrenMap.hasOwnProperty(folder.id) && isLoading && (
            <div className="loading-indicator">Loading...</div>
          )}

          {isOpen &&
            childrenMap.hasOwnProperty(folder.id) &&
            children.length === 0 &&
            (!filesMap[folder.id] || filesMap[folder.id].length === 0) && (
              <div
                className="no-folder"
                style={{ paddingLeft: `${(level + 1) * 20}px` }}
              >
                No folder or file
              </div>
            )}

          {isOpen && children.map((child) => renderFolder(child, level + 1))}

          {/* Render files in folder */}
          {isOpen &&
            filesMap[folder.id] &&
            filesMap[folder.id].length > 0 &&
            filesMap[folder.id].map((file) => (
              <div key={`file-${file.id}`} className="folder-item-wrapper">
                <div
                  className="folder-item"
                  style={{ paddingLeft: `${(level + 1) * 20}px` }}
                >
                  <div className="folder-content">
                    <span className="folder-icon">{getItemIcon(file)}</span>
                    <span className="folder-name">
                      {file.originalName || file.name}
                    </span>
                    <div className="folder-inline-actions">
                      <span className="mt-2">
                        {`${new Date(file.createdAt).toISOString().split("T")[0]} - ${file.creatorName || "NA"}`}
                      </span>
                      {(isImageFile(file.mimeType) ||
                        isPdfFile(file.mimeType, file.originalName)) && (
                        <button
                          className="action-icon-btn preview-icon"
                          title="Preview"
                          onClick={() => handlePreviewFile(file)}
                        >
                          👁️
                        </button>
                      )}
                      <button
                        className="action-icon-btn download-icon"
                        title="Download"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <i className="pi pi-download"></i>
                      </button>
                      <button
                        className="action-icon-btn delete-icon"
                        title="Delete"
                        onClick={() => handleDeleteFile(file.id, folder.id)}
                      >
                        <i className="pi pi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);

  const handleReloadFolders = () => {
    dispatch(fetchFolderStructure());
  };

  return (
    <div className="folder-manager">
      <div className="folder-manager-header">
        <h2>📁 Folder Structure</h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            className="btn-primary"
            onClick={() => handleCreateClick(null)}
          >
            <i className="pi pi-plus"></i> New Folder
          </button>
          <button
            className="btn-primary"
            onClick={handleReloadFolders}
            title="Reload folders to update changes"
          >
            <i className="pi pi-refresh"></i> Reload
          </button>
        </div>
      </div>

      {error && <div className="error-message">❌ Error: {error}</div>}

      <div className="folder-tree">
        {rootFolders.length === 0 &&
          !error &&
          (!filesMap[null] || filesMap[null].length === 0) && (
            <div className="empty-state">
              <p>No folders...</p>
              <button
                className="btn-primary"
                onClick={() => handleCreateClick(null)}
              >
                <i className="pi pi-plus"></i> Create First Folder
              </button>
            </div>
          )}

        {rootFolders.map((folder) => renderFolder(folder))}

        {/* Render root level files */}
        {filesMap[null] &&
          filesMap[null].length > 0 &&
          filesMap[null].map((file) => (
            <div key={`file-${file.id}`} className="folder-item-wrapper">
              <div className="folder-item" style={{ paddingLeft: "0px" }}>
                <div className="folder-content">
                  <span className="folder-icon">{getItemIcon(file)}</span>
                  <span className="folder-name">
                    {file.originalName || file.name}
                  </span>
                  <div className="folder-inline-actions">
                    <span className="mt-2">
                      {`${new Date(file.createdAt).toISOString().split("T")[0]} - ${file.creatorName || "NA"}`}
                    </span>
                    {(isImageFile(file.mimeType) ||
                      isPdfFile(file.mimeType, file.originalName)) && (
                      <button
                        className="action-icon-btn preview-icon"
                        title="Preview"
                        onClick={() => handlePreviewFile(file)}
                      >
                        👁️
                      </button>
                    )}
                    <button
                      className="action-icon-btn download-icon"
                      title="Download"
                      onClick={() => handleDownloadFile(file)}
                    >
                      <i className="pi pi-download"></i>
                    </button>
                    <button
                      className="action-icon-btn delete-icon"
                      title="Delete"
                      onClick={() => handleDeleteFile(file.id, null)}
                    >
                      <i className="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New {createType === "folder" ? "Folder" : "File"}</h3>

            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Enter ${createType} name`}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleCreateSubmit();
                }}
              />
            </div>

            <div className="form-group">
              <label>Type:</label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
              >
                <option value="folder">Folder</option>
                <option value="file">File</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCreateSubmit}>
                Create
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRenameModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rename Item</h3>

            <div className="form-group">
              <label>New Name:</label>
              <input
                type="text"
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                placeholder="Enter new name"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleRenameSubmit}>
                Rename
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowRenameModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <ImagePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {showPermissionModal && selectedItemForPermission && (
        <PermissionModal
          itemId={selectedItemForPermission.id}
          itemName={selectedItemForPermission.name}
          isOwner={selectedItemForPermission.userId === currentUserId}
          onClose={async () => {
            setShowPermissionModal(false);

            if (selectedItemForPermission.id) {
              try {
                const response = await dispatch(
                  fetchItemPermissions({
                    itemId: selectedItemForPermission.id,
                  }),
                );
                if (response.payload && response.payload.length > 0) {
                  const currentUserPermission = response.payload.find(
                    (p) => p.userId === currentUserId,
                  );
                  if (currentUserPermission) {
                    setItemPermissions((prev) => ({
                      ...prev,
                      [selectedItemForPermission.id]: {
                        can_create: Boolean(currentUserPermission.can_create),
                        can_upload: Boolean(currentUserPermission.can_upload),
                        can_edit: Boolean(currentUserPermission.can_edit),
                        can_delete: Boolean(currentUserPermission.can_delete),
                        can_view: Boolean(currentUserPermission.can_view),
                      },
                    }));
                  } else {
                    setItemPermissions((prev) => ({
                      ...prev,
                      [selectedItemForPermission.id]: {
                        can_create: false,
                        can_upload: false,
                        can_edit: false,
                        can_delete: false,
                        can_view: false,
                      },
                    }));
                  }
                } else {
                  setItemPermissions((prev) => ({
                    ...prev,
                    [selectedItemForPermission.id]: {
                      can_create: false,
                      can_upload: false,
                      can_edit: false,
                      can_delete: false,
                      can_view: false,
                    },
                  }));
                }
              } catch (error) {
                console.error("Error refetching permissions:", error);
              }
            }

            setSelectedItemForPermission(null);
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
}

export default FolderManager;
