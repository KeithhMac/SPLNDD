import React, { useEffect, useMemo, useState, useCallback, useContext } from "react";
import api from "../api/axios";
import { toast } from "sonner";

import { AdminAuthContext } from "@/context/AdminAuthContext";

// Cards & Buttons
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Form Elements
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

// Table
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// Dropdown Menu
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Pagination
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

// Dialog / Modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { EllipsisVertical } from "lucide-react";

export const AdminEmployee = () => {
  const MODULES = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Manage Product" },
    { key: "orders", label: "Manage Order" },
    { key: "contents", label: "Manage Content" },
    { key: "reports", label: "Manage Report" },
    { key: "coupons", label: "Manage Coupon" },
  ];

  const { admin } = useContext(AdminAuthContext);

  const [isCreating, setIsCreating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSavingModules, setIsSavingModules] = useState(false);


  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [perms, setPerms] = useState(
    MODULES.reduce((obj, m) => ({ ...obj, [m.key]: true }), {})
  );

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [editTarget, setEditTarget] = useState(null);
  const [editPerms, setEditPerms] = useState({});
  const [isTogglingActivity, setIsTogglingActivity] = useState(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("admin/manage-employee/fetch");
      if (data.success) setAdmins(data.admins || []);
    } catch (err) {
      toast.error("Failed to load admins", {
        description: err.response?.data?.message || "Server error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => a.email?.toLowerCase().includes(q));
  }, [admins, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => setPage(1), [search]);

  const togglePerm = (key) => setPerms((p) => ({ ...p, [key]: !p[key] }));

  const handleCreate = async () => {
    const modules = Object.keys(perms).filter((k) => perms[k]);
    if (!firstName || !lastName || !email || !modules.length) {
      return toast.error("All fields and at least one module are required.");
    }
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email)) {
      return toast.error("Only Gmail addresses are allowed.");
    }

    setIsCreating(true); // disable button & show loading

    try {
      await api.post("admin/manage-employee/create", {
        firstName,
        lastName,
        email,
        modules,
        status: "admin",
        activity: "active",
        adminEmail: admin?.email, // 👈 add this
      });
      toast.success("Admin created & invitation email sent.");
      setFirstName("");
      setLastName("");
      setEmail("");
      fetchAdmins();
    } catch (err) {
      toast.error("Failed to create admin", {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsCreating(false); // re-enable button
    }
  };

  const handleToggleActivity = async (row) => {

    setIsTogglingActivity(row.id);
    try {
      const next = row.activity === "active" ? "disabled" : "active";
      await api.patch(`admin/manage-employee/${row.id}/activity`, {
        activity: next,
        adminEmail: admin?.email, // 👈 add this
      });
      toast.success(`Account ${next}.`);
      // ⏳ Wait 1 second before refreshing
      setTimeout(() => {
        fetchAdmins();
      }, 1000);
    } catch (err) {
      toast.error("Failed to update activity", {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsTogglingActivity(null);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    setTimeout(() => {
      setFirstName("");
      setLastName("");
      setEmail("");
      setIsClearing(false);
    }, 500); // small delay to indicate loading
  };


  // const handleDelete = async (row) => {
  //   if (!confirm(`Delete admin ${row.email}? This cannot be undone.`)) return;
  //   try {
  //     await api.delete(`admin/manage-employee/${row.id}`, {
  //       data: { adminEmail: admin?.email }, // 👈 pass in data for axios DELETE
  //     });
  //     toast.success("Admin deleted.");
  //     fetchAdmins();
  //   } catch (err) {
  //     toast.error("Failed to delete admin", {
  //       description: err.response?.data?.message || err.message,
  //     });
  //   }
  // };

  const formatModules = (row) => {
    const list = row.modules || [];
    if (!list.length) return "—";
    return list
      .map((m) => MODULES.find((x) => x.key === m)?.label || m)
      .join(", ");
  };

  // ✅ Styled badge for activity
  const statusBadge = (status) => {
    const base =
      "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium";
    if (status === "active") return `${base} bg-green-100 text-green-700`;
    if (status === "disabled") return `${base} bg-gray-200 text-gray-800`;
    return `${base} bg-yellow-100 text-yellow-800`; // fallback
  };


  // Skeleton loading state
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
      <main className="w-full space-y-6">
        {/* Create Admin Skeleton */}
        <div className="p-4 bg-white rounded-xl shadow-md">
          <Skeleton className="h-6 w-40 mb-4 bg-gray-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2 bg-gray-100" />
                <Skeleton className="h-10 w-full rounded bg-gray-100" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-36 mb-2 bg-gray-100" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 bg-gray-100 rounded" />
                <Skeleton className="h-4 w-28 bg-gray-100" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded bg-gray-200" />
            <Skeleton className="h-10 w-24 rounded bg-gray-100" />
          </div>
        </div>

        {/* Admin List Skeleton */}
        <div className="p-4 bg-white rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-3">
            <Skeleton className="h-4 w-28 bg-gray-200" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded bg-gray-100" />
              <Skeleton className="h-10 w-24 rounded bg-gray-100" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Email", "Activity", "Status", "Modules", "Actions"].map((h) => (
                    <TableHead key={h}>
                      <Skeleton className="h-4 w-20 bg-gray-200" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-36 bg-gray-100" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded bg-gray-100" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-gray-100" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-44 bg-gray-100" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 rounded bg-gray-100" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
            <Skeleton className="h-9 w-9 rounded bg-gray-100" />
            <Skeleton className="h-9 w-16 sm:w-20 rounded bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }



  return (
    <main className="w-full space-y-6">
      {/* Create Admin */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Add New Admin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>
              First Name
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Label>
          </div>
          <div>
            <Label>
              Last Name
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Label>
          </div>
          <div>
            <Label>
              Email
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Only Gmail allowed"
              />
            </Label>
          </div>
        </div>

        <div className="mt-4">
          <Label className="block mb-2">Module Access</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MODULES.map((m) => (
              <label
                key={m.key}
                className="flex items-center gap-2 border rounded p-2"
              >
                <Checkbox
                  checked={perms[m.key]}
                  onCheckedChange={() => togglePerm(m.key)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Adding..." : "Add Admin"}
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isCreating || isClearing}
          >
            {isClearing ? "Clearing..." : "Clear"}
          </Button>
        </div>
      </Card>

      {/* Admin List */}
      <Card className="p-4 relative z-0">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Admins</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Search email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" onClick={fetchAdmins}>
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No admins found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          <span className={statusBadge(row.activity)}>
                            {row.activity}
                          </span>
                        </TableCell>
                        <TableCell className="capitalize">
                          {row.status}
                        </TableCell>
                        <TableCell>{formatModules(row)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50">
                              <DropdownMenuItem
                                onClick={() => handleToggleActivity(row)}
                                disabled={isTogglingActivity === row.id}
                              >
                                {isTogglingActivity === row.id
                                  ? (row.activity === "active" ? "Disabling..." : "Enabling...")
                                  : (row.activity === "active" ? "Disable" : "Enable")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setTimeout(() => {
                                    setEditTarget(row);
                                    setEditPerms(
                                      row.modules?.reduce(
                                        (acc, k) => ({ ...acc, [k]: true }),
                                        {}
                                      ) || {}
                                    );
                                  }, 0); // defers state update after paint
                                }}
                              >
                                Edit Modules
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem
                                isDanger
                                onClick={() => handleDelete(row)}
                              >
                                Delete
                              </DropdownMenuItem> */}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4 flex justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={page === p}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </Card>

      {/* Edit Modules Modal */}
      {editTarget && (
        <Dialog open onOpenChange={() => setEditTarget(null)}>
          <DialogContent className="max-w-sm z-[9999]">
            <DialogHeader>
              <DialogTitle>Edit Modules</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 p-4">
              {MODULES.map((m) => (
                <label key={m.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={!!editPerms[m.key]}
                    onCheckedChange={() =>
                      setEditPerms((p) => ({ ...p, [m.key]: !p[m.key] }))
                    }
                  />
                  {m.label}
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  const mods = Object.keys(editPerms).filter(
                    (k) => editPerms[k]
                  );
                  if (!mods.length) {
                    toast.error("Select at least one module.");
                    return;
                  }
                  setIsSavingModules(true);
                  try {
                    await api.patch(
                      `admin/manage-employee/${editTarget.id}/modules`,
                      { modules: mods, adminEmail: admin?.email } // 👈 add this
                    );
                    toast.success("Modules updated.");
                    fetchAdmins();
                    setEditTarget(null);
                  } catch (err) {
                    toast.error("Failed to update modules", {
                      description: err.response?.data?.message || err.message,
                    });
                  } finally {
                    setIsSavingModules(false);
                  }
                }}
                disabled={isSavingModules}
              >
                {isSavingModules ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
};
