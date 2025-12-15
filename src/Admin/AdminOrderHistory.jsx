import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchRef, setSearchRef] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const pageSize = 8;

  // Simulate an initial loading effect
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400); // simulate permission fetch, etc.
    return () => clearTimeout(timer);
  }, []);

  // Skeleton delay: 2s after loading finishes
  useEffect(() => {
    if (loading) setShowSkeleton(true);
    else {
      const timer = setTimeout(() => setShowSkeleton(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/customer/orders/all");
      if (data?.success) setOrders(data.orders || []);
    } catch (err) {
      toast.error("Failed to fetch order history", {
        description: err?.response?.data?.message || "Server error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatMoney = (val) =>
    `₱${Number(val ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

  const statusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "completed") return "bg-green-50 text-green-700 border border-green-200";
    if (s === "pending") return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    if (s === "shipped") return "bg-blue-50 text-blue-700 border border-blue-200";
    if (s === "cancelled") return "bg-red-50 text-red-700 border border-red-200";
    if (s === "failed") return "bg-gray-100 text-gray-700 border border-gray-300";
    return "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const filtered = useMemo(() => {
    const q = searchRef.trim().toLowerCase();
    let res = orders;
    if (q) {
      res = res.filter((o) =>
        String(o.order_reference || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      res = res.filter(
        (o) => String(o.order_status || "").toLowerCase() === statusFilter
      );
    }
    return res;
  }, [orders, searchRef, statusFilter]);

  const withCalcs = useMemo(() => {
    return filtered.map((o) => {
      const items = (o.items || []).map((it) => {
        const quantity = Number(it.quantity ?? 0);
        const price = Number(it.price ?? 0);
        const revenue = quantity * price;
        return { ...it, quantity, price, revenue };
      });

      const totals = items.reduce(
        (acc, it) => {
          acc.revenue += it.revenue;
          return acc;
        },
        { revenue: 0 }
      );

      return { ...o, items, totals };
    });
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(withCalcs.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return withCalcs.slice(start, start + pageSize);
  }, [withCalcs, page]);

  useEffect(() => {
    setPage(1);
  }, [searchRef, statusFilter]);

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      toast.error("Failed to copy");
    }
  };

  const hasCoupon = (o) =>
    Number(o?.coupon_discount_amount || 0) > 0 ||
    Number(o?.coupon_shipping_discount || 0) > 0 ||
    !!o?.coupon_id;

  const combinedDiscount = (o) =>
    Number(o?.coupon_discount_amount || 0) + Number(o?.coupon_shipping_discount || 0);


  // --- Skeleton loading UI ---
  if (loading || showSkeleton) {
    return (
      <main className="w-full px-2 ">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4 shadow-sm rounded-lg bg-white p-2">
          <Skeleton className="h-7 w-44 sm:w-72 bg-gray-200" />
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-64 bg-gray-100 rounded" />
            <Skeleton className="h-10 w-full sm:w-40 bg-gray-100 rounded" />
            <Skeleton className="h-10 w-full sm:w-28 bg-gray-100 rounded" />
          </div>
        </div>
        {/* List of order skeleton cards */}
        <div className="space-y-6">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="border border-gray-200 shadow-sm rounded-lg bg-white">
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20 bg-gray-100" />
                    <Skeleton className="h-6 w-36 bg-gray-200" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded bg-gray-100" />
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700 mt-2">
                  <Skeleton className="h-4 w-40 bg-gray-100" />
                  <Skeleton className="h-4 w-40 bg-gray-100" />
                  <Skeleton className="h-4 w-40 bg-gray-100" />
                  <Skeleton className="h-4 w-40 bg-gray-100" />
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="border rounded-md overflow-hidden bg-white">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        {["SKU", "Qty", "Price", "Revenue"].map((h) => (
                          <th key={h} className="px-2 sm:px-4 py-2 text-left">
                            <Skeleton className="h-4 w-16 sm:w-20 bg-gray-200" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(2)].map((__, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="px-2 sm:px-4 py-2">
                            <Skeleton className="h-4 w-24 bg-gray-100" />
                          </td>
                          <td className="px-2 sm:px-4 py-2">
                            <Skeleton className="h-4 w-8 bg-gray-100" />
                          </td>
                          <td className="px-2 sm:px-4 py-2">
                            <Skeleton className="h-4 w-16 bg-gray-100" />
                          </td>
                          <td className="px-2 sm:px-4 py-2">
                            <Skeleton className="h-4 w-16 bg-gray-100" />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="text-right font-semibold">
                          <Skeleton className="h-4 w-16 bg-gray-100 mx-auto" />
                        </td>
                        <td className="text-right font-semibold">
                          <Skeleton className="h-4 w-16 bg-gray-100 mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Coupon and totals skeleton */}
                <div className="mt-3 space-y-2 text-sm">
                  <Skeleton className="h-8 w-44 bg-emerald-100 rounded" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Skeleton className="h-8 w-full bg-gray-100 rounded" />
                    <Skeleton className="h-8 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination skeleton */}
        <div className="mt-6 flex justify-end gap-2">
          <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
          <Skeleton className="h-9 w-9 rounded bg-gray-100" />
          <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4 shadow-sm rounded-lg bg-white p-2">
        <h2 className="text-xl font-semibold tracking-tight">Order History</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by ORDER REF (e.g. ORD-...)"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            className="w-full sm:w-[20rem]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[12rem]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchOrders}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading order history…
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No orders found.
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {paginated.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 shadow-sm rounded-lg bg-white"
              >
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Order Ref</span>
                        {order.order_reference && (
                          <button
                            onClick={() => copy(order.order_reference)}
                            className="text-xs text-blue-600 underline"
                          >
                            copy
                          </button>
                        )}
                      </div>
                      <div className="text-lg font-semibold tracking-tight">
                        {order.order_reference || "—"}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs capitalize ${statusBadge(
                        order.order_status
                      )}`}
                    >
                      {order.order_status}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                    <div>
                      <span className="font-medium text-gray-900">Transaction Ref:</span>{" "}
                      {order.payment_reference || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Ordered:</span>{" "}
                      {formatDate(order.created_at)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Courier:</span>{" "}
                      {order.courier || "—"}{" "}
                      {order.courier_reference ? `• ${order.courier_reference}` : ""}
                    </div>
                    {order.delivered_at && (
                      <div>
                        <span className="font-medium text-gray-900">Delivered:</span>{" "}
                        {formatDate(order.delivered_at)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="border rounded-md overflow-hidden bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((it, idx) => (
                          <TableRow key={`${order.id}-${it.variant_id}-${idx}`}>
                            <TableCell className="truncate">{it.sku}</TableCell>
                            <TableCell className="text-right">{it.quantity}</TableCell>
                            <TableCell className="text-right">{formatMoney(it.price)}</TableCell>
                            <TableCell className="text-right">
                              {formatMoney(it.quantity * it.price)}
                            </TableCell>
                          </TableRow>
                        ))}

                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={3} className="text-right font-semibold">
                            Totals:
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatMoney(order.totals.revenue)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    {/* Coupon summary (only if coupon applied/present) */}
                    {hasCoupon(order) && (
                      <div className="border rounded px-3 py-2 bg-emerald-50/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Label (or deal as fallback) */}
                            <span className="inline-flex items-center rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-[2px] text-xs">
                              {order.coupon_label || order.coupon_deal || "Coupon"}
                            </span>
                            {/* Optional: deal text (e.g., “10% off (cap ₱500)”) */}
                            {order.coupon_deal && (
                              <span className="text-xs text-gray-600">{order.coupon_deal}</span>
                            )}
                          </div>
                          {/* Combined discount */}
                          {combinedDiscount(order) > 0 && (
                            <span className="text-xs text-green-700">
                              − {formatMoney(combinedDiscount(order))}
                            </span>
                          )}
                        </div>

                        {/* Exact amounts
                        {Number(order.coupon_discount_amount || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Items Discount:</span>
                            <span className="text-green-700">
                              − {formatMoney(order.coupon_discount_amount)}
                            </span>
                          </div>
                        )}
                        {Number(order.coupon_shipping_discount || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Shipping Discount:</span>
                            <span className="text-green-700">
                              − {formatMoney(order.coupon_shipping_discount)}
                            </span>
                          </div>
                        )} */}
                      </div>
                    )}

                    {/* Final fee + total (server-computed; already includes coupon) */}
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div className="flex justify-between border rounded px-3 py-2">
                        <span className="text-gray-700 font-medium">Shipping Fee</span>
                        <span>{formatMoney(order.shipping_fee_at_order)}</span>
                      </div>
                      <div className="flex justify-between border rounded px-3 py-2">
                        <span className="text-gray-900 font-semibold">Grand Total</span>
                        <span className="font-semibold">{formatMoney(order.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={page === i + 1}
                        onClick={() => setPage(i + 1)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </main>
  );
};
