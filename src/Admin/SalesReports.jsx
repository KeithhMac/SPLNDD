import React, { useEffect, useMemo, useState, useCallback } from "react";
import api from "@/api/axios";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

import { SalesInvoice } from "@/components/SalesInvoice";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* ----------------------------- Helpers ---------------------------------- */
const peso = (v) =>
  `₱${Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

/* -------------------------- PDF Styles ---------------------------------- */
const styles = StyleSheet.create({
  page: {
    paddingTop: 120,
    paddingBottom: 80,
    paddingHorizontal: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#F0FDF4",
  },

  header: {
    position: "absolute",
    top: 24,
    left: 32,
    right: 32,
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  headerCompany: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
  headerTitle: { fontSize: 13, color: "#ECFDF5" },
  rangePillWrap: {
    marginTop: 6,
    alignItems: "center",
  },
  rangePill: {
    backgroundColor: "#D1FAE5",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  rangePillText: { fontSize: 9, color: "#065F46" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 12,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#D1FAE5",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    fontWeight: "bold",
    color: "#064E3B",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tableRowAlt: {
    backgroundColor: "#F6FEF9",
  },
  cell: { paddingRight: 8, color: "#0F172A" },
  colInvoice: { flex: 1 },
  colDate: { flex: 1.4 },
  colNum: { flex: 1, textAlign: "right" },

  totalsRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "#DCFCE7",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderTopWidth: 1,
    borderTopColor: "#A7F3D0",
  },
  totalsLabel: { fontWeight: "bold", color: "#065F46" },

  footer: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 24,
    fontSize: 10,
    color: "#065F46",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#A7F3D0",
    paddingTop: 6,
  },

  section: { marginTop: 8 },
});

const money = (v) =>
  String(Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));

// PDF Document Component
const SalesReportPDF = ({ filtered, totals, dateFrom, dateTo }) => {
  const now = format(new Date(), "PPP p");

  const parts = [];
  if (dateFrom) parts.push(`From: ${dateFrom}`);
  if (dateTo) parts.push(`To: ${dateTo}`);
  const range = parts.length ? parts.join(" | ") : "All Dates";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerCompany}>Splnd-d Clothing</Text>
            <Text style={styles.headerTitle}>Sales Summary Report</Text>
          </View>
          <View style={styles.rangePillWrap}>
            <View style={styles.rangePill}>
              <Text style={styles.rangePillText}>{range}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.section]}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colInvoice, styles.tableHeaderText]}>
              Sales ID
            </Text>
            <Text style={[styles.cell, styles.colDate, styles.tableHeaderText]}>
              Date
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>
              Revenue (PHP)
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>
              Discount (PHP)
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>
              Net&nbsp;Sales (PHP)
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>
              Cost (PHP)
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.tableHeaderText]}>
              Profit (PHP)
            </Text>
          </View>

          {filtered.map((order, idx) => {
            const discount =
              (order?.coupon?.itemsDiscount || 0) +
              (order?.coupon?.shippingDiscount || 0);
            const costOfItems = (order?.items || []).reduce(
              (sum, item) =>
                sum +
                Number(item?.cost_per_item || 0) * Number(item?.quantity || 0),
              0
            );
            const netSales = Number(order?.totals?.revenue || 0) - discount;
            const dateStr = format(order.date, "MMM dd, yyyy");

            return (
              <View
                key={order.invoice}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : null,
                ]}
              >
                <Text style={[styles.cell, styles.colInvoice]}>
                  {String(order.invoice)}
                </Text>
                <Text style={[styles.cell, styles.colDate]}>{dateStr}</Text>
                <Text style={[styles.cell, styles.colNum]}>{money(order.totals.revenue)}</Text>
                <Text style={[styles.cell, styles.colNum]}>{money(discount)}</Text>
                <Text style={[styles.cell, styles.colNum]}>{money(netSales)}</Text>
                <Text style={[styles.cell, styles.colNum]}>{money(costOfItems)}</Text>
                <Text style={[styles.cell, styles.colNum]}>{money(order.totals.profit)}</Text>
              </View>
            );
          })}

          <View style={styles.totalsRow}>
            <Text style={[styles.cell, styles.colInvoice, styles.totalsLabel]}>
              TOTALS
            </Text>
            <Text style={[styles.cell, styles.colDate, styles.totalsLabel]}>
              {totals.totalOrders} orders
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.totalsLabel]}>
              {money(totals.revenue)}
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.totalsLabel]}>
              {money(totals.discount)}
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.totalsLabel]}>
              {money(totals.netSales)}
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.totalsLabel]}>
              {money(totals.cost)}
            </Text>
            <Text style={[styles.cell, styles.colNum, styles.totalsLabel]}>
              {money(totals.profit)}
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated: {now}</Text>
          <Text render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
};

/* ================================ Component ============================== */
export const SalesReports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchRef, setSearchRef] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest" | "none"

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const [exporting, setExporting] = useState(false);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("customer/orders/admin/sales");

      if (res.data?.success) {
        const formatted = (res.data.sales || []).map((s) => {
          const shipping = parseFloat(s?.shipping_fee ?? s?.sales_shipping_fee ?? 0) || 0;
          const totalSales = parseFloat(s?.total_sales ?? s?.total_amount ?? 0) || 0;
          const profit = parseFloat(s?.total_profit ?? 0) || 0;

          return {
            invoice: String(s?.sales_id ?? "").padStart(6, "0"),
            created_at: s?.created_at,
            date: new Date(s?.created_at),
            customer: {
              name: s?.full_name || "N/A",
              contact: s?.contact_number || "",
              address: s?.street_address || "",
            },
            courier: s?.courier,
            courier_reference: s?.courier_reference,
            delivered_at: s?.delivered_at,
            payment_reference: s?.payment_reference,
            order_status: s?.order_status,
            payment_status: s?.payment_status,
            items: Array.isArray(s?.items) ? s.items : [],
            coupon: {
              id: s?.coupon_id,
              label: s?.coupon_label,
              deal: s?.coupon_deal,
              itemsDiscount: parseFloat(s?.coupon_discount_amount || 0) || 0,
              shippingDiscount: parseFloat(s?.coupon_shipping_discount || 0) || 0,
            },
            figures: {
              originalSubtotal: parseFloat(s?.original_subtotal || 0) || 0,
              shippingFee: shipping,
              grandTotal: parseFloat(s?.total_amount || totalSales) || 0,
            },
            totals: {
              revenue: totalSales - shipping,
              profit: profit,
              shipping: shipping,
            },
          };
        });
        setOrders(formatted);
      } else {
        toast.error("Failed to load sales data.");
      }
    } catch (err) {
      console.error("❌ Error fetching sales:", err?.message);
      toast.error("Server error while fetching sales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filtered = useMemo(() => {
    let result = [...orders];

    // Search filter
    if (searchRef.trim()) {
      const q = searchRef.toLowerCase();
      result = result.filter((o) => String(o.invoice).toLowerCase().includes(q));
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter((o) => o.date >= dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      result = result.filter((o) => o.date <= end);
    }

    // Sort by date
    if (sortOrder === "newest") {
      result.sort((a, b) => b.date - a.date); // Newest first
    } else if (sortOrder === "oldest") {
      result.sort((a, b) => a.date - b.date); // Oldest first
    }
    // "none" means no sorting (or original order)

    return result;
  }, [orders, searchRef, dateFrom, dateTo, sortOrder]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, order) => {
        const discount =
          (order?.coupon?.itemsDiscount || 0) +
          (order?.coupon?.shippingDiscount || 0);

        const costOfItems = (order?.items || []).reduce(
          (sum, item) =>
            sum +
            Number(item?.cost_per_item || 0) * Number(item?.quantity || 0),
          0
        );

        acc.totalOrders += 1;
        acc.revenue += Number(order?.totals?.revenue || 0);
        acc.discount += discount;
        acc.netSales += Number(order?.totals?.revenue || 0) - discount;
        acc.cost += costOfItems;
        acc.profit += Number(order?.totals?.profit || 0);
        return acc;
      },
      { totalOrders: 0, revenue: 0, discount: 0, netSales: 0, cost: 0, profit: 0 }
    );
  }, [filtered]);

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const docEl = (
        <SalesReportPDF
          filtered={filtered}
          totals={totals}
          dateFrom={dateFrom ? format(dateFrom, "PPP") : ""}
          dateTo={dateTo ? format(dateTo, "PPP") : ""}
        />
      );
      const blob = await pdf(docEl).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `splndd-sales-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

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
      <main className="p-4 w-full space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm rounded-lg bg-white p-4">
          <div>
            <Skeleton className="h-7 w-56 mb-2 bg-gray-200" />
            <Skeleton className="h-4 w-40 bg-gray-100" />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-end">
            <Skeleton className="h-10 w-full sm:w-64 bg-gray-100 rounded" />
            <Skeleton className="h-10 w-[160px] rounded bg-gray-100" />
            <Skeleton className="h-10 w-[160px] rounded bg-gray-100" />
            <Skeleton className="h-10 w-[120px] rounded bg-gray-100" />
            <Skeleton className="h-10 w-[90px] rounded bg-gray-100" />
            <Skeleton className="h-10 w-[120px] rounded bg-gray-100" />
            <Skeleton className="h-10 w-[120px] rounded bg-gray-100" />
          </div>
        </div>

        <section className="w-full bg-white rounded-md shadow p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-1 bg-gray-200" />
              <Skeleton className="h-4 w-44 bg-gray-100" />
            </div>
            <Skeleton className="h-6 w-36 bg-gray-200" />
          </div>
          <div className="w-full h-[300px] sm:h-[360px] mt-2">
            <Skeleton className="h-full w-full rounded bg-gray-100" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-4 w-full space-y-4">
      {/* Filters / Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm rounded-lg bg-white p-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Sales Reports</h2>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-end">
          <Input
            placeholder="Search by Invoice No"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            className="w-full sm:w-[16rem]"
          />

          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Calendar
                mode="single"
                selected={dateFrom || undefined}
                onSelect={(date) => {
                  if (!date) return;
                  if (dateTo && date > dateTo) {
                    toast.error("Start date cannot be after end date.");
                  } else {
                    setDateFrom(date);
                  }
                }}
                disabled={(date) => !!(dateTo && date > dateTo)}
              />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Calendar
                mode="single"
                selected={dateTo || undefined}
                onSelect={(date) => {
                  if (!date) return;
                  if (dateFrom && date < dateFrom) {
                    toast.error("End date cannot be before start date.");
                  } else {
                    setDateTo(date);
                  }
                }}
                disabled={(date) => !!(dateFrom && date < dateFrom)}
              />
            </PopoverContent>
          </Popover>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[120px] justify-start gap-2">
                {sortOrder === "newest" ? (
                  <ArrowDown className="h-4 w-4" />
                ) : sortOrder === "oldest" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {sortOrder === "newest"
                    ? "Newest"
                    : sortOrder === "oldest"
                      ? "Oldest"
                      : "Sort"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                <ArrowDown className="mr-2 h-4 w-4" />
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                <ArrowUp className="mr-2 h-4 w-4" />
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("none")}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                No Sort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            onClick={() => {
              setDateFrom(null);
              setDateTo(null);
            }}
          >
            Clear Dates
          </Button>

          <Button variant="outline" onClick={fetchSales}>
            Refresh
          </Button>

          <Button
            onClick={handleExportPdf}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Sales Summary */}
      <section className="w-full bg-white rounded-md shadow p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Sales Summary</h2>
            <p className="text-sm text-muted-foreground">
              Showing totals —{" "}
              <span className="font-medium text-green-600">{totals.totalOrders}</span>{" "}
              orders
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Net Sales: <span className="font-semibold">{peso(totals.netSales)}</span>
          </div>
        </div>

        <div className="w-full h-[300px] sm:h-[360px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { label: "Revenue", value: totals.revenue, fill: "#bbf7d0" },
                { label: "Discount", value: totals.discount, fill: "#86efac" },
                { label: "Net Sales", value: totals.netSales, fill: "#4ade80" },
                { label: "Cost", value: totals.cost, fill: "#22c55e" },
                { label: "Profit", value: totals.profit, fill: "#16a34a" },
              ]}
              margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
              barCategoryGap={20}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#374151" }} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(v) => `₱${Number(v || 0).toLocaleString()}`}
                tick={{ fontSize: 12, fill: "#374151" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [`₱${Number(value || 0).toLocaleString()}`, ""]}
                contentStyle={{ backgroundColor: "#f0fdf4", borderRadius: 8, fontSize: 13, border: "none", color: "#14532d" }}
                wrapperStyle={{ outline: "none" }}
                cursor={{ fill: "#e6fbe9" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                <LabelList
                  dataKey="value"
                  position="top"
                  content={(props) => {
                    const { value = 0, x = 0, y = 0, width = 0 } = props || {};
                    return (
                      <text x={x + width / 2} y={y - 4} textAnchor="middle" fill="#374151" fontSize={12}>
                        ₱{Number(value || 0).toLocaleString()}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Table */}
      <section className="shadow rounded-md bg-white overflow-auto">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading sales...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No matching sales found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sales ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Net Sales</TableHead>
                <TableHead className="text-right">Cost of Items</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const discountAmount =
                  (order?.coupon?.itemsDiscount || 0) +
                  (order?.coupon?.shippingDiscount || 0);

                const costOfItems = (order?.items || []).reduce(
                  (sum, item) =>
                    sum +
                    Number(item?.cost_per_item || 0) * Number(item?.quantity || 0),
                  0
                );

                const netSale = Number(order?.totals?.revenue || 0) - discountAmount;

                return (
                  <TableRow key={order.invoice}>
                    <TableCell className="font-mono">{order.invoice}</TableCell>
                    <TableCell>{format(order.date, "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">{peso(order.totals.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col text-xs items-end">
                        {order?.coupon?.label && (
                          <span className="text-emerald-700 font-medium">{order.coupon.label}</span>
                        )}
                        <span className="text-muted-foreground">{peso(discountAmount)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{peso(netSale)}</TableCell>
                    <TableCell className="text-right">{peso(costOfItems)}</TableCell>
                    <TableCell className="text-right">{peso(order.totals.profit)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setTimeout(() => setInvoiceDialogOpen(true), 0);
                            }}
                          >
                            View Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="w-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Invoice</DialogTitle>
              <DialogDescription>Sales invoice details</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>

          {selectedOrder ? (
            <SalesInvoice order={selectedOrder} />
          ) : (
            <p>Loading invoice…</p>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};