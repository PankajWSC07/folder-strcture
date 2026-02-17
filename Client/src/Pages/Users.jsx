import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Badge } from "primereact/badge";
import { getAllUsers, updateUser, deleteUser } from "../store/authSlice";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

function Users() {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const {
    users,
    isLoading,
    user: currentUser,
    error,
  } = useSelector((state) => state.auth);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error,
        life: 3000,
      });
    }
  }, [error]);

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });
    } else {
      setEditingId(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "user",
      });
    }
    setErrors({});
    setShowDialog(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role,
    };

    if (editingId) {
      dispatch(updateUser({ id: editingId, data: userData }))
        .then((result) => {
          if (result.type === updateUser.fulfilled.type) {
            toast.current?.show({
              severity: "success",
              summary: "Success",
              detail: "User updated successfully",
              life: 3000,
            });
            dispatch(getAllUsers());
            setShowDialog(false);
          } else {
            toast.current?.show({
              severity: "error",
              summary: "Error",
              detail: "Failed to update user",
              life: 3000,
            });
          }
        })
        .catch((error) => {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error?.message || "Failed to update user",
            life: 3000,
          });
        });
    }
  };

  const handleDelete = (rowData) => {
    confirmDialog({
      message: "Are you sure you want to delete this user?",
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        dispatch(deleteUser(rowData.id)).then((result) => {
          if (result.type === deleteUser.fulfilled.type) {
            toast.current?.show({
              severity: "success",
              summary: "Success",
              detail: "User deleted successfully",
              life: 3000,
            });
          }
        });
      },
    });
  };

  const roleBodyTemplate = (rowData) => {
    const severity = rowData.role === "admin" ? "danger" : "success";
    return (
      <Badge value={rowData.role?.toUpperCase()} severity={severity}></Badge>
    );
  };

  const createdAtBodyTemplate = (rowData) => {
    return new Date(rowData.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const actionBodyTemplate = (rowData) => {
    const isRowAdmin = rowData.role === "admin";
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          severity="info"
          disabled={isRowAdmin}
          onClick={() => handleOpenDialog(rowData)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          disabled={isRowAdmin}
          onClick={() => handleDelete(rowData)}
        />
      </div>
    );
  };

  const headerTemplate = () => (
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
        <i className="pi pi-users"></i>
        All Users
      </h3>
      <Badge value={users?.length || 0} severity="info"></Badge>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md text-center py-8">
          <i className="pi pi-spin pi-spinner text-5xl text-blue-600"></i>
          <p className="mt-4 text-gray-600 text-lg">Loading users...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            <i className="pi pi-users mr-2 text-blue-600"></i>
            User Management
          </h1>
          <p className="text-gray-600 text-lg">
            View and manage all registered users
          </p>
        </div>

        {/* Users Table Section */}
        <Card className="shadow-xl rounded-2xl p-0">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <i className="pi pi-list"></i>
              Users Directory
            </h3>
          </div>
          <div className="p-8">
            <DataTable
              value={users}
              header={headerTemplate}
              responsiveLayout="scroll"
              paginator
              rows={10}
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              rowsPerPageOptions={[5, 10, 20]}
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
              emptyMessage="No users found"
              className="p-datatable-striped"
              stripedRows
              style={{ minWidth: "100%" }}
              removableSort
            >
              <Column
                field="firstName"
                header="First Name"
                sortable
                style={{ minWidth: "150px" }}
              />
              <Column
                field="lastName"
                header="Last Name"
                sortable
                style={{ minWidth: "150px" }}
              />
              <Column
                field="email"
                header="Email"
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                field="role"
                header="Role"
                body={roleBodyTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="createdAt"
                header="Joined Date"
                body={createdAtBodyTemplate}
                sortable
                style={{ minWidth: "150px" }}
              />
              <Column
                body={actionBodyTemplate}
                header="Actions"
                style={{ minWidth: "120px" }}
                exportable={false}
              />
            </DataTable>
          </div>
        </Card>

        {/* Edit Dialog */}
        <Dialog
          visible={showDialog}
          onHide={() => setShowDialog(false)}
          header="Edit User"
          modal
          style={{ width: "90vw", maxWidth: "500px" }}
        >
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                First Name *
              </label>
              <InputText
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  setErrors("");
                }}
                placeholder="Enter first name"
                className={`w-full ${errors.firstName ? "p-invalid" : ""}`}
              />
              {errors.firstName && (
                <small className="p-error">{errors.firstName}</small>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Last Name *
              </label>
              <InputText
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  setErrors("");
                }}
                placeholder="Enter last name"
                className={`w-full ${errors.lastName ? "p-invalid" : ""}`}
              />
              {errors.lastName && (
                <small className="p-error">{errors.lastName}</small>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email *
              </label>
              <InputText
                value={formData.email}
                disabled
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors("");
                }}
                placeholder="Enter email"
                className={`w-full ${errors.email ? "p-invalid" : ""}`}
              />
              {errors.email && (
                <small className="p-error">{errors.email}</small>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Role
              </label>
              <Dropdown
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                options={[
                  { label: "User", value: "user" },
                  { label: "Admin", value: "admin" },
                ]}
                className="w-full"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={() => setShowDialog(false)}
                className="p-button-secondary"
              />
              <Button
                label="Update"
                icon="pi pi-check"
                onClick={handleSave}
                className="p-button-info"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

export default Users;
