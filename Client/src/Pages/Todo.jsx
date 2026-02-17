import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../store/todoSlice";

function Todo() {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const { todos, isLoading, error } = useSelector((state) => state.todo);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    todo: "",
    description: "",
    date: null,
    status: "pending",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(getAllTodos());
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

  const handleOpenDialog = (todo = null) => {
    if (todo) {
      setEditingId(todo.id);
      setFormData({
        todo: todo.todo,
        description: todo.description,
        date: new Date(todo.date),
        status: todo.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        todo: "",
        description: "",
        date: new Date(),
        status: "pending",
      });
    }
    setErrors({});
    setShowDialog(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.todo.trim()) newErrors.todo = "Task is required";
    if (!formData.date) newErrors.date = "Due date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;

    const todoData = {
      todo: formData.todo,
      description: formData.description,
      date: formData.date,
      status: formData.status,
    };

    if (editingId) {
      dispatch(updateTodo({ id: editingId, data: todoData })).then(() => {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Todo updated successfully",
          life: 3000,
        });
        setShowDialog(false);
      });
    } else {
      dispatch(createTodo(todoData)).then(() => {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Todo created successfully",
          life: 3000,
        });
        setShowDialog(false);
      });
    }
  };

  const handleDelete = (id) => {
    confirmDialog({
      message: "Are you sure you want to delete this todo?",
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        dispatch(deleteTodo(id)).then(() => {
          toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Todo deleted successfully",
            life: 3000,
          });
        });
      },
    });
  };

  const statusBodyTemplate = (rowData) => {
    const severity = rowData.status === "completed" ? "success" : "warning";
    return (
      <Badge value={rowData.status?.toUpperCase()} severity={severity}></Badge>
    );
  };

  const dateBodyTemplate = (rowData) => {
    return new Date(rowData.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="info"
        onClick={() => handleOpenDialog(rowData)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        onClick={() => handleDelete(rowData.id)}
      />
    </div>
  );

  const headerTemplate = () => (
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
        <i className="pi pi-list"></i>
        My Todos
      </h3>
      <Button
        label="Add Todo"
        icon="pi pi-plus"
        className="p-button-success"
        onClick={() => handleOpenDialog()}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md text-center py-8">
          <i className="pi pi-spin pi-spinner text-5xl text-blue-600"></i>
          <p className="mt-4 text-gray-600 text-lg">Loading todos...</p>
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
            <i className="pi pi-check-circle mr-2 text-blue-600"></i>
            Todo Management
          </h1>
          <p className="text-gray-600 text-lg">
            Create and manage your daily tasks
          </p>
        </div>

        {/* Todo Table */}
        <Card className="shadow-xl rounded-2xl p-0">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <i className="pi pi-list"></i>
              Todos List
            </h3>
          </div>
          <div className="p-8">
            <DataTable
              value={todos}
              header={headerTemplate}
              responsiveLayout="scroll"
              paginator
              rows={10}
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              rowsPerPageOptions={[5, 10, 20]}
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} todos"
              emptyMessage="No todos found. Create one to get started!"
              className="p-datatable-striped"
              stripedRows
              style={{ minWidth: "100%" }}
            >
              <Column
                field="todo"
                header="Task"
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                field="description"
                header="Description"
                style={{ minWidth: "250px" }}
              />
              <Column
                field="date"
                header="Due Date"
                body={dateBodyTemplate}
                sortable
                style={{ minWidth: "150px" }}
              />
              <Column
                field="status"
                header="Status"
                body={statusBodyTemplate}
                sortable
                style={{ minWidth: "120px" }}
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
      </div>

      {/* Add/Edit Dialog */} 
      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? "Edit Todo" : "Add New Todo"}
        modal
        style={{ width: "90vw", maxWidth: "550px" }}
      >
        <div className="space-y-4">
          {/* Task */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Task *
            </label>
            <InputText
              value={formData.todo}
              onChange={(e) => {
                setFormData({ ...formData, todo: e.target.value });
                setErrors("");
              }}
              placeholder="Enter task"
              className={`w-full ${errors.todo ? "p-invalid" : ""}`}
            />
            {errors.todo && <small className="p-error">{errors.todo}</small>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Description
            </label>
            <InputTextarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter description (optional)"
              rows={3}
              className="w-full"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Due Date *
            </label>
            <Calendar
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.value })}
              showIcon
              placeholder="Select date"
              className={`w-full ${errors.date ? "p-invalid" : ""}`}
            />
            {errors.date && <small className="p-error">{errors.date}</small>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Status
            </label>
            <Dropdown
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { label: "Pending", value: "pending" },
                { label: "Completed", value: "completed" },
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
              label={editingId ? "Update" : "Save"}
              icon={editingId ? "pi pi-check" : "pi pi-plus"}
              onClick={handleSave}
              className="p-button-info"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Todo;
