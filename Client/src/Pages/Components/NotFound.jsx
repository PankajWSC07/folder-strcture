import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

function NotFound() {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  if (location.pathname === "/logout") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 px-6">
      <div className="text-center animate-fadeIn">
        <p className="text-base font-semibold text-indigo-400">404</p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight text-black sm:text-7xl">
          Page not found
        </h1>
        {/* <p>Current Pathname: {location.pathname}</p>   */}

        <p className="mt-6 text-lg text-black sm:text-xl">
          Sorry, we couldn’t find the page you’re looking for.
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            to="/dashboard"
            className="rounded-4xl bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Go back home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFound;
