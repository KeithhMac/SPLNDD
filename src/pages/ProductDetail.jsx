import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "@/context/CartContext";
import { socket } from "@/lib/socket";

/* keep your existing carousel */
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CustomerFeedbacks } from "@/components/CustomerFeeedbacks";

import { Skeleton } from "@/components/ui/skeleton";


// Prefer to show swatches for "Color"/"Colour"
const SWATCH_NAMES = ["color", "colour", "colorway", "colourway"];

export const ProductDetail = () => {
    const { category, type, sku } = useParams();
    const navigate = useNavigate();
    const serverUrl = import.meta.env.VITE_SERVER_URL;

    const [currentVariant, setCurrentVariant] = useState(null);
    const [allVariants, setAllVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOptions, setSelectedOptions] = useState({});

    const [feedbacks, setFeedbacks] = useState([]);

    const [showSkeleton, setShowSkeleton] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/customer/feedback/feedback/all");
                if (res.data?.success && Array.isArray(res.data.feedbacks)) {
                    const mapped = res.data.feedbacks.map((f) => ({
                        id: f.id,
                        // Backend already normalizes display_name ("Anonymous" when needed)
                        name: f.display_name,
                        is_anonymous: !!f.is_anonymous,
                        date: new Date(f.created_at).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "2-digit",
                        }),
                        rating: Number(f.rating) || 0,
                        text: f.message || "",
                        image_urls: Array.isArray(f.image_urls) ? f.image_urls : [],
                    }));
                    setFeedbacks(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch feedbacks:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Add artificial skeleton delay (2 seconds after loading)
    useEffect(() => {
        if (loading) {
            setShowSkeleton(true);
        } else {
            const timer = setTimeout(() => setShowSkeleton(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    // carousel state
    const [carouselApi, setCarouselApi] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const { cart, addToCart } = useCart();
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedStockMap, setRelatedStockMap] = useState({});


    useEffect(() => {
        if (!socket) return;
        // For the main product
        const handleStockChanged = ({ variant_id, new_stock }) => {
            // Update current variant if it's the one affected
            setCurrentVariant((prev) =>
                prev && prev.variant_id === variant_id
                    ? { ...prev, display_stock: new_stock }
                    : prev
            );
            // Update allVariants for option switching
            setAllVariants((prev) =>
                prev.map((v) =>
                    v.variant_id === variant_id
                        ? { ...v, display_stock: new_stock }
                        : v
                )
            );
            // Update related products' stock map
            setRelatedStockMap((prev) => ({
                ...prev,
                [variant_id]: new_stock,
            }));
        };
        socket.on("stockChanged", handleStockChanged);
        return () => {
            socket.off("stockChanged", handleStockChanged);
        };
    }, []);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            try {
                const res = await api.get(`/customer/products/${category}/${type}`);
                const data = (res.data || []).filter((p) => p.sku !== sku);
                setRelatedProducts(data);

                // Build stock map
                const stockMap = {};
                for (const p of data) {
                    const cartItem = cart.find((item) => item.variant_id === p.variant_id);
                    const remainingStock = (p.display_stock ?? 0) - (cartItem?.quantity || 0);
                    stockMap[p.variant_id] = Math.max(0, remainingStock);
                }
                setRelatedStockMap(stockMap);
            } catch (err) {
                console.error("Failed to load related products:", err);
            }
        };

        fetchRelatedProducts();
    }, [category, type, sku, cart]);

    // Fetch initial data
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get(`/customer/products/${category}/${type}/${sku}`);
                const { current_variant, variants } = res.data;

                if (!mounted) return;

                // cap to 5 images
                current_variant.image_urls = (current_variant.image_urls || []).slice(0, 5);

                setCurrentVariant(current_variant);
                setAllVariants(variants || []);
                setSelectedOptions(current_variant.option_values || {});
                setActiveIndex(0);

                // reset carousel to first slide if API is ready
                if (carouselApi) {
                    try {
                        carouselApi.scrollTo(0, true);
                    } catch (err) {
                        console.log("Carousel API not ready:", err);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch product details:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, type, sku]);

    // Sync activeIndex with carousel (Prev/Next/swipe)
    useEffect(() => {
        if (!carouselApi) return;
        const init = () => setActiveIndex(carouselApi.selectedScrollSnap());
        const onSelect = () => setActiveIndex(carouselApi.selectedScrollSnap());

        init();
        carouselApi.on("select", onSelect);

        return () => {
            try {
                carouselApi.off("select", onSelect);
            } catch (err) {
                console.log("Carousel API cleanup error:", err);
            }
        };
    }, [carouselApi]);

    // Available options from siblings
    const availableOptions = useMemo(() => {
        const map = {};
        (allVariants || []).forEach((v) => {
            if (!v?.option_values) return;
            Object.entries(v.option_values).forEach(([opt, value]) => {
                if (!map[opt]) map[opt] = new Set();
                map[opt].add(String(value));
            });
        });
        const obj = {};
        for (const [k, setVals] of Object.entries(map)) obj[k] = Array.from(setVals).sort();
        return obj;
    }, [allVariants]);

    // Option order based on current variant (stable)
    const orderedOptionNames = useMemo(() => {
        if (!currentVariant?.option_values) return Object.keys(availableOptions || {});
        return Object.keys(currentVariant.option_values).filter((k) => k in (availableOptions || {}));


    }, [currentVariant, availableOptions]);


    const swatchOptionName = useMemo(() => {
        if (!orderedOptionNames?.length) return null;
        // find the first option whose name contains a color keyword
        const found = orderedOptionNames.find((n) =>
            SWATCH_NAMES.some((tag) => n.toLowerCase().includes(tag))
        );
        // if none found, you can choose a fallback — here we pick the first option
        return found || orderedOptionNames[0] || null;
    }, [orderedOptionNames]);


    // isSecondOption will only return true if there are at least 2 options
    // const isSecondOption = useCallback(
    //     (name) =>
    //         orderedOptionNames.length > 1 && orderedOptionNames.indexOf(name) === 1,
    //     [orderedOptionNames]
    // );

    // Find matching variant based on selected options
    const findMatchingVariant = useCallback(() => {
        return allVariants.find((variant) =>
            Object.entries(selectedOptions).every(([key, val]) => variant.option_values?.[key] === val)
        );
    }, [selectedOptions, allVariants]);

    // Navigate when options change
    useEffect(() => {
        if (!Object.keys(selectedOptions).length || !currentVariant) return;
        const matchingVariant = findMatchingVariant();
        if (matchingVariant && matchingVariant.sku && matchingVariant.sku !== currentVariant.sku) {
            const productSlug =
                currentVariant.product_name?.toLowerCase?.().replace(/\s+/g, "-") || "product";
            navigate(`/${category}/${type}/${productSlug}/${matchingVariant.sku}`);
        }
    }, [selectedOptions, currentVariant, category, type, navigate, findMatchingVariant]);

    // Stock left = display_stock - qty in cart
    const stockLeft = useMemo(() => {
        if (!currentVariant) return 0;
        const inCart = cart.find((c) => c.variant_id === currentVariant.variant_id);
        const cartQty = inCart?.quantity || 0;
        return Math.max(0, Number(currentVariant.display_stock ?? 0) - cartQty);
    }, [currentVariant, cart]);

    const discountPct = useMemo(() => {
        if (!currentVariant) return null;
        const { price, compare_at } = currentVariant;
        if (Number(compare_at) > Number(price)) {
            return Math.round(((Number(compare_at) - Number(price)) / Number(compare_at)) * 100);
        }
        return null;
    }, [currentVariant]);

    // ——— helpers for swatches ———
    const toUploadUrl = useCallback(
        (key) => {
            if (!key) return null;
            if (key.startsWith("http://") || key.startsWith("https://")) return key;
            return `${serverUrl}/uploads/${key}`;
        },
        [serverUrl]
    );

    // map: { [optionName]: { [value]: imageKey } }
    const swatchMap = useMemo(() => {
        const map = {};
        (allVariants || []).forEach((v) => {
            if (!v?.option_values) return;
            const imgKey =
                v.image_url || (Array.isArray(v.image_urls) && v.image_urls[0]) || null;
            if (!imgKey) return;
            Object.entries(v.option_values).forEach(([opt, rawVal]) => {
                const val = String(rawVal);
                (map[opt] ||= {});
                if (!map[opt][val]) map[opt][val] = imgKey;
            });
        });
        return map;
    }, [allVariants]);

    // show only values (no labels)
    const selectedValues = useMemo(() => {
        if (!selectedOptions) return "";
        return orderedOptionNames
            .map((n) => selectedOptions[n])
            .filter(Boolean)
            .join(" · ");
    }, [selectedOptions, orderedOptionNames]);

    const [spinningId, setSpinningId] = useState(null);

    // ------ SKELETON UI ------
    if (loading || showSkeleton) {
        return (
            <main className="w-full min-h-screen py-12 flex flex-col items-center">
                <div className="flex flex-col md:flex-row gap-[5rem] max-w-6xl w-full mt-[5rem]">
                    {/* Left: Carousel skeleton */}
                    <div className="w-full lg:w-1/2 flex flex-col items-center">
                        <Skeleton className="w-full h-[28rem] rounded-md mb-4 bg-gray-300" />
                        <div className="mt-3 grid grid-cols-4 gap-2 w-full">
                            {[...Array(4)].map((_, idx) => (
                                <Skeleton key={idx} className="h-[70px] w-full rounded-md bg-gray-200" />
                            ))}
                        </div>
                    </div>
                    {/* Right: Product info skeleton */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-4">
                        <Skeleton className="h-10 w-2/3 mb-2 bg-gray-200" />
                        <Skeleton className="h-5 w-1/4 mb-4 bg-gray-100" />
                        <Skeleton className="h-8 w-1/3 mb-4 bg-gray-200" />
                        <Skeleton className="h-4 w-1/4 mb-2 bg-gray-100" />
                        <Skeleton className="h-16 w-full mb-4 bg-gray-100" />
                        {/* Option buttons */}
                        <div className="flex gap-2">
                            {[...Array(3)].map((_, idx) => (
                                <Skeleton key={idx} className="h-10 w-20 rounded-md bg-gray-200" />
                            ))}
                        </div>
                        <Skeleton className="h-12 w-full mt-6 bg-gray-300" />
                        {/* Accordion skeleton */}
                        <div className="mt-8 space-y-3">
                            {[...Array(3)].map((_, idx) => (
                                <Skeleton key={idx} className="h-8 w-1/2 bg-gray-100" />
                            ))}
                        </div>
                    </div>
                </div>

            </main>
        );
    }

    if (!currentVariant) {
        return (
            <main className="w-full min-h-screen px-6 py-12 flex items-center justify-center">
                <p className="text-lg text-red-500">Product not found.</p>
            </main>
        );
    }

    const images = (currentVariant.image_urls || []).slice(0, 5);



    return (
        <main className="w-full min-h-screen  py-12 flex flex-col items-center">
            <div className="flex flex-col md:flex-row gap-[5rem] max-w-5xl w-full mt-10">
                {/* === Left: Carousel + thumbnails === */}
                <div className="w-full lg:w-1/2">
                    <Carousel className="w-full max-w-full relative " setApi={setCarouselApi} opts={{ loop: false, align: "start" }}>
                        <CarouselContent>
                            {images.map((img, index) => (
                                <CarouselItem key={index} className="flex justify-center items-center">
                                    <img
                                        src={`${serverUrl}/uploads/${img}`}
                                        alt={`${currentVariant.product_name} - ${currentVariant.sku} - ${index + 1}`}
                                        className="rounded-md object-cover h-[28rem] w-full"
                                        loading="eager"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                    </Carousel>

                    {/* Thumbnails: show 4 OTHER images (exclude active) */}
                    {images.length > 1 && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                            {images
                                .map((src, i) => ({ src, i }))
                                .filter(({ i }) => i !== activeIndex)
                                .slice(0, 4)
                                .map(({ src, i }) => (
                                    <button
                                        key={`${src}-${i}`}
                                        type="button"
                                        aria-label={`Preview image ${i + 1}`}
                                        className="border rounded-md overflow-hidden h-[70px] focus:outline-none hover:opacity-80"
                                        onClick={() => {
                                            setActiveIndex(i);
                                            try {
                                                carouselApi?.scrollTo(i);
                                            } catch (err) {
                                                console.log("Carousel API not ready:", err);
                                            }
                                        }}
                                    >
                                        <img
                                            src={`${serverUrl}/uploads/${src}`}
                                            alt={`thumb-${i + 1}`}
                                            className="object-cover w-full h-full"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                        </div>
                    )}
                </div>

                {/* === Right: Info + Dynamic Options === */}
                <div className="w-full lg:w-1/2 flex flex-col gap-4">
                    <div className="flex justify-between">
                        {/* Product name */}
                        <h1 className="text-3xl font-bold text-[#283618]">{currentVariant.product_name}</h1>
                        {/* Price / Compare / % OFF */}
                        <div className="flex items-center gap-3">
                            {currentVariant.compare_at && Number(currentVariant.compare_at) > Number(currentVariant.price) ? (
                                <>
                                    <span className="text-xl line-through text-gray-400">
                                        ₱{Number(currentVariant.compare_at).toLocaleString("en-PH")}
                                    </span>
                                    <span className="text-2xl font-semibold text-[#BC6C25]">
                                        ₱{Number(currentVariant.price).toLocaleString("en-PH")}
                                    </span>
                                    {discountPct != null && (
                                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-[2px] rounded">
                                            {discountPct}% OFF
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-2xl font-semibold text-[#BC6C25]">
                                    ₱{Number(currentVariant.price).toLocaleString("en-PH")}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        {selectedValues && <p className="mt-1 text-sm text-gray-600">{selectedValues}</p>}

                        {/* Stock / Scarcity */}
                        <div>
                            {stockLeft <= 0 ? (
                                <p className="text-sm text-red-600">Out of stock</p>
                            ) : currentVariant.is_scarcity ? (
                                <p className="text-sm text-red-600">Only {stockLeft} left</p>
                            ) : (
                                <p className="text-sm text-gray-700">{stockLeft} Available</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {currentVariant.description && (
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap text-justify">{currentVariant.description}</p>
                    )}

                    {/* Size guide dialog */}
                    <Dialog>
                        <div className="flex items-center justify-end">
                            <DialogTrigger asChild>
                                <button
                                    type="button"
                                    className="text-sm underline cursor-pointer text-gray-700 hover:text-[#BC6C25]"
                                    aria-haspopup="dialog"
                                    aria-expanded="false"
                                >
                                    View size guide
                                </button>
                            </DialogTrigger>
                        </div>

                        <DialogContent className="w-[28rem] max-w-full">
                            <DialogHeader>
                                <DialogTitle>
                                    {currentVariant.size_guide?.title || "Size Guide"}
                                </DialogTitle>
                                <DialogDescription>
                                    {currentVariant.size_guide
                                        ? "Use this chart to find your best fit."
                                        : "Size chart not available."}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4">
                                {currentVariant.size_guide?.url ? (
                                    <img
                                        src={currentVariant.size_guide.url}
                                        alt={currentVariant.size_guide.title || "Size Guide"}
                                        className="w-full h-auto rounded border object-contain bg-white"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-600">No size guide image available.</p>
                                )}
                            </div>

                            <DialogFooter className="mt-6">
                                <DialogClose asChild>
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Options */}
                    {orderedOptionNames.length > 0 && (
                        <div className="space-y-4 mt-2">
                            {orderedOptionNames.map((optionName) => {
                                const values = availableOptions[optionName] || [];
                                const isSwatch = optionName === swatchOptionName
                                return (
                                    <div key={optionName}>
                                        <p className="text-sm font-medium mb-2">{optionName}</p>

                                        <div className="flex gap-3 flex-wrap">
                                            {values.map((val) => {
                                                const isActive = selectedOptions[optionName] === val;

                                                // Render image swatches for the chosen option (e.g., Color)
                                                if (isSwatch) {
                                                    const key = swatchMap?.[optionName]?.[val] || null;
                                                    const src = toUploadUrl(key);

                                                    return (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setSelectedOptions((p) => ({ ...p, [optionName]: val }))}
                                                            aria-pressed={isActive}
                                                            aria-label={`${optionName}: ${val}`}
                                                            title={`${optionName}: ${val}`}
                                                            className={[
                                                                "relative w-12 h-12 rounded-md border overflow-hidden",
                                                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                                                isActive ? "border-[#BC6C25] ring-1 ring-[#BC6C25]" : "border-gray-200 hover:border-[#eac5a5] cursor-pointer",
                                                            ].join(" ")}
                                                        >
                                                            {src ? (
                                                                <img
                                                                    src={src}
                                                                    alt={`${val} swatch`}
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                />
                                                            ) : (
                                                                <span className="text-[11px] text-gray-600 px-1 leading-tight">{val}</span>
                                                            )}
                                                            {isActive && (
                                                                <span className="pointer-events-none absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#BC6C25] text-white text-[10px]">
                                                                    ✓
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                }

                                                // — other options as text pills —
                                                return (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setSelectedOptions((p) => ({ ...p, [optionName]: val }))}
                                                        className={`px-4 py-2 border rounded-md text-sm ${isActive ? "border-[#BC6C25] text-[#BC6C25]" : "text-gray-700 hover:border-[#eac5a5] cursor-pointer"
                                                            }`}
                                                    >
                                                        {val}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add to cart */}
                    <button
                        type="button"
                        disabled={stockLeft <= 0 || spinningId === currentVariant.variant_id}
                        onClick={async () => {
                            setSpinningId(currentVariant.variant_id); // start loader
                            const payload = {
                                ...currentVariant,
                                quantity: 1,
                                image_urls: currentVariant.image_urls || [],
                                option_values: currentVariant.option_values || {},
                            };
                            addToCart(payload);

                            // reset loader after 700ms
                            setTimeout(() => setSpinningId(null), 700);
                        }}
                        className={`
    cursor-pointer mt-4 w-full text-white py-3 rounded-md font-medium
    transition-all duration-300
    ${stockLeft <= 0 || spinningId === currentVariant.variant_id
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-[#D5A58B] hover:bg-[#e0b9a4] shadow-md hover:shadow-lg"
                            }
  `}
                    >
                        <span className="relative flex items-center justify-center h-[1.3rem]">
                            {/* Loader */}
                            <span
                                className={`absolute flex gap-1 transition-opacity duration-300 ${spinningId === currentVariant.variant_id ? "opacity-100" : "opacity-0"
                                    }`}
                            >
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                            </span>

                            {/* Button Text */}
                            <span
                                className={`transition-opacity duration-300 ${spinningId === currentVariant.variant_id ? "opacity-0" : "opacity-100"
                                    }`}
                            >
                                {stockLeft <= 0 ? "Out of Stock" : "+ Add to cart"}
                            </span>
                        </span>
                    </button>


                    {/* Material / Care / Delivery */}
                    <Accordion type="single" collapsible className="w-full" >
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="hover:no-underline cursor-pointer">Product Material</AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                                    <li>
                                        <span className="font-medium">Fabric:</span>{" "}
                                        {currentVariant.material || "Material details not available"}
                                    </li>
                                    <li>
                                        <span className="font-medium">Weight:</span>{" "}
                                        {currentVariant.weight_kg ? `${currentVariant.weight_kg * 1000} g` : "N/A"}
                                    </li>
                                    <li>
                                        <span className="font-medium">Dimensions:</span>{" "}
                                        {currentVariant.length_cm} × {currentVariant.width_cm} × {currentVariant.height_cm} cm
                                    </li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Care Guide (dynamic text, fallback if missing) */}
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="hover:no-underline cursor-pointer">Care Guide</AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {currentVariant.care_guide?.body ? (
                                    <p className="whitespace-pre-wrap text-gray-700">
                                        {currentVariant.care_guide.body}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-600">Care guide not available.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger className="hover:no-underline cursor-pointer">Delivery and Payment</AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                <div>
                                    <p className="font-medium text-gray-800 mb-2">Shipping Times (Philippines)</p>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                        <li><span className="font-medium">Metro Manila:</span> 2–3 business days</li>
                                        <li><span className="font-medium">Luzon (outside MM):</span> 3–5 business days</li>
                                        <li><span className="font-medium">Visayas & Mindanao:</span> 5–7 business days</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-medium text-gray-800 mb-2">Payment Methods</p>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                        <li>Visa / Mastercard / JCB (debit & credit)</li>
                                        <li>GCash, Maya</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-medium text-gray-800 mb-2">Returns & Exchanges</p>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                        <li><span className="font-medium">30-day</span> return/exchange window from delivery date.</li>
                                        <li>Items must be unworn, unwashed, with tags and original packaging.</li>
                                        <li>Initiate via your order page or contact support; refunds processed within 2–3 business days after inspection.</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
            {/* Related products */}
            {relatedProducts.length > 0 && (
                <section className="w-full max-w-6xl mt-[4.1rem]">
                    <h3 className="text-xl font-semibold mb-4 px-4">
                        You might also like
                    </h3>

                    <Carousel
                        className="w-full px-4 relative" // 👈 make this relative so buttons position correctly
                        opts={{ loop: false, align: "start" }}
                    >
                        <CarouselContent className="p-5">
                            {relatedProducts.map((variant) => {
                                const linkPath = `/${category}/${type}/${variant.product_name
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}/${variant.sku}`;
                                const imgs = Array.isArray(variant.image_urls)
                                    ? variant.image_urls.slice(0, 2)
                                    : [];
                                const rStockLeft =
                                    relatedStockMap[variant.variant_id] ?? variant.display_stock;

                                return (
                                    <CarouselItem
                                        key={variant.variant_id}
                                        className="basis-1/1 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                                    >
                                        <div className="w-full shadow-md bg-white rounded-md overflow-hidden">
                                            <NavLink
                                                to={linkPath}
                                                className="relative group block w-full h-[15rem] overflow-hidden"
                                            >
                                                {imgs[0] ? (
                                                    <img
                                                        src={`${serverUrl}/uploads/${imgs[0]}`}
                                                        alt={variant.product_name}
                                                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-100 group-hover:opacity-0"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                                        No image
                                                    </div>
                                                )}

                                                {imgs[1] && (
                                                    <img
                                                        src={`${serverUrl}/uploads/${imgs[1]}`}
                                                        alt={`${variant.product_name} hover`}
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
                                                    {variant.product_name}
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
                                                            {variant.compare_at &&
                                                                Number(variant.compare_at) > Number(variant.price) ? (
                                                                <>
                                                                    <span className="text-xs line-through text-gray-400">
                                                                        ₱
                                                                        {Number(variant.compare_at).toLocaleString()}
                                                                    </span>
                                                                    <span className="text-sm text-[#BC6C25] font-semibold">
                                                                        ₱{Number(variant.price).toLocaleString()}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm text-[#BC6C25] font-semibold">
                                                                    ₱{Number(variant.price).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {variant.compare_at &&
                                                            Number(variant.compare_at) > Number(variant.price) && (
                                                                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-[2px] rounded">
                                                                    {Math.round(
                                                                        ((Number(variant.compare_at) -
                                                                            Number(variant.price)) /
                                                                            Number(variant.compare_at)) *
                                                                        100
                                                                    )}
                                                                    % OFF
                                                                </span>
                                                            )}
                                                    </div>

                                                    {variant.is_scarcity ? (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            Only {rStockLeft} left
                                                        </p>
                                                    ) : (
                                                        typeof rStockLeft === "number" && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {rStockLeft} Available
                                                            </p>
                                                        )
                                                    )}
                                                </div>

                                                <button
                                                    disabled={rStockLeft <= 0 || spinningId === variant.variant_id}
                                                    onClick={async () => {
                                                        setSpinningId(variant.variant_id); // start loader
                                                        addToCart(variant);
                                                        setRelatedStockMap((prev) => ({
                                                            ...prev,
                                                            [variant.variant_id]: Math.max(0, rStockLeft - 1),
                                                        }));
                                                        setTimeout(() => setSpinningId(null), 700); // stop loader after 700ms
                                                    }}
                                                    className={`
    mt-2 w-full text-white p-[0.6rem] rounded-md text-sm flex items-center justify-center
    transition-all duration-300 font-medium
    ${rStockLeft <= 0 || spinningId === variant.variant_id
                                                            ? "bg-gray-400 cursor-not-allowed"
                                                            : "bg-[#D5A58B] hover:bg-[#dfb49d] shadow-md hover:shadow-lg cursor-pointer"
                                                        }
  `}
                                                >
                                                    <span className="relative flex items-center justify-center h-[1.3rem]">
                                                        {/* Loader */}
                                                        <span
                                                            className={`absolute flex gap-1 transition-opacity duration-300 ${spinningId === variant.variant_id ? "opacity-100" : "opacity-0"
                                                                }`}
                                                        >
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                                                        </span>

                                                        {/* Button Text */}
                                                        <span
                                                            className={`transition-opacity duration-300 ${spinningId === variant.variant_id ? "opacity-0" : "opacity-100"
                                                                }`}
                                                        >
                                                            {rStockLeft <= 0 ? "Out of Stock" : "Add to Cart"}
                                                        </span>
                                                    </span>
                                                </button>

                                            </div>
                                        </div>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>

                        {/* 👇 Position arrows properly */}
                        <CarouselPrevious className="absolute left-0 sm:-left-6 top-1/2 -translate-y-1/2 z-10" />
                        <CarouselNext className="absolute right-0 sm:-right-6 top-1/2 -translate-y-1/2 z-10" />
                    </Carousel>
                </section>
            )}


            {/* Feedback Section */}
            <section className="max-w-[90%] h-auto flex justify-center p-[1rem] mt-[4rem]">
                {loading ? (
                    <p className="text-gray-500">Loading feedbacks…</p>
                ) : (
                    <CustomerFeedbacks feedbacks={feedbacks} />
                )}
            </section>
        </main>
    );
};
