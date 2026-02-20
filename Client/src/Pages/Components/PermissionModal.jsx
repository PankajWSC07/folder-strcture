import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAvailableUsers,
  fetchItemPermissions,
  updateItemPermission,
  removeItemPermission,
  clearSuccess,
  clearError,
} from "../../store/permissionSlice";
import "./PermissionModal.css";

function PermissionModal({ itemId, itemName, isOwner = false, onClose }) {
  const dispatch = useDispatch();
  const { availableUsers, itemPermissions, loading, error, success } =
    useSelector((state) => state.permissions);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [userPermissions, setUserPermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});

  useEffect(() => {
    dispatch(fetchAvailableUsers());
    dispatch(fetchItemPermissions({ itemId }));
  }, [itemId, dispatch]);

  useEffect(() => {
    const permissionsMap = {};
    itemPermissions.forEach((perm) => {
      permissionsMap[perm.userId] = {
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_upload: perm.can_upload,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
      };
    });

    setUserPermissions(permissionsMap);
    setOriginalPermissions(permissionsMap);
  }, [itemPermissions]);

  const handlePermissionChange = (userId, permissionType) => {
    setUserPermissions((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {
          can_view: false,
          can_create: false,
          can_upload: false,
          can_edit: false,
          can_delete: false,
        }),
        [permissionType]: !(prev[userId]?.[permissionType] || false),
      },
    }));
  };
  const hasChanges = useMemo(() => {
    const allUserIds = new Set([
      ...Object.keys(userPermissions),
      ...Object.keys(originalPermissions),
    ]);

    for (const userId of allUserIds) {
      const current = userPermissions[userId] || {
        can_view: false,
        can_create: false,
        can_upload: false,
        can_edit: false,
        can_delete: false,
      };

      const original = originalPermissions[userId] || {
        can_view: false,
        can_create: false,
        can_upload: false,
        can_edit: false,
        can_delete: false,
      };

      if (JSON.stringify(current) !== JSON.stringify(original)) {
        return true;
      }
    }

    return false;
  }, [userPermissions, originalPermissions]);

  const handleSaveAll = async () => {
    const allUserIds = new Set([
      ...Object.keys(userPermissions),
      ...Object.keys(originalPermissions),
    ]);

    for (const userId of allUserIds) {
      const current = userPermissions[userId] || {
        can_view: false,
        can_create: false,
        can_upload: false,
        can_edit: false,
        can_delete: false,
      };

      const original = originalPermissions[userId] || {
        can_view: false,
        can_create: false,
        can_upload: false,
        can_edit: false,
        can_delete: false,
      };

      const hasChanged = JSON.stringify(current) !== JSON.stringify(original);

      if (hasChanged) {
        const hasAnyPermission = Object.values(current).some((p) => p);

        if (hasAnyPermission) {
          await dispatch(
            updateItemPermission({
              itemId,
              userId,
              ...current,
            }),
          );
        } else {
          await dispatch(removeItemPermission({ itemId, userId }));
        }
      }
    }

    dispatch(fetchItemPermissions({ itemId }));
  };

  const handleCloseModal = () => {
    if (success) dispatch(clearSuccess());
    if (error) dispatch(clearError());
    onClose();
  };

  const getPermissionLabel = (key) => {
    const labels = {
      can_view: "View",
      can_create: "Create",
      can_upload: "Upload",
      can_edit: "Edit",
      can_delete: "Delete",
    };
    return labels[key] || key;
  };

  return (
    <div className="permission-modal-overlay" onClick={handleCloseModal}>
      <div className="permission-modal" onClick={(e) => e.stopPropagation()}>
        <div className="permission-modal-header">
          <h2>
            {isOwner ? "Manage Permissions" : "View Your Permissions"} - {itemName}
          </h2>
          <button className="close-btn" onClick={handleCloseModal}>
            ✕
          </button>
        </div>

        {error && <div className="permission-alert error">{error}</div>}
        {success && <div className="permission-alert success">{success}</div>}

        {loading && !itemPermissions.length ? (
          <div className="permission-loading">Loading...</div>
        ) : (
          <div className="permission-modal-content">
            {!isOwner && (
              <div className="permission-alert info">
                <p>
                  You do not have permission to manage this shared folder's
                  permissions. Below are your current access permissions:
                </p>
              </div>
            )}

            <div className="permission-users-list">
              <h3>{isOwner ? "Users" : "Your Permissions"}</h3>

              {!isOwner && currentUser ? (
                <div className="permission-user-row">
                  <div className="user-info">
                    <div className="user-name">
                      {currentUser.firstName} {currentUser.lastName}
                    </div>
                    <div className="user-email">{currentUser.email}</div>
                  </div>

                  <div className="permission-checkboxes">
                    {[
                      "can_view",
                      "can_create",
                      "can_upload",
                      "can_edit",
                      "can_delete",
                    ].map((permType) => {
                      const userPerms = userPermissions[currentUser.id] || {
                        can_view: false,
                        can_create: false,
                        can_upload: false,
                        can_edit: false,
                        can_delete: false,
                      };

                      return (
                        <label key={permType} className="permission-checkbox">
                          <input
                            type="checkbox"
                            checked={userPerms[permType] || false}
                            disabled={true}
                          />
                          <span>{getPermissionLabel(permType)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : isOwner ? (
                availableUsers.length === 0 ? (
                  <p className="no-users">No other users available</p>
                ) : (
                  availableUsers.map((user) => {
                    const userPerms = userPermissions[user.id] || {
                      can_view: false,
                      can_create: false,
                      can_upload: false,
                      can_edit: false,
                      can_delete: false,
                    };

                    return (
                      <div key={user.id} className="permission-user-row">
                        <div className="user-info">
                          <div className="user-name">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="user-email">{user.email}</div>
                        </div>

                        <div className="permission-checkboxes">
                          {[
                            "can_view",
                            "can_create",
                            "can_upload",
                            "can_edit",
                            "can_delete",
                          ].map((permType) => (
                            <label
                              key={permType}
                              className="permission-checkbox"
                            >
                              <input
                                type="checkbox"
                                checked={userPerms[permType] || false}
                                onChange={() =>
                                  handlePermissionChange(user.id, permType)
                                }
                              />
                              <span>{getPermissionLabel(permType)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )
              ) : null}
            </div>
          </div>
        )}

        <div className="permission-modal-footer">
          <button
            className="btn-save-all"
            onClick={handleSaveAll}
            disabled={loading || !hasChanges || !isOwner}
            title={!isOwner ? "Only the folder owner can modify permissions" : ""}
          >
            {isOwner ? "Save All Changes" : "Read-Only Mode"}
          </button>

          <button className="btn-close" onClick={handleCloseModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PermissionModal;
