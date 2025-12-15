import React from "react";
import { Outlet } from "react-router-dom";

export const AdminContent = () => {
  return (
    <main className="w-full flex flex-col gap-4 ">
      <Outlet />
    </main>
  );
};
