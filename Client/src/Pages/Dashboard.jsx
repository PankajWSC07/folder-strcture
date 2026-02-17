import { useDispatch, useSelector } from "react-redux";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Badge } from "primereact/badge";
import { getAllTodos } from "../store/todoSlice";
import { getAllExpenses } from "../store/expenseSlice";
import { useEffect } from "react";
// import { Chart } from "primereact/chart";

function Dashboard() {
  const dispatch = useDispatch();

  const { todos, isTodoLoading, todoError } = useSelector(
    (state) => state.todo,
  );

  const { totalExpenses, isExpensesLoading, expensesError } = useSelector(
    (state) => state.expense,
  );

  useEffect(() => {
    dispatch(getAllTodos());
    dispatch(getAllExpenses());
  }, [dispatch]);

  const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = formatDateLocal(new Date());

  const todoList = Array.isArray(todos)
    ? todos
    : todos?.data || todos?.todos || [];

  const todaysTodos = todoList.filter(
    (todo) => formatDateLocal(todo.date) === today,
  );

  // console.log(todaysTodos);

  const statusBodyTemplate = (rowData) => {
    const severity = rowData.status === "completed" ? "success" : "warning";
    return (
      <Badge value={rowData.status?.toUpperCase()} severity={severity}></Badge>
    );
  };

  const descriptionBodyTemplate = (rowData) => (
    <p className="text-gray-600">{rowData.description || "-"}</p>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 flex flex-col gap-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* TODAY'S TODOS */}
        <Card className="w-full shadow-xl rounded-2xl p-0 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <i className="pi pi-check-circle"></i>
              Today's Todos
            </h3>
          </div>
          <div className="p-8">
            {isTodoLoading && (
              <p className="text-center text-gray-500 py-6">Loading todos...</p>
            )}

            {todoError && (
              <p className="text-center text-red-500 py-6">{todoError}</p>
            )}

            {!isTodoLoading && todaysTodos.length === 0 && (
              <p className="text-center text-gray-500 py-6">
                No todos for today
              </p>
            )}

            {!isTodoLoading && todaysTodos.length > 0 && (
              <DataTable
                value={todaysTodos}
                responsiveLayout="scroll"
                className="p-datatable-striped"
                stripedRows
                style={{ minWidth: "100%" }}
              >
                <Column
                  field="todo"
                  header="Task"
                  style={{ minWidth: "200px" }}
                />
                <Column
                  field="description"
                  header="Description"
                  body={descriptionBodyTemplate}
                  style={{ minWidth: "250px" }}
                />
                <Column
                  field="status"
                  header="Status"
                  body={statusBodyTemplate}
                  style={{ minWidth: "120px" }}
                />
              </DataTable>
            )}
          </div>
        </Card>

        {/* TOTAL EXPENSES */}
        <Card className="w-full shadow-xl rounded-2xl p-0">
          <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 text-white">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <i className="pi pi-wallet"></i>
              Total Expense
            </h3>
          </div>
          <div className="p-8 text-center">
            {isExpensesLoading && (
              <p className="text-gray-500">Loading expenses...</p>
            )}

            {expensesError && <p className="text-red-500">{expensesError}</p>}

            {!isExpensesLoading && (
              <p className="text-4xl font-bold text-orange-600 mt-6">
                ₹ {totalExpenses}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
