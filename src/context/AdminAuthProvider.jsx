// src/context/AdminAuthProvider.jsx
import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import api from "../api/axios";
import { AdminAuthContext } from "./AdminAuthContext.jsx";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      // Try owner first
      const ownerRes = await api.get("/owner/auth/status");
      if (ownerRes.data?.admin) {
        setAdmin(ownerRes.data.admin); // Don't overwrite role!
        return true;
      }
      // 2. Try regular admin
      const empRes = await api.get("/employee/auth/status");
      if (empRes.data?.admin) {
        setAdmin(empRes.data.admin); // Don't overwrite role!
        return true;
      }
      setAdmin(null);
      return false;
    } catch (err) {
      console.error("Admin auth check failed:", err?.message || err);
      setAdmin(null);
      return false;
    }
  }, []);
  useEffect(() => {
    (async () => {
      setIsAuthLoading(true);
      await refreshAuth();
      setIsAuthLoading(false);
    })();
  }, [refreshAuth]);

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthLoading, refreshAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

AdminAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
