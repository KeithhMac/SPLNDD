// src/context/CartProvider.js
import React, { useEffect, useState } from "react";
import { CartContext } from "./CartContext";
import { toast } from "sonner";

const CART_KEY = "splndd_cart";

// Safe helper: turn a filename into a full URL; keep it if it's already absolute
const buildImageUrl = (img) => {
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  const base = import.meta.env.VITE_SERVER_URL?.replace(/\/+$/, "") || "";
  return `${base}/uploads/${img}`;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) setCart(JSON.parse(stored));
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);


  const formatVariantOptions = (optionValues) => {
    if (!optionValues || Object.keys(optionValues).length === 0) return "";
    return Object.values(optionValues).join(" · ");
  };

  const addToCart = (variant, onLimit) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.variant_id === variant.variant_id);
      const optionText = formatVariantOptions(variant.option_values);

      if (idx !== -1) {
        const updated = [...prev];
        const item = updated[idx];

        if (item.quantity >= item.productStock) {
          if (typeof onLimit === "function") onLimit(item);
          toast.error(
            `Stock limit reached for ${item.name}${optionText ? ` — ${optionText}` : ""}`
          );
          return updated;
        }

        item.quantity += 1;
        toast.success(
          `Increased ${item.name}${optionText ? ` — ${optionText}` : ""} in cart`
        );
        return updated;
      }

      const firstImage = Array.isArray(variant.image_urls)
        ? variant.image_urls[0]
        : null;

      toast.success(
        `Added ${variant.product_name}${optionText ? ` — ${optionText}` : ""} to cart`
      );
      console.log(variant)
      return [
        ...prev,
        {
          id: variant.variant_id,
          name: variant.product_name,
          price: variant.price,
          cost_per_item: Number(variant.cost_per_item) || 0,
          quantity: 1,
          image: buildImageUrl(firstImage),
          productStock: Number(variant.display_stock ?? 0),
          category: variant.category_name?.toLowerCase(), // <--- make sure this exists
          type: variant.type_name?.toLowerCase().replace(/\s+/g, "-"), // <--- add this line!
          sku: variant.sku,
          variant_id: variant.variant_id,
          weightKg: Number(variant.weight_kg ?? 0),
          option_values: variant.option_values || {},
        },
      ];
    });
  };


  const updateQuantity = (variantId, quantity) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.variant_id !== variantId) return item;

        const safeQty = Math.max(
          0,
          Math.min(Number(quantity) || 0, Number(item.productStock) || 0)
        );

        if (safeQty !== item.quantity) {
          const optionText = formatVariantOptions(item.option_values);
          toast.info(
            `${item.name}${optionText ? ` — ${optionText}` : ""} updated to ${safeQty}`
          );
        }

        return { ...item, quantity: safeQty };
      })
    );
  };

  const removeFromCart = (variantId) => {
    setCart((prev) => {
      const item = prev.find((i) => i.variant_id === variantId);
      if (item) {
        const optionText = formatVariantOptions(item.option_values);
        toast.error(
          `Removed ${item.name}${optionText ? ` — ${optionText}` : ""} from cart`
        );
      }
      return prev.filter((i) => i.variant_id !== variantId);
    });
  };


  const clearCart = () => {
    setCart([]);
  }

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );
  const totalOrders = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoaded,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalOrders,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
