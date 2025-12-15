import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import { toast } from "sonner";
import { format } from "date-fns";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer";

// PDF hyphenation for long words
Font.registerHyphenationCallback((word) => {
  if (!word) return [];
  if (word.includes("-")) return word.split(/(?<=-)/);
  return word.match(/.{1,10}/g) || [word];
});

/* --------------------------- PDF styles/theme ------------------------ */
const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 100,
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

  colEmail: { flex: 1.2 },
  colAction: { flex: 3 },
  colDate: { flex: 1.5 },

  cell: {
    color: "#0F172A",
    paddingRight: 6,
    lineHeight: 1.3,
    alignSelf: "flex-start",
    fontSize: 9,
    wordBreak: "break-all",
  },

  footer: {
    position: "absolute",
    left: 32, right: 32, bottom: 24,
    fontSize: 9, color: "#065F46",
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: "#A7F3D0", paddingTop: 6,
  },
});

/* --------------------------- PDF document ---------------------------- */
const AuditLogPDF = ({ logs, emailQuery }) => {
  const now = format(new Date(), "PPP p");
  const range = emailQuery ? `Filtered by email: ${emailQuery}` : "All Admin Actions";

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header} fixed>
          <View style={pdfStyles.headerTitleRow}>
            <Text style={pdfStyles.headerCompany}>Splnd-d Clothing</Text>
            <Text style={pdfStyles.headerTitle}>Admin Audit Log</Text>
          </View>
          <View style={pdfStyles.rangePillWrap}>
            <View style={pdfStyles.rangePill}><Text style={pdfStyles.rangePillText}>{range}</Text></View>
          </View>
        </View>
        <View style={pdfStyles.card}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colEmail]}>Admin Email</Text>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colAction]}>Action</Text>
            <Text style={[pdfStyles.cell, pdfStyles.tableHeaderText, pdfStyles.colDate]}>Date & Time</Text>
          </View>
          {logs.length === 0 ? (
            <View style={pdfStyles.tableRow}>
              <Text style={pdfStyles.cell}>No logs found.</Text>
            </View>
          ) : (
            logs.map((log, idx) => (
              <View key={log.id || idx} style={[pdfStyles.tableRow, idx % 2 ? pdfStyles.tableRowAlt : null]}>
                <Text style={[pdfStyles.cell, pdfStyles.colEmail]}>{log.email}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.colAction]}>{log.action}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.colDate]}>
                  {log.created_at ? format(new Date(log.created_at), "PPP p") : ""}
                </Text>
              </View>
            ))
          )}
        </View>
        <View style={pdfStyles.footer} fixed>
          <Text>Generated: {now}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

/* ---------------------- React: AuditLog --------------------- */
export const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // Optional: Pass query as param for backend filtering if supported
      const res = await api.get("/admin/audit-log", {
        params: q ? { email: q } : {},
      });
      setLogs(res.data?.logs || res.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load audit logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs in frontend if backend doesn't support email query param
  const filteredLogs = useMemo(() => {
    if (!q.trim()) return logs;
    return logs.filter((log) =>
      (log.email || "").toLowerCase().includes(q.trim().toLowerCase())
    );
  }, [logs, q]);

  // PDF export
  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const docEl = (
        <AuditLogPDF logs={filteredLogs} emailQuery={q} />
      );
      const blob = await pdf(docEl).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin-audit-log-${Date.now()}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const [showSkeleton, setShowSkeleton] = useState(true);

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

  // --- Skeleton loading UI ---
  if (loading || showSkeleton) {
    return (
      <main className="p-4 w-full space-y-4">
        {/* Filters / Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm rounded-lg bg-white p-4">
          <div>
            <Skeleton className="h-7 w-56 mb-2 bg-gray-200" />
            <Skeleton className="h-4 w-40 bg-gray-100" />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-end">
            <Skeleton className="h-10 w-full sm:w-[22rem] bg-gray-100 rounded" />
            <Skeleton className="h-10 w-28 rounded bg-gray-100" />
            <Skeleton className="h-10 w-24 rounded bg-gray-100" />
            <Skeleton className="h-10 w-32 rounded bg-gray-100" />
          </div>
        </div>
        {/* Table Skeleton */}
        <section className="shadow rounded-md bg-white overflow-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                {[
                  "Admin Email",
                  "Action",
                  "Date & Time",
                ].map((h) => (
                  <th key={h} className="px-2 sm:px-4 py-3 text-left">
                    <Skeleton className="h-5 w-28 bg-gray-200" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td className="px-2 sm:px-4 py-4"><Skeleton className="h-4 w-44 bg-gray-100" /></td>
                  <td className="px-2 sm:px-4 py-4"><Skeleton className="h-4 w-80 bg-gray-100" /></td>
                  <td className="px-2 sm:px-4 py-4"><Skeleton className="h-4 w-32 bg-gray-100" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    );
  }

  return (
    <main className="p-4 w-full space-y-4">
      {/* Filters / Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm rounded-lg bg-white p-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Admin Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Actions performed by admins.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-end">
          <Input
            placeholder="Search by admin email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-[22rem]"
          />
          <Button variant="ghost" onClick={() => { setQ(""); }}>
            Clear
          </Button>
          <Button variant="outline" onClick={fetchLogs}>
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
      {/* Table */}
      <section className="shadow rounded-md bg-white overflow-auto">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading audit logs...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No audit logs found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, idx) => (
                <TableRow key={log.id || idx}>
                  <TableCell className="font-mono">{log.email}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    {log.created_at
                      ? format(new Date(log.created_at), "PPP p")
                      : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </main>
  );
};