// src/hooks/useCanAccess.js
import { useContext } from "react";
import { AdminAuthContext } from "@/context/AdminAuthContext";

export function useCanAccess(moduleKeyOrKeys) {
  const { admin } = useContext(AdminAuthContext);

  // Not logged in or missing module list
  if (!admin || !Array.isArray(admin.modules)) return false;

  // Normalize to array
  const required = Array.isArray(moduleKeyOrKeys)
    ? moduleKeyOrKeys
    : [moduleKeyOrKeys];

  const cleaned = required
    .filter((key) => typeof key === "string" && key.trim() !== "")
    .map((key) => key.trim());

  const result = cleaned.some((key) => admin.modules.includes(key));

  return result;
}
