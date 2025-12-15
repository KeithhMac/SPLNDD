import React, { useEffect, useState, useContext, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import intro_bg from "../Images/intro-bg.png";
import api from "@/api/axios";
import { CustomerAuthContext } from "@/context/CustomerAuthContext.jsx";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { socket } from "@/lib/socket";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// Helpers
const ensureObj = (x) => {
  if (!x) return {};
  if (typeof x === "string") {
    try {
      return JSON.parse(x);
    } catch {
      return {};
    }
  }
  return x;
};

const fmtPH = (d) =>
  new Date(d).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

const decorateCouponForClient = (row) => {
  if (!row) return row;
  const cond = ensureObj(row.conditions);
  const type = row.type;
  const discount = row.discount;

  let deal = "";
  if (type === "free_shipping") deal = "Free Shipping";
  else if (type === "percentage") deal = `${Number(discount)}% OFF`;
  else if (type === "fixed")
    deal = `₱${Number(discount).toLocaleString("en-PH")} OFF`;

  const descParts = [];
  if (cond?.minSpend != null && Number(cond.minSpend) > 0) {
    descParts.push(
      `Minimum spend of ₱${Number(cond.minSpend).toLocaleString("en-PH")}`
    );
  }
  if (cond?.firstTimeBuyer) descParts.push("First-time buyer only");
  const description = descParts.join(" · ");

  const days = row.valid_after_claim_days ?? 1;
  const validity =
    `Valid for ${days} day${days > 1 ? "s" : ""} after claiming · ` +
    `Valid from ${fmtPH(row.start_date)} - ${fmtPH(row.end_date)}`;

  return {
    ...row,
    conditions: cond,
    deal,
    description,
    validity,
  };
};

// const getCouponStatus = (claimedAt, days) => {
//   if (!claimedAt || !days) return "active";
//   const claimDate = new Date(claimedAt);
//   const utc = claimDate.getTime() + 8 * 60 * 60 * 1000;
//   const expDate = new Date(utc);
//   expDate.setDate(expDate.getDate() + Number(days));
//   const nowPH = new Date(Date.now() + 8 * 60 * 60 * 1000);
//   return nowPH > expDate ? "expired" : "active";
// };

const isDecorated = (c) => c && "deal" in c && "validity" in c;

export const Vouchers = () => {
  const { user, isAuthLoading } = useContext(CustomerAuthContext);

  const [available, setAvailable] = useState([]);
  const [claimedList, setClaimedList] = useState([]);
  const [claimed, setClaimed] = useState([]);
  const [claimTimestamps, setClaimTimestamps] = useState({});
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [loadingClaimed, setLoadingClaimed] = useState(false);
  const [claimingIds, setClaimingIds] = useState(new Set());
  const isClaiming = (id) => claimingIds.has(String(id));
  const startClaiming = (id) =>
    setClaimingIds((prev) => new Set(prev).add(String(id)));
  const stopClaiming = (id) =>
    setClaimingIds((prev) => {
      const s = new Set(prev);
      s.delete(String(id));
      return s;
    });

  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingClaim, setPendingClaim] = useState(null);

  const delay = (ms) =>
    new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

  // Silent refetch (no skeleton) to ensure lists stay server-accurate
  const refreshCoupons = useCallback(async () => {
    try {
      const { data: avail } = await api.get(`/customer/coupons/available`);
      setAvailable(avail?.success ? avail.data : []);
    } catch {
      console.log("Failed to refresh available coupons");
    }
    if (!isAuthLoading && user) {
      try {
        const { data: claimedRes } = await api.get(`/customer/coupons/claimed`);
        if (claimedRes?.success) {
          const list = claimedRes.data || [];
          setClaimedList(list);
          const ids = list.map((v) => String(v.id));
          setClaimed(ids);
          const ts = {};
          list.forEach((v) => {
            ts[v.id] = v.claimedAt || v.claimed_at || null;
          });
          setClaimTimestamps(ts);
        }
      } catch {
        console.log("Failed to refresh claimed coupons");
      }
    }
  }, [user, isAuthLoading]);

  // Initial fetch with skeleton timing
  useEffect(() => {
    const run = async () => {
      const availStart = Date.now();
      try {
        setLoadingAvail(true);
        const { data } = await api.get(`/customer/coupons/available`);
        setAvailable(data?.success ? data.data : []);
      } catch {
        setAvailable([]);
      } finally {
        const elapsed = Date.now() - availStart;
        await delay(2000 - elapsed);
        setLoadingAvail(false);
      }

      if (!isAuthLoading && user) {
        const claimedStart = Date.now();
        try {
          setLoadingClaimed(true);
          const { data } = await api.get(`/customer/coupons/claimed`);
          if (data?.success) {
            setClaimedList(data.data || []);
            const ids = (data.data || []).map((v) => String(v.id));
            setClaimed(ids);
            const ts = {};
            (data.data || []).forEach((v) => {
              ts[v.id] = v.claimedAt || v.claimed_at || null;
            });
            setClaimTimestamps(ts);
          } else {
            setClaimedList([]);
          }
        } catch {
          setClaimedList([]);
        } finally {
          const elapsed = Date.now() - claimedStart;
          await delay(2000 - elapsed);
          setLoadingClaimed(false);
        }
      } else if (!user) {
        setClaimedList([]);
        setClaimed([]);
        setClaimTimestamps({});
      }
    };
    run();
  }, [user, isAuthLoading]);

  // Realtime updates
  useEffect(() => {
    if (!socket) return;

    const mergeReplaceById = (prev, incoming) =>
      prev.map((c) => {
        if (c.id !== incoming.id) return c;
        const claimedAt = c.claimedAt || c.claimed_at;
        const withClaimed = claimedAt
          ? { ...incoming, claimedAt }
          : incoming;
        return withClaimed;
      });

    const handleCouponChanged = ({ action, coupon }) => {
      const decorated = isDecorated(coupon)
        ? coupon
        : decorateCouponForClient(coupon);

      setAvailable((prev) => {
        if (action === "deleted") return prev.filter((c) => c.id !== decorated.id);
        if (action === "created") return [decorated, ...prev];
        if (action === "updated" || action === "toggled") {
          const exists = prev.some((c) => c.id === decorated.id);
          return exists ? mergeReplaceById(prev, decorated) : prev;
        }
        return prev;
      });

      setClaimedList((prev) => {
        if (action === "deleted") return prev.filter((c) => c.id !== decorated.id);
        if (action === "updated" || action === "toggled") {
          const exists = prev.some((c) => c.id === decorated.id);
          return exists ? mergeReplaceById(prev, decorated) : prev;
        }
        return prev;
      });

      refreshCoupons();
    };

    socket.on("couponChanged", handleCouponChanged);
    return () => {
      socket.off("couponChanged", handleCouponChanged);
    };
  }, [refreshCoupons]);

  const handleClaim = async (id, labelForToast) => {
    if (isAuthLoading) return;
    if (!user) {
      toast.error("Please sign in to claim coupons.");
      return;
    }
    if (isClaiming(id)) return;

    startClaiming(id);
    const startTime = Date.now();

    try {
      const { data } = await api.post(`/customer/coupons/claim`, {
        couponId: id,
      });
      if (!data?.success) throw new Error(data?.message || "Claim failed");

      setClaimed((prev) => [...prev, String(id)]);
      setClaimTimestamps((prev) => ({
        ...prev,
        [id]: data.voucher.claimedAt,
      }));
      setClaimedList((prev) => [data.voucher, ...prev]);
      setAvailable((prev) => prev.filter((v) => String(v.id) !== String(id)));

      toast.success(`Coupon "${labelForToast}" successfully claimed!`);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to claim coupon";
      toast.error(msg);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1000 - elapsed);
      setTimeout(() => stopClaiming(id), remaining);
    }
  };

  const isClaimed = (voucher) =>
    claimed.includes(String(voucher.id)) || voucher.status === "claimed";

  const VoucherSkeletonCard = ({ claimed = false }) => (
    <div className="flex justify-between items-center border rounded-md sm:rounded-lg p-3 sm:p-4 bg-gray-50">
      <div className="flex flex-col text-left space-y-1.5 sm:space-y-2 flex-1">
        <Skeleton className="h-5 sm:h-6 w-40 sm:w-56" />
        <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
        <Skeleton className="h-3 sm:h-4 w-3/4" />
        <Skeleton className="h-3 sm:h-4 w-1/2" />
      </div>
      <div className="ml-3 sm:ml-4">
        {claimed ? (
          <Skeleton className="h-6 sm:h-7 w-16 sm:w-20 rounded" />
        ) : (
          <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded" />
        )}
      </div>
    </div>
  );

  return (
    <main className="w-full flex flex-col items-center min-h-screen">
      {/* Hero */}
      <div
        className="w-full h-[12rem] sm:h-[15rem] bg-cover bg-top flex items-center justify-center text-white rounded-lg sm:rounded-2xl my-4 sm:my-6 bg-black/30 bg-blend-overlay"
        style={{ backgroundImage: `url(${intro_bg})` }}
      >
        <div className="text-center px-4">
          <h1 className="text-xl sm:text-2xl font-bold capitalize">
            SPLND&apos;D - Vouchers
          </h1>
          <p className="mt-2 sm:mt-4 text-xs sm:text-sm max-w-[28rem] mx-auto opacity-90">
            Discover exclusive discounts and offers just for you.
          </p>
        </div>
      </div>

      {/* Voucher Tabs */}
      <div className="w-full max-w-full sm:max-w-[34rem] p-4 sm:p-6 rounded-lg sm:rounded-xl border shadow bg-white">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
          Your Coupons
        </h2>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-3 sm:mb-4 bg-gray-100 rounded-md sm:rounded-lg">
            <TabsTrigger
              value="available"
              className="rounded-md sm:rounded-lg text-xs sm:text-sm cursor-pointer"
            >
              Available
            </TabsTrigger>
            <TabsTrigger
              value="claimed"
              className="rounded-md sm:rounded-lg text-xs sm:text-sm cursor-pointer"
            >
              Claimed
            </TabsTrigger>
          </TabsList>

          {/* Available */}
          <TabsContent value="available">
            <ScrollArea className="h-[18rem] sm:h-[20rem] p-1">
              <div className="space-y-2 sm:space-y-3">
                {loadingAvail ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <VoucherSkeletonCard key={i} />
                    ))}
                  </>
                ) : (
                  <>
                    {available
                      .filter((v) => !isClaimed(v))
                      .map((v) => {
                        const claiming = isClaiming(v.id);
                        return (
                          <div
                            key={v.id}
                            className="flex justify-between items-center border rounded-md sm:rounded-lg p-3 sm:p-4 bg-green-50 hover:bg-green-100 transition"
                          >
                            <div className="flex flex-col text-left space-y-0.5 sm:space-y-1">
                              <span className="text-sm sm:text-base font-bold text-green-700">
                                {v.deal}
                              </span>
                              {v.label && (
                                <span className="text-[10px] sm:text-xs font-semibold text-green-600 uppercase tracking-wide">
                                  {v.label}
                                </span>
                              )}
                              {v.description && (
                                <span className="text-xs sm:text-sm text-gray-700">
                                  {v.description}
                                </span>
                              )}
                              <span className="text-[10px] sm:text-xs text-gray-500">
                                {v.validity}
                              </span>
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <AlertDialog
                                open={alertOpen && pendingClaim && pendingClaim.id === v.id}
                                onOpenChange={setAlertOpen}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setPendingClaim(v);
                                      setAlertOpen(true);
                                      console.log("Claim dialog opened for coupon:", v);
                                    }}
                                    className="text-[10px] sm:text-xs bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
                                    disabled={claiming}
                                  >
                                    {claiming ? (
                                      <span className="inline-flex items-center gap-1 sm:gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Claiming…
                                      </span>
                                    ) : (
                                      "Claim"
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Claim Coupon "{v.label || v.deal}"?
                                    </AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <AlertDialogDescription>
                                    Are you sure you want to claim this coupon?
                                    <br />
                                    <br />
                                    <b>Expiration:</b>{" "}
                                    {(() => {
                                      // Always default to 1 if missing
                                      const days = Number(v.valid_after_claim_days ?? 1);
                                      const now = new Date();
                                      now.setDate(now.getDate() + days);
                                      console.log("Rendering expiration for coupon:", v.label, "valid_after_claim_days:", days);
                                      return now.toLocaleString("en-PH", {
                                        timeZone: "Asia/Manila",
                                        dateStyle: "long",
                                        timeStyle: "short",
                                      });
                                    })()}
                                    <br />
                                    <span className="text-xs text-gray-600">
                                      By claiming, you agree to use the coupon before expiration.
                                    </span>
                                  </AlertDialogDescription>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel
                                      onClick={() => {
                                        setAlertOpen(false);
                                        setPendingClaim(null);
                                      }}
                                    >
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        setAlertOpen(false);
                                        setPendingClaim(null);
                                        await handleClaim(v.id, v.label || v.deal);
                                      }}
                                    >
                                      Yes, Claim
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}

                    {available.filter((v) => !isClaimed(v)).length === 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center mt-4">
                        No available coupons.
                      </p>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Claimed */}
          <TabsContent value="claimed">
            <ScrollArea className="h-[18rem] sm:h-[20rem] p-1">
              <div className="space-y-2 sm:space-y-3">
                {loadingClaimed ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <VoucherSkeletonCard key={i} claimed />
                    ))}
                  </>
                ) : (
                  <>
                    {claimedList.map((v) => {
                      const claimedAt = v.claimedAt || v.claimed_at || claimTimestamps[v.id];
                      const validDays = v.valid_after_claim_days || 1;
                      // const status = getCouponStatus(claimedAt, validDays);

                      return (
                        <div key={v.id} className="flex justify-between items-center border rounded-md sm:rounded-lg p-3 sm:p-4 bg-gray-50">
                          <div className="flex flex-col text-left space-y-0.5 sm:space-y-1">
                            <span className="text-sm sm:text-base font-bold text-green-700">{v.deal}</span>
                            {v.label && <span className="text-[10px] sm:text-xs font-semibold text-green-600 uppercase tracking-wide">{v.label}</span>}
                            {v.description && <span className="text-xs sm:text-sm text-gray-700">{v.description}</span>}
                            <span className="text-[10px] sm:text-xs text-gray-500">{v.validity}</span>
                            {claimedAt && (
                              <span className="text-[10px] sm:text-[11px] text-gray-400 italic">
                                Claimed on{" "}
                                {new Date(claimedAt).toLocaleString("en-PH", {
                                  timeZone: "Asia/Manila",
                                  dateStyle: "long",
                                  timeStyle: "short",
                                })}
                              </span>
                            )}
                            {claimedAt && (
                              <span className="text-[10px] sm:text-[11px] text-gray-400 italic">
                                Expires on{" "}
                                {(() => {
                                  // Convert claimedAt (UTC) to PH time, add days in PH time, then display in PH
                                  const claimedPH = new Date(new Date(claimedAt).toLocaleString("en-US", { timeZone: "Asia/Manila" }));
                                  claimedPH.setDate(claimedPH.getDate() + Number(validDays));
                                  return claimedPH.toLocaleString("en-PH", {
                                    timeZone: "Asia/Manila",
                                    dateStyle: "long",
                                    timeStyle: "short",
                                  });
                                })()}
                              </span>
                            )}

                            {/* <span className={`text-[10px] sm:text-[11px] font-semibold ${status === "expired" ? "text-red-600" : "text-green-600"}`}>
                              Status: {status === "expired" ? "Expired" : "Active"}
                            </span> */}
                          </div>
                          <div className="ml-3 sm:ml-4 flex flex-col gap-2 items-end">
                            <span className="text-[10px] sm:text-xs px-2 py-1 rounded bg-gray-200 text-gray-600">Claimed</span>
                          </div>
                        </div>
                      );
                    })}

                    {claimedList.length === 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center mt-4">
                        No claimed coupons yet.
                      </p>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};