// src/context/AuthProvider.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import api from "../api/axios";
import { CustomerAuthContext } from "./CustomerAuthContext.jsx";

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // prevent parallel/duplicate refreshes
  const inFlightRef = useRef(false);
  const lastResultRef = useRef(null); // remember last boolean result

  const refreshAuth = useCallback(async () => {
    if (inFlightRef.current) {
      return lastResultRef.current ?? false;
    }
    inFlightRef.current = true;
    setIsAuthLoading(true);
    try {
      const res = await api.get(`/customer/status`);
      const u = res.data.user || null;
      setUser(u);
      lastResultRef.current = Boolean(u);
      return lastResultRef.current;
    } catch (err) {
      console.error("Authentication check failed:", err);
      setUser(null);
      lastResultRef.current = false;
      return false;
    } finally {
      inFlightRef.current = false;
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    // call exactly once on mount
    refreshAuth();
  }, [refreshAuth]);

  return (
    <CustomerAuthContext.Provider
      value={{ user, setUser, isAuthLoading, refreshAuth }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

CustomerAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
