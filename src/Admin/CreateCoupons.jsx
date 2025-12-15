import React, { useEffect, useMemo, useState, useContext } from "react";
import { Trash2, Pencil, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format as formatDate, isWithinInterval, parseISO } from "date-fns";

import { AdminAuthContext } from "@/context/AdminAuthContext";
import {
  Skeleton

} from "@/components/ui/skeleton";
// ShadCN UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/api/axios";

// ---------- helpers ----------
const toISODateManila = (d) => {
  if (!d) return null;

  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
};

const toNumOrNull = (v) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v);
const parseMaybeDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const parsed = parseISO(String(v));
  return Number.isNaN(parsed?.getTime?.()) ? null : parsed;
};
const cx = (...classes) => classes.filter(Boolean).join(" ");

const FIXED_VALID_AFTER_DAYS = 1;     // ✅ always 1 day after claiming
const FIXED_USAGE_LIMIT_PER_USER = 1; // ✅ always 1 per user

const emptyForm = {
  id: "",
  label: "",
  type: "percentage", // percentage | fixed | free_shipping
  discount: "",
  conditions: {
    minSpend: "",
    firstTimeBuyer: false,
    maxCap: "", // only relevant for percentage
  },
  validAfterClaimDays: String(FIXED_VALID_AFTER_DAYS), // fixed
  startDate: null,
  endDate: null,
  active: true,
  assignTo: "everyone", // everyone | specific
  assignedUsers: [],
  usageLimitPerUser: String(FIXED_USAGE_LIMIT_PER_USER), // fixed
};



// helpers for dates (place near other helpers)
const atMidnight = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => {
  const x = atMidnight(d);
  x.setDate(x.getDate() + n);
  return x;
};


