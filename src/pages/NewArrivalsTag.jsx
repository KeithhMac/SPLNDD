import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../api/axios";
import intro_bg from "../Images/intro-bg.png";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Skeleton } from "@/components/ui/skeleton";
import { socket } from "@/lib/socket";

/* shadcn/ui */
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/* tiny map for color dots */
const COLOR_MAP = {
  black: "#111827",
  white: "#ffffff",
  gray: "#9CA3AF",
  grey: "#9CA3AF",
  red: "#EF4444",
  pink: "#EC4899",
  beige: "#F5E6C8",
  green: "#10B981",
  blue: "#3B82F6",
  yellow: "#EAB308",
  orange: "#F59E0B",
  purple: "#8B5CF6",
  brown: "#92400E",
  cream: "#FFFDD0",
};

import { CustomerFeedbacks } from "@/components/CustomerFeeedbacks";



export const NewArrivalsTag = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const serverUrl = import.meta.env.VITE_SERVER_URL;


  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/customer/feedback/feedback/all");
        if (res.data?.success && Array.isArray(res.data.feedbacks)) {
          const mapped = res.data.feedbacks.map((f) => ({
            id: f.id,
            // backend already normalizes display_name ("Anonymous" when needed)
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
  // cart + local stock
  const { cart, addToCart } = useCart();
  const [localStockMap, setLocalStockMap] = useState({});

  // filters
  const PRICE_MIN = 0;
  const PRICE_MAX = 100000;
  const [priceRange, setPriceRange] = useState([PRICE_MIN, PRICE_MAX]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [open, setOpen] = useState(false);


  useEffect(() => {
    if (!socket) return;
    const handleStockChanged = ({ variant_id, new_stock }) => {
      setLocalStockMap((prev) => ({
        ...prev,
        [variant_id]: new_stock,
      }));
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



  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await api.get("/customer/products/tags/new-arrivals");
        const fetched = res.data || [];
        setProducts(fetched);

        // initialize local stock based on cart
        const stockMap = {};
        for (const p of fetched) {
          const cartItem = cart.find((item) => item.variant_id === p.variant_id);
          const remainingStock = (p.display_stock ?? 0) - (cartItem?.quantity || 0);
          stockMap[p.variant_id] = Math.max(0, remainingStock);
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

  // Build option lists from API-provided option_values
  const availableOptions = useMemo(() => {
    const map = {};
    for (const v of products) {
      if (!v?.option_values) continue;
      for (const [opt, val] of Object.entries(v.option_values)) {
        if (!map[opt]) map[opt] = new Set();
        if (val != null) map[opt].add(String(val));
      }
    }
    const obj = {};
    for (const [k, setVals] of Object.entries(map)) {
      obj[k] = Array.from(setVals).sort();
    }
    return obj;
  }, [products]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    return products.filter((v) => {
      const price = Number(v.price);
      if (Number.isFinite(price)) {
        if (price < priceRange[0] || price > priceRange[1]) return false;
      }
      const variantOptions = v?.option_values || {};
      for (const [optName, chosen] of Object.entries(selectedOptions)) {
        if (!chosen?.length) continue;
        const val = String(variantOptions[optName] ?? "");
        if (!chosen.includes(val)) return false;
      }
      return true;
    });
  }, [products, priceRange, selectedOptions]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const clearFilters = () => {
    setSelectedOptions({});
    setPriceRange([PRICE_MIN, PRICE_MAX]);
  };

  const countActiveSelections = Object.values(selectedOptions).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0
  );

  /* ===== Multi-checkbox Select (one per option) ===== */
  function OptionSelectMulti({
    label,
    items,
    selected = [],
    onChange,
    showColorDots = false,
  }) {
    const toggle = (val) => {
      if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
      else onChange([...selected, val]);
    };

    const dotFor = (value) => {
      if (!showColorDots) return null;
      const hex = COLOR_MAP[String(value).toLowerCase()];
      if (!hex) return null;
      return (
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border"
          style={{ background: hex }}
        />
      );
    };

    const summary = selected.length
      ? selected.slice(0, 2).join(", ") + (selected.length > 2 ? ` +${selected.length - 2}` : "")
      : `Select ${label}`;

    return (
      <div className="grid gap-2">
        <Label className="text-sm">{label}</Label>

        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={summary}>{summary}</SelectValue>
          </SelectTrigger>

          <SelectContent>
            <div className="flex flex-col gap-2 p-2">
              {items.map((val) => {
                const checked = selected.includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2 text-sm cursor-pointer select-none"
                    onClick={(e) => {
                      e.preventDefault();
                      toggle(val);
                    }}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(val)} />
                    {dotFor(val)}
                    <span>{val}</span>
                  </label>
                );
              })}
            </div>
          </SelectContent>
        </Select>
      </div>
    );
  }

  const [spinningId, setSpinningId] = useState(null);


  // ---- SKELETON LOADING FOR PRODUCT GRID ----
  const [showSkeleton, setShowSkeleton] = useState(false);



  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => setShowSkeleton(false), 2000); // 2 seconds delay
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || showSkeleton) {
    const skeletonClass = "bg-gray-300 dark:bg-gray-700";
    return (
      <main className="min-h-screen overflow-x-hidden flex flex-col gap-[2rem] mb-[5rem] ">
        <div
          className="w-full h-[20rem] bg-cover bg-top flex flex-wrap items-center justify-center text-white rounded-2xl my-[1rem] bg-black/20 bg-blend-overlay bg-fixed"
          style={{ backgroundImage: `url(${intro_bg})` }}
        >
          <div className="flex flex-col justify-center items-center">
            <Skeleton className="h-8 w-1/4 mb-2 bg-gray-400" />
            <Skeleton className="h-4 w-1/3 mb-2 bg-gray-300" />
          </div>
        </div>
        <section className="p-[1rem] mx-auto w-full max-w-6xl px-4 md:px-6 ">
          <div className="flex items-center justify-end gap-3 ">
            <Skeleton className="h-8 w-24 rounded bg-gray-300" />
          </div>
          <div className="p-[1rem] mt-6 flex flex-wrap justify-center gap-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-[15rem] shadow-lg bg-white rounded-md overflow-hidden flex flex-col"
              >
                <Skeleton className={`w-full h-[15rem] ${skeletonClass}`} />
                <div className="p-4 flex flex-col gap-2">
                  <Skeleton className="h-5 w-3/4 mb-2 bg-gray-300" />
                  <Skeleton className="h-4 w-1/2 mb-1 bg-gray-200" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-1/3 bg-gray-200" />
                    <Skeleton className="h-4 w-1/4 bg-gray-200" />
                  </div>
                  <Skeleton className="h-8 w-full mt-2 bg-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    );
  }


  return (
    <main className="min-h-screen overflow-x-hidden flex flex-col gap-[2rem]  ">
      {/* Hero Banner */}
      <div
        className="w-full h-[15rem] bg-cover bg-center flex items-center justify-center text-white rounded-xl mb-10 bg-black/30 bg-blend-overlay mt-5"
        style={{ backgroundImage: `url(${intro_bg})` }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold">🆕 New Arrivals</h1>
          <p className="mt-2 text-sm max-w-md mx-auto">
            Explore our freshest releases for both men and women — discover what's new in oversized
            comfort and bold design.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-end gap-3 pr-[1rem] md:pr-[5rem]">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {countActiveSelections ? (
                <span className="ml-1 text-muted-foreground">({countActiveSelections})</span>
              ) : null}
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[20rem] p-[1rem]">
            <div className="p-4 border-b flex items-center justify-between mt-[5rem]">
              <SheetTitle>Filters</SheetTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="px-4 py-4 overflow-y-auto max-h-[calc(100vh-112px)] space-y-6">
              {/* Price range */}
              <div className="grid gap-2">
                <Label className="text-sm">Price range</Label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    ₱{priceRange[0].toLocaleString("en-PH")}
                  </span>
                  <Slider
                    value={priceRange}
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={100}
                    onValueChange={setPriceRange}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    ₱{priceRange[1].toLocaleString("en-PH")}
                  </span>
                </div>
              </div>

              {/* Option dropdowns */}
              {Object.keys(availableOptions).length ? (
                <div className="flex flex-col gap-4">
                  {Object.entries(availableOptions).map(([optName, values]) => (
                    <OptionSelectMulti
                      key={optName}
                      label={optName}
                      items={values}
                      selected={selectedOptions[optName] ?? []}
                      onChange={(arr) =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          [optName]: arr,
                        }))
                      }
                      showColorDots={/color|colour|shade/i.test(optName)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No variant options available.</p>
              )}
            </div>

            <div className="p-4 border-t mt-[5rem]">
              <Button className="w-full bg-[#D5A58B] hover:bg-[#e0b9a4]" onClick={() => setOpen(false)}>
                View Items ({filteredProducts.length})
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Products */}
      {loading ? (
        <p className="text-center mt-6">Loading...</p>
      ) : filteredProducts.length > 0 ? (
        <>
          <div className="mt-6 flex flex-wrap justify-center gap-8 pl-[3.1rem] pr-[3rem] pb-[5rem]">
            {paginatedProducts.map((variant) => {
              const images = Array.isArray(variant.image_urls) ? variant.image_urls.slice(0, 2) : [];
              const category = variant.category_name?.toLowerCase?.();
              const type = variant.type_name?.toLowerCase?.().replace(/\s+/g, "-");
              const productSlug =
                variant.product_name?.toLowerCase?.().replace(/\s+/g, "-") || "product";
              const linkPath =
                category && type
                  ? `/${category}/${type}/${productSlug}/${variant.sku}`
                  : `/product/${productSlug}/${variant.sku}`;

              const stockLeft =
                localStockMap[variant.variant_id] ??
                (Number.isFinite(Number(variant.display_stock)) ? Number(variant.display_stock) : 0);

              return (
                <div key={variant.variant_id} className="w-[15rem] shadow-lg bg-white rounded-md overflow-hidden">
                  <NavLink to={linkPath} className="relative group block w-full h-[15rem] overflow-hidden">

                    {/* New Arrival Badge */}
                    <div className="absolute top-2 right-2 bg-[#BC6C25] text-white text-xs font-semibold px-2 py-1 rounded shadow-md z-10">
                      New Arrival!
                    </div>

                    {images[0] ? (
                      <img
                        src={`${serverUrl}/uploads/${images[0]}`}
                        alt={variant.product_name}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-100 group-hover:opacity-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </div>
                    )}

                    {images[1] && (
                      <img
                        src={`${serverUrl}/uploads/${images[1]}`}
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
                    <h2 className="text-lg font-semibold text-black">{variant.product_name}</h2>

                    {/* Variant options row (Size · Color etc.) */}
                    {variant.option_values && Object.keys(variant.option_values).length > 0 && (
                      <div className="text-sm text-gray-600">
                        {Object.entries(variant.option_values).map(([key, value], idx, arr) => (
                          <span key={key}>
                            {String(value)}
                            {idx < arr.length - 1 && <span className="mx-1">·</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex flex-col items-start gap-[0.2rem]">
                        <div className="flex items-center gap-2">
                          {variant.compare_at && Number(variant.compare_at) > Number(variant.price) ? (
                            <>
                              <span className="text-xs line-through text-gray-400">
                                ₱{Number(variant.compare_at).toLocaleString()}
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

                        {variant.compare_at && Number(variant.compare_at) > Number(variant.price) && (
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-[2px] rounded">
                            {Math.round(
                              ((Number(variant.compare_at) - Number(variant.price)) / Number(variant.compare_at)) * 100
                            )}
                            % OFF
                          </span>
                        )}
                      </div>

                      {variant.is_scarcity ? (
                        <p className="text-xs text-red-600 mt-1">Only {stockLeft} left</p>
                      ) : typeof stockLeft === "number" && stockLeft !== null ? (
                        <p className="text-xs text-gray-600 mt-1">{stockLeft} Available</p>
                      ) : null}
                    </div>

                    <button
                      disabled={stockLeft <= 0 || spinningId === variant.variant_id}
                      onClick={async () => {
                        setSpinningId(variant.variant_id); // start loader
                        addToCart(variant);
                        setLocalStockMap((prev) => ({
                          ...prev,
                          [variant.variant_id]: Math.max(
                            0,
                            (prev[variant.variant_id] ?? stockLeft) - 1
                          ),
                        }));
                        setTimeout(() => setSpinningId(null), 700); // stop loader after 700ms
                      }}
                      className={`
    mt-2 w-full text-white p-[0.6rem] rounded-md text-sm flex items-center justify-center
    transition-all duration-300 font-medium
    ${stockLeft <= 0 || spinningId === variant.variant_id
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
                          {stockLeft <= 0 ? "Out of Stock" : "Add to Cart"}
                        </span>
                      </span>
                    </button>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500 mt-6">No new arrivals found.</p>
      )}


      {/* Feedback Section */}
      <section className="h-auto flex justify-center p-[1rem] mt-[4rem]">
        {loading ? (
          <p className="text-gray-500">Loading feedbacks…</p>
        ) : (
          <CustomerFeedbacks feedbacks={feedbacks} />
        )}
      </section>

    </main>
  );
};
