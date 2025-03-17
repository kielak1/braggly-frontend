import "@/styles/globals.css";
import React from "react";
import Sidebar from "./components/Sidebar";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      <div className="relative">
        <Sidebar />
      </div>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default UserLayout;
