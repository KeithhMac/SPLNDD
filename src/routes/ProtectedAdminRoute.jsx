import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { AdminAuthContext } from "../context/AdminAuthContext.jsx";

export const ProtectedAdminRoute = ({
  children,
  requiredModules = [],
  requireSuperAdmin = false, // <--- NEW PROP for Audit Log strict access
}) => {
  const { admin, isAuthLoading } = useContext(AdminAuthContext);
  const [delayDone, setDelayDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDelayDone(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (isAuthLoading || !delayDone) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-medium text-gray-700 animate-pulse">
          Loading secure admin panel...
        </p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">
            Admin Access Required
          </h2>
          <p className="text-gray-600">
            Please log in with your admin account to continue.
          </p>
        </div>
      </div>
    );
  }


  // Strict check: for Audit Log, require BOTH super-admin AND modules
  let hasAccess;
  if (requireSuperAdmin) {
    hasAccess =
      admin.role === "super-admin" &&
      requiredModules.every((mod) => admin.modules?.includes(mod));
  } else {
    hasAccess =
      requiredModules.length === 0 ||
      requiredModules.some((mod) => admin.modules?.includes(mod));
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-yellow-600 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

ProtectedAdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredModules: PropTypes.arrayOf(PropTypes.string),
  requireSuperAdmin: PropTypes.bool, // <--- Add to PropTypes
};