export const CreateCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editCoupon, setEditCoupon] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [filterStart, setFilterStart] = useState(null);
  const [filterEnd, setFilterEnd] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  // customers
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customersLoading, setCustomersLoading] = useState(false);

  // calendar popover control (fixes click-close / z-index issues)
  const [openStartCal, setOpenStartCal] = useState(false);
  const [openEndCal, setOpenEndCal] = useState(false);

  // per-field errors
  const [errors, setErrors] = useState({});

  //loading state for toggling
  const [togglingId, setTogglingId] = useState(null);


  const { admin } = useContext(AdminAuthContext); // <== get current admin



  // inside the component:
  const today = React.useMemo(() => atMidnight(new Date()), []);
  // end must be at least 1 day after start; if no start yet, require at least tomorrow
  const endMinDate = React.useMemo(() => {
    return form.startDate ? addDays(form.startDate, 1) : addDays(today, 1);
  }, [form.startDate, today,]);


  // ---------- effects ----------
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/coupons/fetch");
      if (data?.success) {
        const normalized = (data.data || []).map((row) => ({
          id: row.id,
          label: row.label,
          type: row.type,
          discount: row.discount !== null ? Number(row.discount) : null,
          conditions: row.conditions || { minSpend: null, firstTimeBuyer: false, maxCap: null },
          validAfterClaimDays:
            row.valid_after_claim_days !== null ? Number(row.valid_after_claim_days) : null,
          startDate: parseMaybeDate(row.start_date),
          endDate: parseMaybeDate(row.end_date),
          active: !!row.active,
          assignTo: row.assign_to || "everyone",
          assignedUsers: Array.isArray(row.assigned_users) ? row.assigned_users : [],
          usageLimitPerUser:
            row.usage_limit_per_user !== null ? Number(row.usage_limit_per_user) : null,
          current_usage: row.current_usage ?? 0,
          created_at: row.created_at,
          updated_at: row.updated_at,
          auto_issued: !!row.auto_issued,  // Add this line
        }));
        setCoupons(normalized);
      } else {
        toast.error("Failed to load coupons");
      }
    } catch (e) {
      console.error("Fetch coupons error:", e);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // fetch customers on open or when searching
  useEffect(() => {
    if (dialogOpen && form.assignTo === "specific") {
      const fetchCustomers = async () => {
        try {
          setCustomersLoading(true);
          const q = customerSearch.trim();
          const path =
            q.length >= 2
              ? `/admin/coupons/customers/search?q=${encodeURIComponent(q)}`
              : `/admin/coupons/customers/fetch`;
          const { data } = await api.get(path);
          if (data?.success) {
            setCustomers(data.data || []);
          } else {
            setCustomers([]);
          }
        } catch (err) {
          console.error("Fetch customers error:", err);
          setCustomers([]);
          toast.error("Failed to load customers");
        } finally {
          setCustomersLoading(false);
        }
      };
      fetchCustomers();
    }
  }, [dialogOpen, form.assignTo, customerSearch]);

  // when editing, load values; else reset form
  useEffect(() => {
    if (editCoupon) {
      const c = editCoupon;
      setForm({
        id: c.id,
        label: c.label || "",
        type: c.type || "percentage",
        discount: c.discount ?? "",
        conditions: {
          minSpend: c?.conditions?.minSpend ?? "",
          firstTimeBuyer: !!c?.conditions?.firstTimeBuyer,
          maxCap: c?.conditions?.maxCap ?? "",
        },
        // force fixed values regardless of what's stored
        validAfterClaimDays: String(FIXED_VALID_AFTER_DAYS),
        startDate: c.startDate || null,
        endDate: c.endDate || null,
        active: !!c.active,
        assignTo: c.assignTo || "everyone",
        assignedUsers: Array.isArray(c.assignedUsers) ? c.assignedUsers : [],
        usageLimitPerUser: String(FIXED_USAGE_LIMIT_PER_USER),
      });
      setErrors({});
    } else {
      setForm(emptyForm);
      setErrors({});
    }
  }, [editCoupon]);

  // ---------- handlers ----------
  const handleChange = (field, value, nested = false) => {
    if (nested) {
      setForm((prev) => ({
        ...prev,
        conditions: { ...prev.conditions, [field]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    setErrors((prev) => ({ ...prev, [nested ? field : field]: undefined }));
  };

  const validateForm = () => {
    const errs = {};
    // label
    if (!form.label || !form.label.trim()) errs.label = "Label is required.";

    // type
    if (!form.type) errs.type = "Type is required.";

    // discount / maxCap by type
    if (form.type !== "free_shipping") {
      if (form.discount === "" || Number.isNaN(Number(form.discount))) {
        errs.discount = "Discount is required.";
      } else if (form.type === "percentage") {
        const pct = Number(form.discount);
        if (pct < 1 || pct > 100) errs.discount = "Percentage must be between 1 and 100.";
      } else if (form.type === "fixed") {
        const amt = Number(form.discount);
        if (amt < 0) errs.discount = "Discount cannot be negative (0 is allowed).";
      }
    }
    if (form.type === "percentage") {
      if (form.conditions.maxCap === "" || Number.isNaN(Number(form.conditions.maxCap))) {
        errs.maxCap = "Max cap is required (0 allowed).";
      } else if (Number(form.conditions.maxCap) < 0) {
        errs.maxCap = "Max cap cannot be negative.";
      }
    }

    // minSpend (required, 0 allowed)
    if (form.conditions.minSpend === "" || Number.isNaN(Number(form.conditions.minSpend))) {
      errs.minSpend = "Min spend is required (0 allowed).";
    } else if (Number(form.conditions.minSpend) < 0) {
      errs.minSpend = "Min spend cannot be negative.";
    }

    // fixed validAfterClaimDays = 1
    if (Number(form.validAfterClaimDays) !== FIXED_VALID_AFTER_DAYS) {
      errs.validAfterClaimDays = "Valid X days is fixed to 1.";
    }

    // dates required (campaign window) + order
    if (!form.startDate) errs.startDate = "Start date is required.";
    if (!form.endDate) errs.endDate = "End date is required.";
    if (form.startDate && form.endDate) {
      const startMid = atMidnight(form.startDate);
      const endMid = atMidnight(form.endDate);
      const minEnd = addDays(startMid, 1); // 24 hours after start
      if (endMid < minEnd) {
        errs.endDate = "End date must be at least 1 day after start date.";
      }
    }

    // assignTo specific → must pick at least 1
    if (form.assignTo === "specific" && form.assignedUsers.length === 0) {
      errs.assignedUsers = "Please select at least one customer.";
    }

    // fixed usageLimitPerUser = 1
    if (Number(form.usageLimitPerUser) !== FIXED_USAGE_LIMIT_PER_USER) {
      errs.usageLimitPerUser = "Usage limit per user is fixed to 1.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = Object.values(errs)[0];
      if (typeof first === "string") toast.error(first);
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const isFreeShipping = form.type === "free_shipping";
    return {
      label: form.label.trim(),
      type: form.type,
      discount: isFreeShipping ? null : toNumOrNull(form.discount),
      conditions: {
        minSpend: toNumOrNull(form.conditions?.minSpend),
        firstTimeBuyer: !!form.conditions?.firstTimeBuyer,
        maxCap: form.type === "percentage" ? toNumOrNull(form.conditions?.maxCap) : null,
      },
      validAfterClaimDays: FIXED_VALID_AFTER_DAYS,
      startDate: toISODateManila(form.startDate), // => "YYYY-MM-DD" in Asia/Manila
      endDate: toISODateManila(form.endDate),     // => "YYYY-MM-DD" in Asia/Manila
      active: !!form.active,
      assignTo: form.assignTo,
      assignedUsers: form.assignTo === "specific" ? form.assignedUsers : [],
      usageLimitPerUser: FIXED_USAGE_LIMIT_PER_USER,
    };
  };

  const createCoupon = async () => {
    const payload = buildPayload();
    const { data } = await api.post("/admin/coupons/create", {
      ...payload,
      adminEmail: admin?.email, // <== pass admin email
    });
    if (!data?.success) throw new Error(data?.message || "Create failed");
    return data.coupon;
  };

  const updateCoupon = async (id) => {
    const payload = buildPayload();
    const { data } = await api.patch(`/admin/coupons/${id}`, {
      ...payload,
      adminEmail: admin?.email, // <== pass admin email
    });
    if (!data?.success) throw new Error(data?.message || "Update failed");
    return data.coupon;
  };

  const refreshCoupons = async () => {
    await fetchCoupons();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setCreating(true);
      if (editCoupon?.id) {
        await updateCoupon(editCoupon.id);
        toast.success("Coupon updated.");
      } else {
        await createCoupon();
        toast.success("Coupon created.");
      }
      await refreshCoupons();
      setDialogOpen(false);
      setEditCoupon(null);
      setForm(emptyForm);
      setOpenStartCal(false);
      setOpenEndCal(false);
    } catch (e2) {
      console.error("Failed to save coupon:", e2);
      toast.error(e2?.message || "Failed to save coupon.");
    } finally {
      setCreating(false);
    }
  };

  // const handleDelete = async (id) => {
  //   try {
  //     await api.delete(`/admin/coupons/${id}`, {
  //       data: { adminEmail: admin?.email }, // <-- pass admin email in body
  //     });
  //     toast.success("Coupon deleted.");
  //     setCoupons((prev) => prev.filter((c) => c.id !== id));
  //   } catch (err) {
  //     console.error("Delete error:", err);
  //     toast.error("Failed to delete coupon.");
  //   }
  // };

  const toggleActive = async (id) => {
    setTogglingId(id);
    try {
      const { data } = await api.patch(`/admin/coupons/${id}/toggle`, {
        adminEmail: admin?.email, // <== pass admin email
      });
      if (data?.success) {
        setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: data.coupon.active } : c)));
        toast.success("Status updated.");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to toggle status.");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCoupons = useMemo(() => {
    if (!filterStart || !filterEnd) return coupons;
    return coupons.filter((c) => {
      const s = c.startDate;
      const e = c.endDate;
      if (!s || !e) return false;
      return (
        isWithinInterval(filterStart, { start: s, end: e }) ||
        isWithinInterval(filterEnd, { start: s, end: e }) ||
        isWithinInterval(s, { start: filterStart, end: filterEnd })
      );
    });
  }, [coupons, filterStart, filterEnd]);

  // ---------- UI ----------
  const errorText = (msg) => (msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null);
  const inputClass = (hasErr) => cx("w-full", hasErr && "border-red-500 focus-visible:ring-red-500");

  // Skeleton loading effect
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
      <main className="w-full min-h-screen flex justify-center items-start">
        <div className="w-full bg-white p-6 rounded-lg border shadow-sm space-y-6">
          {/* Header + Create */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-32 bg-gray-200 mb-2" />
            <Skeleton className="h-10 w-40 rounded bg-gray-100" />
          </div>
          {/* Dialog skeleton */}
          <div className="w-full mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Skeleton className="h-5 w-32 bg-gray-100" />
              <Skeleton className="h-5 w-24 bg-gray-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded bg-gray-100" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full rounded bg-gray-100" />
              <Skeleton className="h-10 w-full rounded bg-gray-100" />
            </div>
          </div>
          {/* Filter skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end mb-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded bg-gray-100" />
            ))}
            <Skeleton className="h-10 w-full col-span-2 rounded bg-gray-100" />
          </div>
          {/* Coupons list skeleton */}
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-md p-4 flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-32 bg-gray-200" />
                  <Skeleton className="h-4 w-16 bg-gray-100" />
                  <Skeleton className="h-4 w-20 bg-gray-100" />

                </div>
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-6 w-12 rounded bg-gray-100" />
                  <Skeleton className="h-10 w-10 rounded bg-gray-100" />
                  <Skeleton className="h-10 w-10 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="w-full min-h-screen flex justify-center items-start">
      <div className="w-full bg-white p-6 rounded-lg border shadow-sm space-y-6">
        {/* Header + Create */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">All Coupons</h2>
          <Dialog
            open={dialogOpen}
            onOpenChange={(o) => {
              setDialogOpen(o);
              if (!o) {
                setOpenStartCal(false);
                setOpenEndCal(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditCoupon(null);
                  setForm(emptyForm);
                  setErrors({});
                }}
              >
                + New Coupon
              </Button>
            </DialogTrigger>

            <DialogContent
              className="w-[25rem] h-[40rem] md:w-[44rem] overflow-visible"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>{editCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
              </DialogHeader>

              <ScrollArea className="h-[32rem] mt-4 p-1 pr-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="label">Label</Label>
                      <Input
                        id="label"
                        value={form.label}
                        onChange={(e) => handleChange("label", e.target.value)}
                        placeholder="Holiday10"
                        className={inputClass(!!errors.label)}
                        aria-invalid={!!errors.label}
                      />
                      {errorText(errors.label)}
                    </div>
                    <div className="md:col-span-1">
                      <Label>Activate Immediately</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Switch
                          checked={!!form.active}
                          onCheckedChange={(val) => handleChange("active", val)}
                        />
                        <span className="text-sm">{form.active ? "Active" : "Disabled"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assign To + (fixed) Usage Limit & Valid X Days */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label >Assign To</Label>
                      <Select

                        value={form.assignTo}
                        onValueChange={(val) => handleChange("assignTo", val)}
                      >
                        <SelectTrigger className={inputClass(!!errors.assignTo)}>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="specific">Specific Users</SelectItem>
                        </SelectContent>
                      </Select>
                      {errorText(errors.assignTo)}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Usage limit per user </Label>
                      <Input value="1" disabled readOnly />
                      {errorText(errors.usageLimitPerUser)}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Valid after claim </Label>
                      <Input value="24 hours" disabled readOnly />
                      {errorText(errors.validAfterClaimDays)}
                    </div>
                  </div>

                  {/* Specific users selector */}
                  {form.assignTo === "specific" && (
                    <div className="border rounded-md p-3 space-y-2">
                      <div className="flex items-end gap-3">
                        <div className="flex flex-col gap-2">
                          <Label>Search customers by email</Label>
                          <Input
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            placeholder="Enter email address"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCustomerSearch((x) => x.trim())}
                          disabled={customersLoading}
                        >
                          {customersLoading ? "Searching..." : "Search"}
                        </Button>
                      </div>

                      <Label className="mt-2">Select Customers</Label>
                      <ScrollArea
                        className={cx(
                          "h-40 border rounded-md p-2",
                          errors.assignedUsers && "border-red-500"
                        )}
                      >
                        {customers.length === 0 && (
                          <div className="text-sm text-muted-foreground p-2">
                            {customersLoading ? "Loading..." : "No customers found."}
                          </div>
                        )}
                        <div className="space-y-2">
                          {customers.map((user) => {
                            const checked = form.assignedUsers.includes(user.id);
                            return (
                              <label key={user.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setForm((prev) => ({
                                      ...prev,
                                      assignedUsers: isChecked
                                        ? [...prev.assignedUsers, user.id]
                                        : prev.assignedUsers.filter((id) => id !== user.id),
                                    }));
                                  }}
                                />
                                <span className="text-sm">{user.email}</span>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      {errorText(errors.assignedUsers)}
                    </div>
                  )}

                  {/* Type & discount */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex  flex-col  gap-2">
                      <Label>Type</Label>
                      <Select
                        value={form.type}
                        onValueChange={(val) => handleChange("type", val)}
                      >
                        <SelectTrigger className={inputClass(!!errors.type)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="free_shipping">Free Shipping</SelectItem>
                        </SelectContent>
                      </Select>
                      {errorText(errors.type)}
                    </div>

                    {form.type !== "free_shipping" && (
                      <div className="flex  flex-col gap-2">
                        <Label>
                          {form.type === "percentage" ? "Discount (%)" : "Discount (amount)"}
                        </Label>
                        <Input
                          inputMode="numeric"
                          value={form.discount}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (/^\d*\.?\d*$/.test(v)) handleChange("discount", v);
                          }}
                          placeholder={form.type === "percentage" ? "e.g. 10" : "e.g. 200"}
                          className={inputClass(!!errors.discount)}
                          aria-invalid={!!errors.discount}
                        />
                        {errorText(errors.discount)}
                      </div>
                    )}

                    {form.type === "percentage" && (
                      <div className="flex flex-col gap-2">
                        <Label>Max Cap (amount)</Label>
                        <Input
                          inputMode="numeric"
                          value={form.conditions.maxCap}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (/^\d*\.?\d*$/.test(v)) handleChange("maxCap", v, true);
                          }}
                          placeholder="e.g. 500"
                          className={inputClass(!!errors.maxCap)}
                          aria-invalid={!!errors.maxCap}
                        />
                        {errorText(errors.maxCap)}
                      </div>
                    )}
                  </div>

                  {/* Conditions */}
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium">Conditions</h4>
                    <div className="flex items-center justify-between">
                      <Label>First-Time Buyer (optional)</Label>
                      <Switch
                        checked={!!form.conditions.firstTimeBuyer}
                        onCheckedChange={(val) => handleChange("firstTimeBuyer", val, true)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Min Spend (amount)</Label>
                      <Input
                        inputMode="numeric"
                        value={form.conditions.minSpend}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^\d*\.?\d*$/.test(v)) handleChange("minSpend", v, true);
                        }}
                        placeholder="e.g. 0"
                        className={inputClass(!!errors.minSpend)}
                        aria-invalid={!!errors.minSpend}
                      />
                      {errorText(errors.minSpend)}
                    </div>
                  </div>

                  {/* Absolute dates — controlled popovers with high z-index */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Start Date</Label>
                      <Popover modal={false} open={openStartCal} onOpenChange={setOpenStartCal}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cx(
                              "w-full justify-between",
                              errors.startDate && "border-red-500"
                            )}
                          >
                            {form.startDate ? formatDate(form.startDate, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-auto p-0 z-[9999] pointer-events-auto"
                          onPointerDownOutside={(e) => e.preventDefault()}
                          onFocusOutside={(e) => e.preventDefault()}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <div
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <Calendar
                              mode="single"
                              selected={form.startDate}
                              // block past dates
                              disabled={(date) => atMidnight(date) < today}
                              // prevent month nav to the past
                              fromDate={today}
                              onSelect={(date) => {
                                if (date) {
                                  const start = atMidnight(date);
                                  const minEnd = addDays(start, 1);
                                  setForm((prev) => {
                                    let end = prev.endDate ? atMidnight(prev.endDate) : null;
                                    // auto-bump end if it violates the new rule
                                    if (!end || end < minEnd) end = minEnd;
                                    return { ...prev, startDate: start, endDate: end };
                                  });
                                }
                                setOpenStartCal(false);
                              }}
                              initialFocus
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      {errorText(errors.startDate)}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>End Date</Label>
                      <Popover modal={false} open={openEndCal} onOpenChange={setOpenEndCal}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cx(
                              "w-full justify-between",
                              errors.endDate && "border-red-500"
                            )}
                          >
                            {form.endDate ? formatDate(form.endDate, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-auto p-0 z-[9999] pointer-events-auto"
                          onPointerDownOutside={(e) => e.preventDefault()}
                          onFocusOutside={(e) => e.preventDefault()}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <div
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <Calendar
                              mode="single"
                              selected={form.endDate}
                              // must be at least +1 day after start (or tomorrow if no start yet)
                              disabled={(date) => atMidnight(date) < endMinDate}
                              // prevent month nav before minimum end date
                              fromDate={endMinDate}
                              onSelect={(date) => {
                                if (date) {
                                  const end = atMidnight(date);
                                  setForm((prev) => ({ ...prev, endDate: end }));
                                }
                                setOpenEndCal(false);
                              }}
                              initialFocus
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      {errorText(errors.endDate)}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? "Saving..." : editCoupon ? "Save" : "Create Coupon"}
                  </Button>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Filter Start</Label>
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filterStart ? formatDate(filterStart, "PPP") : "Start date"}
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="z-[9999] w-auto p-0" align="start">
                <Calendar mode="single" selected={filterStart} onSelect={setFilterStart} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Filter End</Label>
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filterEnd ? formatDate(filterEnd, "PPP") : "End date"}
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="z-[9999] w-auto p-0" align="start">
                <Calendar mode="single" selected={filterEnd} onSelect={setFilterEnd} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="col-span-2 flex gap-2">
            <Button
              onClick={() => {
                setFilterStart(null);
                setFilterEnd(null);
              }}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading && <div className="text-sm text-muted-foreground">Loading coupons…</div>}
          {!loading &&
            filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="border rounded-md p-4 flex justify-between items-start"
              >
                <div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="font-semibold text-green-700">{coupon.label}</span>
                    <Badge>{coupon.type}</Badge>
                    <Badge variant={coupon.active ? "default" : "outline"}>
                      {coupon.active ? "Active" : "Disabled"}
                    </Badge>
                    {coupon.assignTo === "specific" && (
                      <Badge variant="secondary">Specific users</Badge>
                    )}
                  </div>

                  {/* Discount display */}
                  {coupon.type !== "free_shipping" && coupon.discount != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Discount:{" "}
                      {coupon.type === "percentage"
                        ? `${coupon.discount}%`
                        : coupon.discount}
                      {coupon.type === "percentage" && coupon?.conditions?.maxCap
                        ? ` (cap: ${coupon.conditions.maxCap})`
                        : ""}
                    </p>
                  )}

                  {/* Conditions */}
                  {(coupon?.conditions?.minSpend !== null &&
                    coupon?.conditions?.minSpend !== undefined) ||
                    coupon?.conditions?.firstTimeBuyer ? (
                    <p className="text-xs text-muted-foreground">
                      {coupon?.conditions?.minSpend !== null &&
                        coupon?.conditions?.minSpend !== undefined
                        ? `Min spend: ${coupon.conditions.minSpend}`
                        : ""}
                      {coupon?.conditions?.firstTimeBuyer
                        ? `${coupon?.conditions?.minSpend ? " · " : ""}First-time only`
                        : ""}
                    </p>
                  ) : null}

                  {/* Validity — show BOTH campaign window + on-claim (FOMO) */}
                  {coupon.startDate && coupon.endDate ? (
                    <p className="text-xs text-muted-foreground">
                      Campaign: {formatDate(coupon.startDate, "PPP")} →{" "}
                      {formatDate(coupon.endDate, "PPP")}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    On claim: valid for {coupon.validAfterClaimDays ?? FIXED_VALID_AFTER_DAYS} day(s)
                  </p>

                  {/* Usage limits */}
                  <p className="text-xs text-muted-foreground">
                    Per-user: {coupon.usageLimitPerUser ?? FIXED_USAGE_LIMIT_PER_USER}
                    {typeof coupon.current_usage === "number"
                      ? ` · Used: ${coupon.current_usage}`
                      : ""}
                  </p>
                </div>

                {/* In your coupon list, replace the Button with this conditional render */}
                <div className="flex gap-2 items-center mt-1">
                  <Switch
                    checked={coupon.active}
                    onCheckedChange={() => toggleActive(coupon.id)}
                    disabled={togglingId === coupon.id || creating}
                  />
                  {!coupon.auto_issued && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditCoupon(coupon);
                        setDialogOpen(true);
                        setOpenStartCal(false);
                        setOpenEndCal(false);
                      }}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                  )}
                  {coupon.auto_issued && (
                    <Badge variant="secondary">Exchange Coupon</Badge>
                  )}
                </div>
              </div>
            ))}
          {!loading && filteredCoupons.length === 0 && (
            <div className="text-sm text-muted-foreground">No coupons found.</div>
          )}
        </div>
      </div>
    </main>
  );
};
