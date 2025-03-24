import "@/styles/globals.css";
import React from "react";
import Sidebar from "./components/Sidebar";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 overflow-hidden">
        <div className="relative">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>

    </div>
  );
};

export default UserLayout;
