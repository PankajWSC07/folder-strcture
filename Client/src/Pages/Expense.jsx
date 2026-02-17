import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../store/expenseSlice";

function Expense() {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const { expenses, totalExpenses, isLoading, error } = useSelector(
    (state) => state.expense,
  );

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    amount: 0,
    date: null,
    description: "",
    category: "",
  });

  // For field-level errors
  const [errors, setErrors] = useState({});

  const expenseCategories = [
    "Food",
    "Transport",
    "Entertainment",
    "Shopping",
    "Bills",
    "Healthcare",
    "Education",
    "Other",
  ];

  useEffect(() => {
    dispatch(getAllExpenses());
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

  const handleOpenDialog = (expense = null) => {
    setErrors({});
    if (expense) {
      setEditingId(expense.id);
      setFormData({
        amount: expense.amount,
        date: new Date(expense.date),
        description: expense.description,
        category: expense.category,
      });
    } else {
      setEditingId(null);
      setFormData({
        amount: 0,
        date: new Date(),
        description: "",
        category: "",
      });
    }
    setShowDialog(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = "Amount must be greater than 0";
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (!formData.date) newErrors.date = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const expenseData = {
      amount: formData.amount,
      date: formData.date,
      description: formData.description,
      category: formData.category,
    };

    if (editingId) {
      dispatch(updateExpense({ id: editingId, data: expenseData })).then(() => {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Expense updated successfully",
          life: 3000,
        });
        setShowDialog(false);
      });
    } else {
      dispatch(createExpense(expenseData)).then(() => {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Expense created successfully",
          life: 3000,
        });
        setShowDialog(false);
      });
    }
  };

  const handleDelete = (id) => {
    confirmDialog({
      message: "Are you sure you want to delete this expense?",
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        dispatch(deleteExpense(id)).then(() => {
          toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Expense deleted successfully",
            life: 3000,
          });
        });
      },
    });
  };

  const amountBodyTemplate = (rowData) => (
    <span className="font-semibold text-red-600">
      ₹{Number(rowData.amount).toFixed(2)}
      {/* {console.log(typeof(Number(rowData.amount)))} */}
    </span>
  );

  const dateBodyTemplate = (rowData) =>
    new Date(rowData.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const categoryBodyTemplate = (rowData) => {
    const colors = {
      Food: "success",
      Transport: "info",
      Entertainment: "warning",
      Shopping: "danger",
      Bills: "secondary",
      Healthcare: "info",
      Education: "primary",
      Other: "secondary",
    };
    return (
      <Badge
        value={rowData.category}
        severity={colors[rowData.category] || "secondary"}
      />
    );
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
        <i className="pi pi-wallet"></i>
        My Expenses
      </h3>
      <Button
        label="Add Expense"
        icon="pi pi-plus"
        onClick={() => handleOpenDialog()}
        className="p-button-success"
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md text-center py-8">
          <i className="pi pi-spin pi-spinner text-5xl text-blue-600"></i>
          <p className="mt-4 text-gray-600 text-lg">Loading expenses...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            <i className="pi pi-wallet mr-2 text-blue-600"></i>
            Expense Management
          </h1>
          <p className="text-gray-600 text-lg">
            Track and manage your expenses efficiently
          </p>
        </div>

        <Card className="shadow-xl rounded-2xl p-0 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <i className="pi pi-wallet"></i>
              Expenses List
            </h3>
          </div>
          <div className="p-8">
            <DataTable
              value={expenses}
              header={headerTemplate}
              responsiveLayout="scroll"
              paginator
              rows={10}
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              rowsPerPageOptions={[5, 10, 20]}
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} expenses"
              emptyMessage="No expenses found. Add one to get started!"
              className="p-datatable-striped"
              stripedRows
              style={{ minWidth: "100%" }}
            >
              <Column
                field="description"
                header="Description"
                sortable
                style={{ minWidth: "200px" }}
              />
              <Column
                field="amount"
                header="Amount"
                body={amountBodyTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="category"
                header="Category"
                body={categoryBodyTemplate}
                sortable
                style={{ minWidth: "130px" }}
              />
              <Column
                field="date"
                header="Date"
                body={dateBodyTemplate}
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
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <i className="pi pi-credit-card"></i>
                Total Expense
              </h3>
              <p className="text-3xl text-right font-bold text-gray-900">
                ₹{Number(totalExpenses)?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? "Edit Expense" : "Add New Expense"}
        modal
        style={{ width: "90vw", maxWidth: "550px" }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Description *
            </label>
            <InputTextarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors((prev) => ({ ...prev, description: null }));
              }}
              placeholder="Enter expense description"
              rows={3}
              className={`w-full ${errors.description ? "p-invalid" : ""}`}
            />
            {errors.description && (
              <small className="p-error">{errors.description}</small>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Amount *
            </label>
            <InputNumber
              value={formData.amount}
              onValueChange={(e) => {
                setFormData({ ...formData, amount: e.value });
                setErrors((prev) => ({ ...prev, amount: null }));
              }}
              placeholder="Enter amount"
              prefix="₹"
              className={`w-full ${errors.amount ? "p-invalid" : ""}`}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              max={10000000}
            />
            {errors.amount && (
              <small className="p-error">{errors.amount}</small>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Category *
            </label>
            <InputText
              list="categories"
              value={formData.category}
              onChange={(e) => {
                setFormData({ ...formData, category: e.target.value });
                setErrors((prev) => ({ ...prev, category: null }));
              }}
              placeholder="Select or enter category"
              className={`w-full ${errors.category ? "p-invalid" : ""}`}
            />
            <datalist id="categories">
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            {errors.category && (
              <small className="p-error">{errors.category}</small>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Date *
            </label>
            <Calendar
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.value });
                setErrors((prev) => ({ ...prev, date: null }));
              }}
              showIcon
              placeholder="Select date"
              className={`w-full ${errors.date ? "p-invalid" : ""}`}
            />
            {errors.date && <small className="p-error">{errors.date}</small>}
          </div>

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

export default Expense;
