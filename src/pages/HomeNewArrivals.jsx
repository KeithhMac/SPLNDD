import React, { useEffect, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "@/context/CartContext";
import { socket } from "@/lib/socket"; // <-- Import your Socket.IO client here

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

export const HomeNewArrivals = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localStockMap, setLocalStockMap] = useState({});
    const { cart, addToCart } = useCart();
    const serverUrl = import.meta.env.VITE_SERVER_URL;

    // Fetch products and initialize stock
    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                const res = await api.get("/customer/products/tags/new-arrivals");
                const fetched = res.data || [];
                setProducts(fetched);

                const stockMap = {};
                for (const p of fetched) {
                    const cartItem = cart.find(item => item.variant_id === p.variant_id);
                    const remaining = (p.display_stock ?? 0) - (cartItem?.quantity || 0);
                    stockMap[p.variant_id] = Math.max(0, remaining);
                }
                setLocalStockMap(stockMap);
            } catch (err) {
                console.error("Failed to fetch new arrivals:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNewArrivals();
    }, [cart]);

    // --- Real-time stock update ---
    useEffect(() => {
        if (!socket) return;
        const handleStockChanged = ({ variant_id, new_stock }) => {
            setLocalStockMap((prev) => ({
                ...prev,
                [variant_id]: new_stock,
            }));
            // Optionally update the products array if you want display_stock to be in sync
            setProducts((prev) =>
                prev.map((p) =>
                    p.variant_id === variant_id
                        ? { ...p, display_stock: new_stock }
                        : p
                )
            );
        };

        socket.on("stockChanged", handleStockChanged);
        return () => {
            socket.off("stockChanged", handleStockChanged);
        };
    }, []);

    const newArrivals = useMemo(() => products, [products]);
    const [spinningId, setSpinningId] = useState(null);

    return (
        <main className="w-full py-10 pt-5 flex flex-col justify-center items-center">
            <div className="w-[95%] rounded-2xl p-4 md:p-11 shadow-inner bg-[#f8e7da]/30 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-center mb-8">New Arrivals</h2>

                {loading ? (
                    <p className="text-center text-gray-500">Loading...</p>
                ) : newArrivals.length === 0 ? (
                    <p className="text-center text-gray-500 w-[80%] p-[5rem]">
                        No new arrivals found.
                    </p>
                ) : (
                    <Carousel
                        className="w-full relative "
                        opts={{ loop: false, align: "start" }}
                    >
                        <CarouselContent className="p-5 ">
                            {newArrivals.map((variant) => {
                                const {
                                    variant_id,
                                    product_name,
                                    category_name,
                                    type_name,
                                    sku,
                                    image_urls,
                                    price,
                                    compare_at,
                                    is_scarcity,
                                } = variant;

                                const stockLeft =
                                    localStockMap[variant_id] ?? variant.display_stock ?? 0;

                                const category = category_name?.toLowerCase();
                                const type = type_name?.toLowerCase().replace(/\s+/g, "-");
                                const slug = product_name.toLowerCase().replace(/\s+/g, "-");
                                const linkPath = `/${category}/${type}/${slug}/${sku}`;

                                const primaryImage = image_urls?.[0];
                                const secondaryImage = image_urls?.[1];

                                return (
                                    <CarouselItem
                                        key={variant_id}
                                        className="basis-1/1 sm:basis-1/2 md:basis-1/2 lg:basis-1/4"
                                    >
                                        <div className="w-full shadow-lg bg-white rounded-md overflow-hidden">
                                            <NavLink
                                                to={linkPath}
                                                className="relative group block w-full h-[15rem] overflow-hidden"
                                            >
                                                {primaryImage ? (
                                                    <img
                                                        src={`${serverUrl}/uploads/${primaryImage}`}
                                                        alt={product_name}
                                                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-100 group-hover:opacity-0"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                                        No image
                                                    </div>
                                                )}

                                                {secondaryImage && (
                                                    <img
                                                        src={`${serverUrl}/uploads/${secondaryImage}`}
                                                        alt={`${product_name} hover`}
                                                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                                                        loading="lazy"
                                                    />
                                                )}

                                                <div className="absolute bottom-0 w-full bg-[#F9E7DB]/40 backdrop-blur-sm text-black text-center py-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    Quick View
                                                </div>
                                            </NavLink>

                                            <div className="p-4 flex flex-col gap-2">
                                                <h2 className="text-lg font-semibold text-black">
                                                    {product_name}
                                                </h2>

                                                {variant.option_values &&
                                                    Object.keys(variant.option_values).length > 0 && (
                                                        <div className="text-sm text-gray-600">
                                                            {Object.entries(variant.option_values).map(
                                                                ([key, value], idx, arr) => (
                                                                    <span key={key}>
                                                                        {value}
                                                                        {idx < arr.length - 1 && (
                                                                            <span className="mx-1">·</span>
                                                                        )}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    )}

                                                <div className="flex justify-between items-center">
                                                    <div className="flex flex-col items-start gap-[0.2rem]">
                                                        <div className="flex items-center gap-2">
                                                            {compare_at && Number(compare_at) > Number(price) ? (
                                                                <>
                                                                    <span className="text-xs line-through text-gray-400">
                                                                        ₱{Number(compare_at).toLocaleString()}
                                                                    </span>
                                                                    <span className="text-sm text-[#BC6C25] font-semibold">
                                                                        ₱{Number(price).toLocaleString()}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm text-[#BC6C25] font-semibold">
                                                                    ₱{Number(price).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {compare_at && Number(compare_at) > Number(price) && (
                                                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-[2px] rounded">
                                                                {Math.round(
                                                                    ((Number(compare_at) - Number(price)) /
                                                                        Number(compare_at)) *
                                                                    100
                                                                )}
                                                                % OFF
                                                            </span>
                                                        )}
                                                    </div>

                                                    {is_scarcity ? (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            Only {stockLeft} left
                                                        </p>
                                                    ) : (
                                                        typeof stockLeft === "number" &&
                                                        stockLeft !== null && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {stockLeft} Available
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                                <button
                                                    disabled={stockLeft <= 0 || spinningId === variant_id}
                                                    onClick={async () => {
                                                        setSpinningId(variant_id); // start spinner
                                                        addToCart(variant);
                                                        setLocalStockMap((prev) => ({
                                                            ...prev,
                                                            [variant_id]: Math.max(0, (prev[variant_id] ?? 0) - 1),
                                                        }));
                                                        setTimeout(() => setSpinningId(null), 700); // reset after spinner
                                                    }}
                                                    className={`
    mt-2 w-full text-white p-[0.6rem] rounded-md text-sm flex items-center justify-center
    transition-all duration-300 cursor-pointer font-medium
    ${stockLeft <= 0 || spinningId === variant_id
                                                            ? "bg-gray-400 cursor-not-allowed"
                                                            : "bg-[#D5A58B] hover:bg-[#dfb49d] shadow-md hover:shadow-lg"
                                                        }
  `}
                                                >
                                                    <span className="relative flex items-center justify-center h-[1.3rem]">
                                                        {/* Loader */}
                                                        <span
                                                            className={`absolute flex gap-1 transition-opacity duration-300 ${spinningId === variant_id ? "opacity-100" : "opacity-0"
                                                                }`}
                                                        >
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                                                        </span>

                                                        {/* Text */}
                                                        <span
                                                            className={`transition-opacity duration-300 ${spinningId === variant_id ? "opacity-0" : "opacity-100"
                                                                }`}
                                                        >
                                                            {stockLeft <= 0 ? "Out of Stock" : "Add to Cart"}
                                                        </span>
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-0 sm:-left-6 top-1/2 -translate-y-1/2 z-10" />
                        <CarouselNext className="absolute right-0 sm:-right-6 top-1/2 -translate-y-1/2 z-10" />
                    </Carousel>
                )}
            </div>
        </main>
    );
};