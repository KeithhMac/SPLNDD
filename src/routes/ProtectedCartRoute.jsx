import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
// import { toast } from "sonner"; // Sonner toast

export const ProtectedCartRoute = ({ children }) => {
  const { cartLoaded, cart } = useCart();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (cartLoaded && cart.length === 0) {
      // toast.error("Cart is empty", {
      //   description: "Redirecting you to the homepage...",
      //   duration: 2000,
      // });

      const timeout = setTimeout(() => {
        setShouldRedirect(true);
      }, 2000); // wait for the toast to display before redirecting

      return () => clearTimeout(timeout);
    }
  }, [cartLoaded, cart]);

  if (!cartLoaded) return null;

  if (shouldRedirect) return <Navigate to="/" replace />;

  return cart.length > 0 ? children : null;
};
