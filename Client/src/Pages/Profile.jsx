import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Badge } from "primereact/badge";
import { getProfile } from "../store/authSlice";

function Profile() {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      dispatch(getProfile());
    }
  }, [user, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md text-center py-8">
          <i className="pi pi-spin pi-spinner   text-5xl text-blue-600"></i>
          <p className="mt-4 text-gray-600 text-lg">Loading profile...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            <i className="pi pi-user mr-2 text-blue-600"></i>
            My Profile
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your account information
          </p>
        </div>

        {/* Profile Details Section */}
        <Card className="shadow-xl rounded-2xl p-0 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <i className="pi pi-id-card"></i>
              Personal Information
            </h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* First Name */}
              <div className="border-l-4 border-blue-500 pl-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  First Name
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.firstName || "N/A"}
                </p>
              </div>

              {/* Last Name */}
              <div className="border-l-4 border-indigo-500 pl-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Last Name
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.lastName || "N/A"}
                </p>
              </div>

              {/* Email */}
              <div className="md:col-span-2 border-l-4 border-purple-500 pl-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Email Address
                </p>
                <p className="text-xl font-bold text-gray-900 break-all">
                  {user?.email || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Status Section */}
        <Card className="shadow-xl rounded-2xl p-0 mb-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <i className="pi pi-check-circle"></i>
              Account Status
            </h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Status */}
              <div className="border-l-4 border-green-500 pl-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Status
                </p>
                <div className="flex items-center gap-3">
                  <Badge value="Active" severity="success"></Badge>
                  <span className="text-lg font-semibold text-gray-900">
                    Account Active
                  </span>
                </div>
              </div>

              {/* Member Since */}
              <div className="border-l-4 border-green-500 pl-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Member Since
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <Divider></Divider>

            {/* Account Details */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Additional Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-medium">
                    Account Verification
                  </p>
                  <p className="text-green-600 font-bold mt-2">✓ Verified</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm font-medium">
                    Security Status
                  </p>
                  <p className="text-purple-600 font-bold mt-2">Secure</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Profile;
