import React, { useEffect, useState, useMemo, useContext, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

import { AdminAuthContext } from "@/context/AdminAuthContext";

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { EllipsisVertical, Printer } from "lucide-react";
import api from "../api/axios";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminViewOrder = () => {
  const API_BASE = import.meta.env.VITE_SERVER_URL?.replace(/\/+$/, "") || "";
  const UPLOADS_BASE = `${API_BASE}/uploads`;

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [searchRef, setSearchRef] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [sortOrder, setSortOrder] = useState("none");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetOrder, setStatusTargetOrder] = useState(null);

  // Pagination
  const [productPage, setProductPage] = useState(1);
  const itemsPerPage = 10;

  // Print ref
  const printRef = useRef();

  // Fetch orders
  const fetchOrders = React.useCallback(async () => {
    try {
      setLoadingOrders(true);
      const { data } = await api.get("/customer/orders/all");
      if (data?.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      toast.error("Failed to fetch orders", {
        description: err.response?.data?.message || "Server error",
      });
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setProductPage(1);
  }, [searchRef, statusFilter, sortOrder]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchRef.trim()) {
      const q = searchRef.trim().toLowerCase();
      result = result.filter((o) =>
        String(o.order_reference || "")
          .toLowerCase()
          .includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (o) => String(o.order_status || "").toLowerCase() === statusFilter
      );
    }

    if (sortOrder === "asc") {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortOrder === "desc") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [orders, searchRef, statusFilter, sortOrder]);

  const totalProductPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginatedOrders = useMemo(() => {
    const start = (productPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, productPage]);

  const formatMoney = (val) =>
    `₱${Number(val ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "-");

  const hasCoupon = (o) =>
    Number(o?.coupon_discount_amount || 0) > 0 ||
    Number(o?.coupon_shipping_discount || 0) > 0 ||
    !!o?.coupon_id;

  const combinedDiscount = (o) =>
    Number(o?.coupon_discount_amount || 0) + Number(o?.coupon_shipping_discount || 0);

  // Print receipt function
  const handlePrintReceipt = () => {
    if (!selectedOrder) return;

    const printWindow = window.open("", "_blank");
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Receipt - ${selectedOrder.order_reference}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .receipt {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #333;
            }
            .header p {
              margin: 5px 0 0 0;
              color: #666;
              font-size: 12px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 10px;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .detail-label {
              color: #666;
              font-weight: 500;
            }
            .detail-value {
              color: #333;
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 13px;
            }
            table thead {
              background-color: #f0f0f0;
              border-bottom: 2px solid #333;
            }
            table th {
              padding: 10px;
              text-align: left;
              font-weight: bold;
              color: #333;
            }
            table td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            table td:nth-child(3),
            table td:nth-child(4) {
              text-align: right;
            }
            .totals {
              border-top: 2px solid #333;
              border-bottom: 2px solid #333;
              padding: 15px 0;
              margin-top: 20px;
              margin-bottom: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .total-row.grand-total {
              font-weight: bold;
              font-size: 16px;
              margin-top: 10px;
              color: #333;
            }
            .coupon-badge {
              display: inline-block;
              background-color: #e8f5e9;
              color: #2e7d32;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              border: 1px solid #4caf50;
              margin-bottom: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #999;
              font-size: 11px;
            }
            @media print {
              body {
                background-color: white;
                padding: 0;
              }
              .receipt {
                box-shadow: none;
                margin: 0;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <!-- Header -->
            <div class="header">
              <h1>ORDER RECEIPT</h1>
              <p>SPLND'D</p>
            </div>

            <!-- Customer Info -->
            <div class="section">
              <div class="section-title">CUSTOMER INFORMATION</div>
              <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${selectedOrder.address_name || "—"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact:</span>
                <span class="detail-value">${selectedOrder.address_contact || "—"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Shipping Address:</span>
                <span class="detail-value">${selectedOrder.address_street || "—"}, ${selectedOrder.address_district || "—"}, ${selectedOrder.address_city || "—"}, ${selectedOrder.address_province || "—"}</span>
              </div>
            </div>

            <!-- Order Info -->
            <div class="section">
              <div class="section-title">ORDER INFORMATION</div>
              <div class="detail-row">
                <span class="detail-label">Payment Reference:</span>
                <span class="detail-value">${selectedOrder.payment_reference || "—"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Reference:</span>
                <span class="detail-value">${selectedOrder.order_reference || "—"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="text-transform: capitalize;">${selectedOrder.order_status || "—"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Status:</span>
                <span class="detail-value" style="text-transform: capitalize;">${selectedOrder.payment_status || "—"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formatDate(selectedOrder.created_at)}</span>
              </div>
            </div>

            <!-- Items -->
            <div class="section">
              <div class="section-title">ORDER ITEMS</div>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedOrder.items
        .map(
          (item) => `
                    <tr>
                      <td>${item.sku || "—"}</td>
                      <td>${item.sku?.replace(/-b\d+/gi, "") || "Product"}</td>
                      <td>${item.quantity || 1}</td>
                      <td>${formatMoney(item.price)}</td>
                    </tr>
                  `
        )
        .join("")}
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="totals">
              <div class="total-row">
                <span>Subtotal (items):</span>
                <span>${formatMoney(selectedOrder.original_subtotal)}</span>
              </div>

              ${hasCoupon(selectedOrder)
        ? `
                <div class="total-row">
                  <span>
                    <span class="coupon-badge">${selectedOrder.coupon_label || selectedOrder.coupon_deal || "Coupon Applied"}</span>
                  </span>
                  <span style="color: #2e7d32;">− ${formatMoney(combinedDiscount(selectedOrder))}</span>
                </div>
              `
        : ""
      }

              <div class="total-row">
                <span>Shipping Fee:</span>
                <span>${formatMoney(selectedOrder.original_shipping_fee)}</span>
              </div>

              <div class="total-row grand-total">
                <span>GRAND TOTAL:</span>
                <span>${formatMoney(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>Thank you for your order!</p>
              <p>For inquiries, please contact our customer support.</p>
              <p style="margin-top: 20px; font-size: 10px;">
                Printed on: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Skeleton+loading pattern
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) setShowSkeleton(true);
    else {
      const timer = setTimeout(() => setShowSkeleton(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || showSkeleton) {
    return (
      <main>
        <section className="bg-white shadow-lg rounded-xl border border-gray-200 p-4 min-h-[90dvh] w-full">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 w-32 bg-gray-200" />
            <Skeleton className="h-9 w-24 bg-gray-100 rounded" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <Skeleton className="h-10 w-full sm:w-64 bg-gray-100 rounded" />
            <div className="flex gap-4 flex-wrap w-full">
              <Skeleton className="h-10 w-full sm:w-48 bg-gray-100 rounded" />
              <Skeleton className="h-10 w-full sm:w-40 bg-gray-100 rounded" />
            </div>
          </div>

          <div className="w-full overflow-auto border rounded-md shadow-sm">
            <table className="min-w-full">
              <thead>
                <tr>
                  {["Order Reference", "Order Status", "Customer", "Total", "Payment Status", "Date"].map((h) => (
                    <th key={h} className="px-2 sm:px-4 py-3 text-left">
                      <Skeleton className="h-5 w-20 sm:w-28 bg-gray-200" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {Array(6)
                      .fill(0)
                      .map((__, j) => (
                        <td key={j} className="px-2 sm:px-4 py-4">
                          <Skeleton
                            className={
                              j === 3
                                ? "h-5 w-16 bg-gray-100"
                                : "h-5 w-28 bg-gray-100"
                            }
                          />
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
            <Skeleton className="h-9 w-9 rounded bg-gray-100" />
            <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-white shadow-lg rounded-xl border border-gray-200 p-4 min-h-[90dvh] w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight">Orders List</h2>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <Input
            placeholder="Search by ORDER REF"
            className="w-full md:w-[16rem]"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
          />

          <div className="flex gap-4 flex-wrap w-full">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[12rem]">
                <SelectValue placeholder="Filter ORD Status" />
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

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full md:w-[10rem]">
                <SelectValue placeholder="Sort by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="asc">Date Asc</SelectItem>
                <SelectItem value="desc">Date Desc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full overflow-auto border rounded-md shadow-sm">
          <Table>
            <TableCaption className="sr-only">
              {loadingOrders
                ? "Loading orders…"
                : paginatedOrders.length === 0
                  ? "No orders found."
                  : "All orders"}
            </TableCaption>

            <TableHeader className="sticky top-0 z-10 bg-[#E1E7E4]">
              <TableRow>
                <TableHead>Order Reference</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loadingOrders ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading orders…
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((o) => (
                  <TableRow key={o.order_reference}>
                    <TableCell className="font-medium">
                      {o.order_reference}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs border capitalize
                          ${o.order_status === "completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : o.order_status === "pending"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : o.order_status === "shipped"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : o.order_status === "cancelled"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                        >
                          {o.order_status}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(o);
                                setTimeout(() => setDialogOpen(true), 0);
                              }}
                            >
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setStatusTargetOrder(o);
                                setTimeout(() => setStatusModalOpen(true), 0);
                              }}
                            >
                              Change Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                    <TableCell>{o.address_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-baseline">
                        <span>{formatMoney(o.total_amount)}</span>

                        {hasCoupon(o) && (
                          <div className="mt-0.5 flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-[1px]">
                              {o.coupon_label}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {o.payment_status}
                    </TableCell>
                    <TableCell>{formatDate(o.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalProductPages > 1 && (
          <div className="mt-4 flex justify-end">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setProductPage((prev) => Math.max(prev - 1, 1))
                    }
                    className={
                      productPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalProductPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={productPage === page}
                        onClick={() => setProductPage(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setProductPage((prev) =>
                        Math.min(prev + 1, totalProductPages)
                      )
                    }
                    className={
                      productPage === totalProductPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[30rem] sm:w-[50rem]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Full order summary and item details.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReceipt}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          </DialogHeader>

          <ScrollArea className="h-[30rem]">
            {!selectedOrder ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading order details…
              </div>
            ) : (
              <div className="m-5" ref={printRef}>
                <section className="border border-gray-200 rounded-lg bg-white shadow-sm p-4 mb-4">
                  <div className="grid gap-2 text-sm text-gray-700">
                    <div>
                      <span className="font-semibold text-gray-900">
                        Customer:
                      </span>{" "}
                      {selectedOrder.address_name || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        Contact:
                      </span>{" "}
                      {selectedOrder.address_contact || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        Shipping Address:
                      </span>{" "}
                      {selectedOrder.address_street || "—"}, {selectedOrder.address_district || "—"},{" "}
                      {selectedOrder.address_city || "—"}, {selectedOrder.address_province || "—"}
                    </div>
                  </div>
                </section>

                <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-4 mb-4">
                  <div className="grid gap-2 text-sm text-gray-700">
                    <div>
                      <span className="font-semibold text-gray-900">
                        Payment Reference:
                      </span>{" "}
                      {selectedOrder.payment_reference}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        Order Reference:
                      </span>{" "}
                      {selectedOrder.order_reference}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        Status:
                      </span>{" "}
                      <span className="capitalize">
                        {selectedOrder.order_status}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        Payment Status:
                      </span>{" "}
                      <span className="capitalize">
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Date:</span>{" "}
                      {formatDate(selectedOrder.created_at)}
                    </div>
                  </div>
                </div>

                <section>
                  <p className="font-semibold mb-2 text-gray-900 text-base">
                    Items
                  </p>
                  <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[64px]">Image</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => {
                          const imageUrl = item.image_key
                            ? `${UPLOADS_BASE}/${item.image_key}`
                            : null;

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.sku}
                                    className="h-12 w-12 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="h-12 w-12 flex items-center justify-center border text-xs text-gray-400">
                                    No Image
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="truncate">
                                {item.sku}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatMoney(item.price)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Totals */}
                    <div className="p-4 border-t text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Subtotal (items):</span>
                        <span>{formatMoney(selectedOrder.original_subtotal)}</span>
                      </div>

                      {hasCoupon(selectedOrder) && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-[2px] text-xs">
                                {selectedOrder.coupon_label || selectedOrder.coupon_deal || "Coupon Applied"}
                              </span>
                              {selectedOrder.coupon_deal && (
                                <span className="text-xs text-gray-600">{selectedOrder.coupon_deal}</span>
                              )}
                            </div>

                            {combinedDiscount(selectedOrder) > 0 && (
                              <span className="text-xs text-green-700">
                                − {formatMoney(combinedDiscount(selectedOrder))}
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-700 font-medium">Shipping Fee :</span>
                        <span className="font-medium">{formatMoney(selectedOrder.original_shipping_fee)}</span>
                      </div>

                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>Grand Total:</span>
                        <span>{formatMoney(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="secondary"
                className="cursor-pointer bg-gray-300 hover:bg-gray-100"
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        {statusTargetOrder && (
          <DialogContent className="max-w-sm text-center flex flex-col justify-center items-center">
            <DialogHeader>
              <DialogTitle>Change Order Status</DialogTitle>
              <DialogDescription>
                <span className="font-semibold">
                  {statusTargetOrder.order_reference}
                </span>
              </DialogDescription>
            </DialogHeader>

            {["cancelled", "failed", "completed"].includes(
              statusTargetOrder.order_status
            ) ? (
              <div className="text-sm text-muted-foreground">
                This order is <strong>{statusTargetOrder.order_status}</strong>{" "}
                and cannot be updated.
              </div>
            ) : (
              <StatusForm
                order={statusTargetOrder}
                onClose={() => {
                  setStatusModalOpen(false);
                  setStatusTargetOrder(null);
                  fetchOrders();
                }}
              />
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
};

const StatusForm = ({ order, onClose }) => {
  const { admin } = useContext(AdminAuthContext);
  const [courier, setCourier] = useState("");
  const [courierRef, setCourierRef] = useState("");
  const [deliveryDate, setDeliveryDate] = useState();
  const [deliveryTime, setDeliveryTime] = useState("12:00");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const isShippedUpdate =
    order.order_status === "pending" && newStatus === "shipped";

  const isCompleteUpdate =
    order.order_status === "shipped" && newStatus === "completed";

  const isValid =
    (isShippedUpdate && courier && courierRef.trim() !== "") ||
    (isCompleteUpdate && deliveryDate && deliveryTime);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const payload = { status: newStatus, adminEmail: admin?.email };
      if (isShippedUpdate) {
        payload.courier = courier;
        payload.courier_reference = courierRef;
      } else if (isCompleteUpdate) {
        const [hours, minutes] = deliveryTime.split(":");
        const date = new Date(deliveryDate);
        date.setHours(+hours);
        date.setMinutes(+minutes);
        payload.delivered_at = date.toISOString();
      }
      await api.patch(`/customer/orders/${order.id}/status`, payload);
      toast.success(`Order marked as ${newStatus}`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select onValueChange={setNewStatus}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select new status" />
        </SelectTrigger>
        <SelectContent>
          {order.order_status === "pending" && (
            <SelectItem value="shipped">Mark as Shipped</SelectItem>
          )}
          {order.order_status === "shipped" && (
            <SelectItem value="completed">Mark as Completed</SelectItem>
          )}
        </SelectContent>
      </Select>

      {isShippedUpdate && (
        <>
          <div className="space-y-2">
            <Label className="block text-sm">Select Courier</Label>
            <div className="flex items-center gap-4">
              <div className="flex justify-center w-full items-center gap-2">
                <Checkbox
                  id="jnt"
                  checked={courier === "jnt"}
                  onCheckedChange={() => setCourier("jnt")}
                />
                <label htmlFor="jnt" className="text-sm">
                  J&T
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="courierRef">Courier Reference</Label>
            <Input
              id="courierRef"
              value={courierRef}
              onChange={(e) => setCourierRef(e.target.value)}
              placeholder="Enter tracking number"
            />
          </div>
        </>
      )}

      {isCompleteUpdate && (
        <div className="space-y-1">
          <Label className="block text-sm">Delivered At</Label>
          <div className="flex gap-4">
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={deliveryDate}
                onSelect={setDeliveryDate}
                className="rounded-md border"
              />
            </div>

            <div className="flex-1 space-y-2">
              <Label className="block text-sm">Time</Label>
              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, hour) =>
                    ["00", "30"].map((min) => {
                      const value = `${String(hour).padStart(2, "0")}:${min}`;
                      return (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <Button
        disabled={!isValid || !newStatus || updating}
        onClick={handleUpdate}
        className="w-full"
      >
        {updating ? "Updating..." : "Update Status"}
      </Button>
    </div>
  );
};