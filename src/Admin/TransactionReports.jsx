import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell,
} from "recharts";


Font.registerHyphenationCallback((word) => {
  if (!word) return [];
  if (word.includes("-")) return word.split(/(?<=-)/);
  return word.match(/.{1,8}/g) || [word];
});

/* ------------------------------ helpers ------------------------------ */
const peso = (v) =>
  `₱${Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

const money = (v) =>
  String(Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));

const fmtTxn = (id) => `TRX-${String(id).padStart(6, "0")}`;

const matchesQuery = (row, raw) => {
  const q = (raw || "").toLowerCase().trim();
  if (!q) return true;

  const digits = q.replace(/\D/g, "");
  const numericQ = digits ? Number(digits) : null;

  const code = fmtTxn(row.transaction_id).toLowerCase();
  const trxMatch = code.includes(q) || (numericQ !== null && row.transaction_id === numericQ);

  const orderMatch = (row.order_reference || "").toLowerCase().includes(q);
  const payMatch = (row.payment_reference || "").toLowerCase().includes(q);

  return trxMatch || orderMatch || payMatch;
};

const STATUS_OPTIONS = ["all", "paid", "pending", "failed", "cancelled", "refunded"];

const insertBreaks = (s = "") => String(s).replace(/-/g, "-\u200B");

/* --------------------------- PDF styles/theme ------------------------ */
const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 120,
    paddingBottom: 80,
    paddingHorizontal: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#F0FDF4",
  },
  header: {
    position: "absolute",
    top: 24, left: 32, right: 32,
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  headerTitleRow: { flexDirection: "row", justifyContent: "space-between" },
  headerCompany: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  headerTitle: { fontSize: 13, color: "#ECFDF5" },
  rangePillWrap: { marginTop: 6, alignItems: "center" },
  rangePill: { backgroundColor: "#D1FAE5", borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  rangePillText: { fontSize: 9, color: "#065F46" },

  card: { backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#A7F3D0", padding: 12 },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#D1FAE5",
    paddingVertical: 6, paddingHorizontal: 6,
  },
  tableHeaderText: { fontWeight: "bold", color: "#064E3B" },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 6, paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    alignItems: "flex-start",
  },
  tableRowAlt: { backgroundColor: "#F9FAFB" },

  colTxn: { flex: 1 },
  colDate: { flex: 1 },
  cell: {
    color: "#0F172A",
    paddingRight: 6,
    lineHeight: 1.3,
    alignSelf: "flex-start",
    fontSize: 9,
    wordBreak: "break-all",
  },

  colOrderRef: {
    flex: 2.2,
    flexDirection: "column",
    justifyContent: "flex-start",
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },

  colRef: {
    flex: 2.6,
    flexDirection: "column",
    justifyContent: "flex-start",
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    maxWidth: 220,
  },

  colStatus: {
    flex: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
    textAlign: "left",
  },

  colNum: {
    flex: 1,
    flexShrink: 0,
    textAlign: "right",
  },

  totalsRow3: {
    flexDirection: "row",
    paddingVertical: 6, paddingHorizontal: 6,
    backgroundColor: "#DCFCE7",
    borderTopWidth: 1, borderTopColor: "#A7F3D0",
  },
  totalsLeft: { flex: 1 + 1 + 2.2 },
  totalsMiddle: { flex: 2.6 + 1 },
  totalsRight: { flex: 1, textAlign: "right" },
  totalsLabel: { fontWeight: "bold", color: "#065F46" },

  footer: {
    position: "absolute",
    left: 32, right: 32, bottom: 24,
    fontSize: 9, color: "#065F46",
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: "#A7F3D0", paddingTop: 6,
  },

  textWrap: { width: "100%" },
});

/* --------------------------- PDF document ---------------------------- */
export const TransactionsPDF = ({ rows, totals, dateFrom, dateTo, status }) => {
  const now = format(new Date(), "PPP p");
  const parts = [];
  if (dateFrom) parts.push(`From: ${dateFrom}`);
  if (dateTo) parts.push(`To: ${dateTo}`);
  if (status && status !== "all") parts.push(`Status: ${status}`);
  const range = parts.length ? parts.join(" | ") : "All Transactions";

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header} fixed>
          <View style={pdfStyles.headerTitleRow}>
            <Text style={pdfStyles.headerCompany}>Splnd-d Clothing</Text>
            <Text style={pdfStyles.headerTitle}>Transactions Report</Text>
          </View>
          <View style={pdfStyles.rangePillWrap}>
            <View style={pdfStyles.rangePill}><Text style={pdfStyles.rangePillText}>{range}</Text></View>
          </View>
        </View>

        <View style={[pdfStyles.card]}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colTxn]}>Transaction ID</Text>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colDate]}>Date</Text>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colOrderRef]}>Order Ref</Text>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colRef]}>Payment Ref (Maya)</Text>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colStatus]}>Payment Status</Text>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colNum]}>Amount (PHP)</Text>
          </View>

          {rows.map((t, idx) => (
            <View
              key={t.transaction_id}
              wrap={false}
              style={[pdfStyles.tableRow, idx % 2 ? pdfStyles.tableRowAlt : null]}
            >
              <Text style={[pdfStyles.cell, pdfStyles.colTxn]}>{fmtTxn(t.transaction_id)}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colDate]}>{format(t.date, "MMM dd, yyyy")}</Text>

              <View style={pdfStyles.colOrderRef}>
                <Text style={[pdfStyles.cell, pdfStyles.textWrap]} wrap maxLines={3}>
                  {insertBreaks(t.order_reference) || "N/A"}
                </Text>
              </View>

              <View style={pdfStyles.colRef}>
                <Text style={[pdfStyles.cell, pdfStyles.textWrap]} wrap maxLines={3}>
                  {insertBreaks(t.payment_reference) || "N/A"}
                </Text>
              </View>
              <Text style={[pdfStyles.cell, pdfStyles.colStatus]}>{t.payment_status || "N/A"}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.colNum]}>{money(t.amount)}</Text>
            </View>
          ))}

          <View style={pdfStyles.totalsRow3}>
            <Text style={[pdfStyles.cell, pdfStyles.totalsLeft, pdfStyles.totalsLabel]}>TOTALS</Text>
            <Text style={[pdfStyles.cell, pdfStyles.totalsMiddle, pdfStyles.totalsLabel]}>
              {totals.count} transactions
            </Text>
            <Text style={[pdfStyles.cell, pdfStyles.totalsRight, pdfStyles.totalsLabel]}>
              {money(totals.amount)}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text>Generated: {now}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

/* ---------------------- React: TransactionReports --------------------- */
export const TransactionReports = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest" | "none"
  const [exporting, setExporting] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/customer/orders/admin/transactions", {
        params: {
          q: q || undefined,
          status: status || undefined,
          from: dateFrom ? dateFrom.toISOString() : undefined,
          to: dateTo ? dateTo.toISOString() : undefined,
        },
      });
      if (!res.data?.success) throw new Error("Failed");
      const mapped = (res.data.transactions || [])
        .map((t) => ({
          transaction_id: t.transaction_id,
          date: new Date(t.created_at),
          order_reference: t.order_reference || t.order_id,
          payment_reference: t.payment_reference,
          payment_status: t.payment_status,
          amount: Number(t.amount || 0),
        }))
        .sort((a, b) => a.transaction_id - b.transaction_id);

      setRows(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, status, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
    let out = [...rows];
    if (q.trim()) out = out.filter((r) => matchesQuery(r, q));
    if (status && status !== "all") {
      out = out.filter((r) => (r.payment_status || "").toLowerCase() === status.toLowerCase());
    }
    if (dateFrom) out = out.filter((r) => r.date >= dateFrom);
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
      out = out.filter((r) => r.date <= end);
    }

    // Sort by date
    if (sortOrder === "newest") {
      out.sort((a, b) => b.date - a.date); // Newest first
    } else if (sortOrder === "oldest") {
      out.sort((a, b) => a.date - b.date); // Oldest first
    }
    // "none" means no sorting (keep original order)

    return out;
  }, [rows, q, status, dateFrom, dateTo, sortOrder]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => {
      acc.count += 1;
      acc.amount += r.amount;
      const key = (r.payment_status || "unknown").toLowerCase();
      acc.byStatus[key] = (acc.byStatus[key] || 0) + 1;
      return acc;
    }, { count: 0, amount: 0, byStatus: {} });
  }, [filtered]);

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const docEl = (
        <TransactionsPDF
          rows={filtered}
          totals={{ count: totals.count, amount: totals.amount }}
          dateFrom={dateFrom ? format(dateFrom, "PPP") : ""}
          dateTo={dateTo ? format(dateTo, "PPP") : ""}
          status={status}
        />
      );
      const blob = await pdf(docEl).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-report-${Date.now()}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const barColors = ["#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a"];

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
            <Skeleton className="h-10 w-full sm:w-[22rem] bg-gray-100 rounded" />
            <Skeleton className="h-10 w-40 rounded bg-gray-100" />
            <Skeleton className="h-10 w-[160px] rounded bg-gray-100" />
            <Skeleton className="h-10 w-[160px] rounded bg-gray-100" />
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
          <h2 className="text-xl font-semibold tracking-tight">Transactions</h2>
          <p className="text-sm text-muted-foreground">Maya payments across your orders.</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-end">
          <Input
            placeholder="Search TRX / Order Ref / Payment Ref"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-[22rem]"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-md border px-3 text-sm"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

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
                onSelect={(d) => {
                  if (!d) return;
                  if (dateTo && d > dateTo) toast.error("Start date cannot be after end date.");
                  else setDateFrom(d);
                }}
                disabled={(d) => !!(dateTo && d > dateTo)}
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
                onSelect={(d) => {
                  if (!d) return;
                  if (dateFrom && d < dateFrom) toast.error("End date cannot be before start date.");
                  else setDateTo(d);
                }}
                disabled={(d) => !!(dateFrom && d < dateFrom)}
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
              setQ("");
              setStatus("all");
              setDateFrom(null);
              setDateTo(null);
              setSortOrder("newest");
            }}
          >
            Clear
          </Button>

          <Button variant="outline" onClick={fetchTransactions}>
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

      {/* Status Summary */}
      <section className="w-full bg-white rounded-md shadow p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Payment Status</h2>
            <p className="text-sm text-muted-foreground">
              Total — <span className="font-medium text-green-600">{totals.count}</span> transactions
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Amount: <span className="font-semibold">{peso(totals.amount)}</span>
          </div>
        </div>

        <div className="w-full h-[300px] sm:h-[360px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={["paid", "pending", "failed", "cancelled", "refunded"].map((k, i) => ({
                label: k[0].toUpperCase() + k.slice(1),
                value: totals.byStatus[k] || 0,
                color: barColors[i % barColors.length],
              }))}
              margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
              barCategoryGap={20}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#374151" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => Number(v || 0).toLocaleString()} tick={{ fontSize: 12, fill: "#374151" }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => [Number(value || 0).toLocaleString(), "Count"]}
                contentStyle={{ backgroundColor: "#f0fdf4", borderRadius: 8, fontSize: 13, border: "none", color: "#14532d" }}
                wrapperStyle={{ outline: "none" }}
                cursor={{ fill: "#e6fbe9" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                {["paid", "pending", "failed", "cancelled", "refunded"].map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  content={({ value = 0, x = 0, y = 0, width = 0 }) => (
                    <text x={x + width / 2} y={y - 4} textAnchor="middle" fill="#374151" fontSize={12}>
                      {Number(value || 0).toLocaleString()}
                    </text>
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Table */}
      <section className="shadow rounded-md bg-white overflow-auto">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No transactions found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Order Ref</TableHead>
                <TableHead>Payment Ref (Maya)</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={String(t.transaction_id)}>
                  <TableCell className="font-mono">{fmtTxn(t.transaction_id)}</TableCell>
                  <TableCell>{format(t.date, "MMM dd, yyyy")}</TableCell>
                  <TableCell title={t.order_reference} className="font-mono max-w-[280px] truncate">
                    {t.order_reference || "N/A"}
                  </TableCell>
                  <TableCell title={t.payment_reference || ""} className="font-mono max-w-[360px] truncate">
                    {t.payment_reference || "N/A"}
                  </TableCell>
                  <TableCell className="capitalize">{t.payment_status || "N/A"}</TableCell>
                  <TableCell className="text-right">{peso(t.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </main>
  );
};