import "@/styles/globals.css";
import React from "react";
import AdminSidebar from "./components/AdminSidebar";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      <div className="relative">
        <AdminSidebar />
      </div>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default UserLayout;
