import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export const AdminProduct = () => {
  return (
    <main className="w-full flex flex-col gap-4 ">
      <Outlet />
    </main>

  );
};
