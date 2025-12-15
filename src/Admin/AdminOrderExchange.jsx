import React, { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import { toast } from "sonner";
import { format } from "date-fns";

import {
    Table, TableBody, TableHead, TableHeader, TableRow, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, MoreVertical } from "lucide-react";
import {
    Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter,
} from "@/components/ui/alert-dialog";

const statusLabel = {
    pending: "Pending",
    approved: "Approved",
    declined: "Declined",
};
import { ScrollArea } from "@/components/ui/scroll-area";

import { Skeleton } from "@/components/ui/skeleton";

export const AdminOrderExchange = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSkeleton, setShowSkeleton] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);

    // Dialog state
    const [selected, setSelected] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Action dialog state
    const [alertOpen, setAlertOpen] = useState(false);
    const [actionType, setActionType] = useState(""); // "approve" or "decline"
    const [adminNotes, setAdminNotes] = useState("");
    const [updating, setUpdating] = useState(false);


    function formatReturnId(id) {
        // Pad to 3 digits, e.g. 1 -> '001'; 12 -> '012'
        return `EXCH-${id.toString().padStart(3, "0")}`;
    }

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

    // Fetch all exchange/return requests
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await api.get("/customer/exchange-return/admin/exchange");
                setRequests(res.data?.requests || []);
            } catch (err) {
                console.error("Failed to fetch requests:", err);
                toast.error("Failed to fetch requests");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Filtered requests
    const filtered = useMemo(() => {
        let data = [...requests];
        if (search) {
            data = data.filter((r) => {
                const searchLc = search.toLowerCase();
                const exchRef = formatReturnId(r.id).toLowerCase();
                return (
                    String(r.order_reference).toLowerCase().includes(searchLc) ||
                    exchRef.includes(searchLc) ||
                    String(r.id).includes(searchLc) ||
                    (r.customer_email || "").toLowerCase().includes(searchLc)
                );
            });
        }
        if (status) data = data.filter((r) => r.status === status);

        if (dateFrom) {
            const from = new Date(dateFrom);
            data = data.filter((r) => new Date(r.created_at) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            data = data.filter((r) => new Date(r.created_at) <= to);
        }
        return data;
    }, [requests, search, status, dateFrom, dateTo]);
    // Handle approve/decline
    const handleAction = async () => {
        if (!selected) return;
        setUpdating(true);
        try {
            await api.patch(`/customer/exchange-return/admin/exchange/${selected.id}`, {
                status: actionType === "approve" ? "approved" : "declined",
                review_notes: adminNotes,
            });
            toast.success(`Request ${actionType === "approve" ? "approved" : "declined"}!`);

            setRequests((prev) =>
                prev.map((r) =>
                    r.id === selected.id
                        ? { ...r, status: actionType === "approve" ? "approved" : "declined", review_notes: adminNotes }
                        : r
                )
            );
            setAlertOpen(false);
            // Delay closing dialog to allow AlertDialog to unmount cleanly
            setTimeout(() => setDialogOpen(false), 100);
        } catch (err) {
            console.error("Failed to update status:", err);
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
            setAdminNotes("");
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearch("");
        setStatus("");
        setDateFrom(null);
        setDateTo(null);
    };


    // --- Skeleton loading UI ---
    if (loading || showSkeleton) {
        return (
            <main className="p-4 w-full space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm rounded-lg bg-white p-4">
                    <div>
                        <Skeleton className="h-7 w-40 sm:w-64 mb-2 bg-gray-200" />
                        <Skeleton className="h-4 w-64 bg-gray-100" />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-end">
                        <Skeleton className="h-10 w-full sm:w-64 rounded bg-gray-100" />
                        <Skeleton className="h-10 w-[120px] rounded bg-gray-100" />
                        <Skeleton className="h-10 w-[110px] rounded bg-gray-100" />
                        <Skeleton className="h-10 w-[110px] rounded bg-gray-100" />
                        <Skeleton className="h-10 w-[110px] rounded bg-gray-100" />
                    </div>
                </div>

                <section className="shadow rounded-md bg-white overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {["Return ID", "Order Reference", "Type", "Date", "Status", "Admin Notes", "Action"].map((h) => (
                                    <TableHead key={h}>
                                        <Skeleton className="h-5 w-20 sm:w-28 bg-gray-200" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(4)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-16 bg-gray-100" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32 bg-gray-100" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 bg-gray-100" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 bg-gray-100" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                                    <TableCell><Skeleton className="h-9 w-24 rounded bg-gray-100" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>
            </main>
        );
    }


    return (
        <main className="p-4 w-full space-y-4">
            {/* Filters / Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm rounded-lg bg-white p-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Return Ticket as Coupon Requests</h2>
                    {/* <p className="text-sm text-muted-foreground">
                        Manage product return and exchange requests.
                    </p> */}
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-end">
                    <Input
                        placeholder="Search by Order Reference, Exchange ID, Email"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-[16rem]"
                    />
                    {/* Status Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[120px] justify-start">
                                {status ? statusLabel[status] : "Status"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-2 min-w-[130px]">
                            <div className="flex flex-col gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setStatus("")}>All</Button>
                                <Button variant="ghost" size="sm" onClick={() => setStatus("pending")}>Pending</Button>
                                <Button variant="ghost" size="sm" onClick={() => setStatus("approved")}>Approved</Button>
                                <Button variant="ghost" size="sm" onClick={() => setStatus("declined")}>Declined</Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Date From */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[110px] justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0">
                            <Calendar
                                mode="single"
                                selected={dateFrom || undefined}
                                onSelect={(date) => {
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
                            <Button variant="outline" className="w-[110px] justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0">
                            <Calendar
                                mode="single"
                                selected={dateTo || undefined}
                                onSelect={(date) => {
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
                    <Button variant="ghost" onClick={resetFilters}>
                        Clear
                    </Button>
                </div>
            </div>

            {/* Table */}
            <section className="shadow rounded-md bg-white overflow-auto">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Loading requests…</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No matching requests found.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reference Ticket</TableHead>
                                <TableHead>Order Reference</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Admin Notes</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>{formatReturnId(req.id)}</TableCell>
                                    <TableCell>{req.order_reference}</TableCell>
                                    <TableCell>Return as Coupon</TableCell>
                                    <TableCell>{format(new Date(req.created_at), "MMM dd, yyyy")}</TableCell>
                                    <TableCell className="capitalize">{req.status}</TableCell>
                                    <TableCell className="max-w-[160px] truncate">{req.review_notes || "—"}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost">
                                                    <MoreVertical className="w-5 h-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelected(req);
                                                        setTimeout(() => setDialogOpen(true), 0);
                                                    }}
                                                >
                                                    View Details
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </section>

            {/* ---------- Details Dialog ---------- */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open && alertOpen) return;
                    setDialogOpen(open);
                    if (!open) setAlertOpen(false);
                }}
            >
                <DialogContent
                    closeOnInteractOutside={!alertOpen}
                    closeOnEscapeKeyDown={!alertOpen}
                    className="max-w-[42rem] h-[30rem] overflow-auto rounded-2xl p-6"
                >
                    {selected && (
                        <div className="w-full space-y-5">
                            {/* ---------- Header ---------- */}
                            <DialogHeader className="border-b pb-3">
                                <DialogTitle className="text-xl font-bold text-gray-800">
                                    Return Ticket as Coupon Details
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-500">
                                    Review all returned product(s) and customer-uploaded media.
                                </DialogDescription>
                            </DialogHeader>

                            {/* ---------- Basic Information ---------- */}
                            <div className="bg-gray-50 p-4 rounded-lg border space-y-1.5">
                                <div><span className="font-semibold text-gray-700">Return Ticket ID:</span> {selected.id}</div>
                                <div><span className="font-semibold text-gray-700">Order Reference:</span> {selected.order_reference}</div>
                                <div><span className="font-semibold text-gray-700">Type:</span> <span className="text-blue-600">Return as Coupon</span></div>
                                <div><span className="font-semibold text-gray-700">Date:</span> {format(new Date(selected.created_at), "PPP p")}</div>
                                <div><span className="font-semibold text-gray-700">Customer Email:</span> {selected.customer_email}</div>
                                <div><span className="font-semibold text-gray-700">Admin Notes:</span> {selected.review_notes || "—"}</div>
                            </div>

                            {/* ---------- Returned Products ---------- */}
                            {selected.returns && Array.isArray(selected.returns) && selected.returns.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2 border-b pb-1">Returned Products</h3>
                                    <ScrollArea className="h-[18rem] rounded-md border bg-gray-50 p-3">
                                        {selected.returns.map((ret, idx) => {
                                            const supplier = selected.order_items?.find(oi => oi.sku === ret.sku);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow transition"
                                                >
                                                    {/* ---------- Product Header ---------- */}
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-semibold text-gray-800 text-base">
                                                            Product {idx + 1}{ret.label ? `: ${ret.label}` : ""}
                                                        </h4>
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                            SKU: {ret.sku || "—"}
                                                        </span>
                                                    </div>

                                                    {/* ---------- Product Details Grid ---------- */}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm text-gray-700">
                                                        <div><span className="font-semibold">Qty:</span> {ret.quantity}</div>
                                                        <div>
                                                            <span className="font-semibold">Total Price:</span>{" "}
                                                            <span className="text-green-600">₱{(ret.total_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div><span className="font-semibold">Reason:</span> {ret.reason}</div>
                                                        <div className="col-span-2"><span className="font-semibold">Description:</span> {ret.description}</div>
                                                    </div>

                                                    {/* ---------- Supplier Details ---------- */}
                                                    <div className="mt-3 border-t pt-2">
                                                        <span className="font-semibold text-gray-700">Supplier Details:</span>
                                                        {supplier ? (
                                                            <div className="text-xs text-gray-600 grid grid-cols-1 sm:grid-cols-2 mt-1.5 gap-x-6">
                                                                <div><b>Name:</b> {supplier.supplier_name}</div>
                                                                <div><b>Contact:</b> {supplier.supplier_contact_person}</div>
                                                                <div><b>Email:</b> {supplier.supplier_email}</div>
                                                                <div><b>Phone:</b> {supplier.supplier_phone}</div>
                                                                <div className="sm:col-span-2"><b>Address:</b> {supplier.supplier_address}</div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-500 mt-1 pl-1">Not found</div>
                                                        )}
                                                    </div>

                                                    {/* ---------- Media Section ---------- */}
                                                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                                                        {/* Images */}
                                                        <div>
                                                            <div className="font-semibold text-gray-700 mb-1">Images:</div>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {(selected.media || [])
                                                                    .filter(m => m.product_idx === idx && m.media_type === "image")
                                                                    .map((m, mIdx) => (
                                                                        <img
                                                                            key={mIdx}
                                                                            src={`${import.meta.env.VITE_SERVER_URL}/uploads/${m.file_path}`}
                                                                            alt="Return image"
                                                                            className="w-16 h-16 rounded-md border object-cover shadow-sm"
                                                                        />
                                                                    ))}
                                                            </div>
                                                        </div>

                                                        {/* Videos */}
                                                        <div>
                                                            <div className="font-semibold text-gray-700 mb-1">Video:</div>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {(selected.media || [])
                                                                    .filter(m => m.product_idx === idx && m.media_type === "video")
                                                                    .map((m, vIdx) => (
                                                                        <video
                                                                            key={vIdx}
                                                                            src={`${import.meta.env.VITE_SERVER_URL}/uploads/${m.file_path}`}
                                                                            className="w-28 h-16 rounded-md border shadow-sm"
                                                                            controls
                                                                        />
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </ScrollArea>
                                </div>
                            )}

                            {/* ---------- Action Buttons ---------- */}
                            <DialogFooter className="justify-between mt-5 pt-3 border-t">
                                <Button
                                    variant="success"
                                    className="cursor-pointer px-5 py-2 font-semibold"
                                    onClick={() => {
                                        setActionType("approve");
                                        setTimeout(() => setAlertOpen(true), 0);
                                    }}
                                    disabled={selected.status !== "pending"}
                                >
                                    Approve
                                </Button>

                                <Button
                                    variant="destructive"
                                    className="cursor-pointer px-5 py-2 font-semibold"
                                    onClick={() => {
                                        setActionType("decline");
                                        setTimeout(() => setAlertOpen(true), 0);
                                    }}
                                    disabled={selected.status !== "pending"}
                                >
                                    Decline
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>


            {/* Approve/Decline Confirm Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionType === "approve" ? "Approve" : "Decline"} Request
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <div>
                        <label className="block mb-1">Notes (required):</label>
                        <Input
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            placeholder={`Enter notes for why you ${actionType}d this request`}
                        />
                    </div>
                    <AlertDialogFooter>
                        <Button
                            onClick={handleAction}
                            disabled={updating || adminNotes.trim() === ""}
                            className={actionType === "approve" ? "bg-green-600" : "bg-red-600"}
                        >
                            {updating ? "Processing..." : "Submit"}
                        </Button>
                        <Button variant="ghost" onClick={() => setTimeout(() => setAlertOpen(false), 0)}>
                            Cancel
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
};