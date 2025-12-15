import React, { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CustomerAuthContext } from "@/context/CustomerAuthContext";
import { toast } from "sonner"; // import Sonner toast

export const ProtectedCustomerRoute = ({ children }) => {
  const { user, isAuthLoading } = useContext(CustomerAuthContext);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast.error("Authentication required", {
        description: "You must be logged in to access this page.",
        duration: 2000,
      });

      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 2000); // 2 seconds delay

      return () => clearTimeout(timer);
    }
  }, [isAuthLoading, user]);

  if (isAuthLoading) return null;

  if (shouldRedirect) return <Navigate to="/" replace />;

  return user ? children : null;
};
