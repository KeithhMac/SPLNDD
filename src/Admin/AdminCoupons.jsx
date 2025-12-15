import React from "react";
import { Outlet } from "react-router-dom";

export const AdminCoupons = () => {
  return (
    <main className="w-full flex flex-col gap-4 ">
      <Outlet />
    </main>
  );
};
