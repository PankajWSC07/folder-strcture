import React, { useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Avatar } from "primereact/avatar";
import { Menu } from "primereact/menu";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";

function Navbar() {
  const toast = useRef(null);
  const menu = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const navLinkClass = ({ isActive }) =>
    `font-semibold text-sm sm:text-base px-4 py-2 rounded-4xl transition-all duration-200
     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600
     ${
       isActive
         ? "bg-white bg-opacity-30 text-black"
         : "text-white hover:text-blue-100 hover:bg-white hover:bg-opacity-20"
     }`;

  const handleLogout = () => {
    toast.current?.show({
      severity: "info",
      summary: "Logged Out",
      detail: "You have been logged out successfully",
      life: 3000,
    });

    setTimeout(() => {
      dispatch(logout());
      navigate("/login");
    }, 1000);
  };

  const items = [
    {
      label: "Profile",
      icon: "pi pi-user",
      command: () => navigate("/profile"),
    },
    ...(user?.role === "admin"
      ? [
          { separator: true },
          {
            label: "Users",
            icon: "pi pi-users",
            command: () => navigate("/users"),
          },
        ]
      : []),
    {
      separator: true,
    },
    {
      label: "Logout",
      icon: "pi pi-sign-out",
      command: handleLogout,
    },
  ];

  if (!isAuthenticated) return null;

  return (
    <>
      <Toast ref={toast} />
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg p-4 z-50 sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <i className="pi pi-check-circle text-2xl text-white"></i>
            <h1 className="text-2xl font-bold text-white hidden sm:inline">
              TodoApp
            </h1>
          </Link>

          {/* User section */}
          <div className="flex items-center gap-4">
            <NavLink to="/todo" className={navLinkClass}>
              Todo
            </NavLink>
            <NavLink to="/expense" className={navLinkClass}>
              Expense
            </NavLink>
            <NavLink to="/folderstructure" className={navLinkClass}>
              Folder Structure
            </NavLink>

            <div className="w-px h-8 bg-white opacity-80"></div>

            <span className="text-white text-sm hidden sm:inline">
              Welcome, <strong>{user?.firstName || "User"}</strong>
            </span>

            <div className="w-px h-8 bg-white opacity-80"></div>

            <div className="relative">
              <Avatar
                label={(user?.firstName?.[0]?.toUpperCase() + user?.lastName?.[0]?.toUpperCase()) || "U"}
                size="large"
                className="bg-white text-blue-600 cursor-pointer font-semibold hover:scale-105 transition-transform"
                onClick={(e) => menu.current?.toggle(e)}
              />
              <Menu model={items} popup ref={menu} className="mt-2 shadow-lg" />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
