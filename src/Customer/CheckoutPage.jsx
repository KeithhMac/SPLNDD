import React, { useState, useContext, useEffect, useMemo, } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { CustomerAuthContext } from "@/context/CustomerAuthContext";
import api from "@/api/axios";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";

import { PH_LOCATIONS, SHIPPING_FEES } from "@/utils/PH_LOCATIONS";

export const CheckoutPage = () => {

  // ---- Cart context ----
  const {
    cart,
    cartLoaded,
    totalOrders,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  // ---- Auth ----
  const { user } = useContext(CustomerAuthContext);

  // ---- Address state ----
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [editingAddressId, setEditingAddressId] = useState("");



  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [confirmedCoupon, setConfirmedCoupon] = useState("");
  const [openCoupon, setOpenCoupon] = useState(false);

  // coupons from backend
  const [claimedCoupons, setClaimedCoupons] = useState([]);   // ONLY CLAIMED coupons


  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState("");
  const [proceeding, setProceeding] = useState(false);



  // ---- Address form fields ----
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");

  const cities = province ? Object.keys(PH_LOCATIONS[province]) : [];
  const districts = province && city ? PH_LOCATIONS[province][city] : [];

  // ---- Load user addresses ----
  useEffect(() => {
    if (!user) return;
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const res = await api.get(
          `${import.meta.env.VITE_SERVER_URL}/customer/personal-info/addresses`,
          { withCredentials: true }
        );
        setAddresses(res.data.addresses || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load your addresses.");
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [user]);

  // ---- Address form helpers ----
  const clearForm = () => {
    setEditingAddressId("");
    setName("");
    setContact("");
    setProvince("");
    setCity("");
    setDistrict("");
    setAddress("");
  };

  const startEditingAddress = (item) => {
    setEditingAddressId(item.id);
    setSelectedAddressId(String(item.id));
    setName(item.name);
    setContact(item.contact);
    setProvince(item.province);
    setCity(item.city);
    setDistrict(item.district);
    setAddress(item.address);
  };

  const saveAddress = async () => {
    if (!user) return toast.error("You must be logged in to save addresses.");
    if (!name || !contact || !province || !city || !district || !address) {
      toast.error("All fields are required");
      return;
    }
    const isValidPHNumber = /^09\d{9}$/.test(contact);
    if (!isValidPHNumber) {
      toast.error("Invalid contact number. Use format: 09XXXXXXXXX");
      return;
    }

    const payload = { name, contact, province, city, district, address };
    setSavingAddress(true);
    const startTime = Date.now();

    try {
      let saved = null;

      if (editingAddressId) {
        const res = await api.patch(
          `${import.meta.env.VITE_SERVER_URL}/customer/personal-info/addresses/${editingAddressId}`,
          payload,
          { withCredentials: true }
        );
        saved = res.data.address;
        setAddresses((prev) =>
          prev.map((a) =>
            String(a.id) === String(editingAddressId) ? saved : a
          )
        );
        toast.success("Address updated.");
      } else {
        const res = await api.post(
          `${import.meta.env.VITE_SERVER_URL}/customer/personal-info/addresses`,
          payload,
          { withCredentials: true }
        );
        saved = res.data.address;
        setAddresses((prev) => [...prev, saved]);
        toast.success("Address saved.");
      }

      setSelectedAddressId(String(saved.id));
      clearForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save address.");
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1000 - elapsed);
      setTimeout(() => setSavingAddress(false), remaining);
    }
  };


  const deleteAddress = async (id) => {
    setDeletingAddressId(id);
    const startTime = Date.now();

    try {
      await api.delete(
        `${import.meta.env.VITE_SERVER_URL}/customer/personal-info/addresses/${id}`,
        { withCredentials: true }
      );
      setAddresses((prev) => prev.filter((a) => String(a.id) !== String(id)));
      if (String(selectedAddressId) === String(id)) setSelectedAddressId("");
      toast.success("Address deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete address.");
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1000 - elapsed);
      setTimeout(() => setDeletingAddressId(""), remaining);
    }
  };


  // ---- SHIPPING: compute from selected province + total cart weight ----
  const selectedAddress = addresses.find(
    (a) => String(a.id) === String(selectedAddressId)
  );
  const shippingProvince = selectedAddress?.province || null;

  const totalWeightKg = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + (Number(item.weightKg) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [cart]
  );

  const computeShipping = (province, weightKg) => {
    const rule = province ? SHIPPING_FEES[province] : null;
    if (!rule) return null;

    const billableKg = Math.max(1, Math.ceil(weightKg || 0)); // round up at least 1kg
    return rule.baseFee + rule.perKg * billableKg;
  };

  const estimatedShipping = useMemo(
    () => computeShipping(shippingProvince, totalWeightKg),
    [shippingProvince, totalWeightKg]
  );

  // Fetch ONLY claimed coupons
  useEffect(() => {
    const run = async () => {
      try {
        if (user) {
          const { data } = await api.get(`${import.meta.env.VITE_SERVER_URL}/customer/coupons/claimed`, { withCredentials: true });
          setClaimedCoupons(data?.success ? (data.data || []) : []);
        } else {
          setClaimedCoupons([]);
        }
      } catch {
        setClaimedCoupons([]);
      }
    };
    run();
  }, [user]);

  // Use claimedCoupons only
  const couponsView = useMemo(() => [...claimedCoupons], [claimedCoupons]);

  const isCouponUsed = (coupon) => {
    const usedCount = Number(coupon?.raw?.usage_count ?? 0);
    const perUser = Number(coupon?.raw?.usage_limit_per_user ?? 1);
    return usedCount >= perUser;
  };

  // REALTIME: currently highlighted coupon (selected in popover) or confirmed one
  const activeCouponId = confirmedCoupon || "";
  const activeCoupon = useMemo(() => {
    const c = couponsView.find((x) => String(x.id) === String(activeCouponId));
    return c && !isCouponUsed(c) ? c : null;   // 👈 don't activate used coupons
  }, [couponsView, activeCouponId]);

  // Put this near your other effects
  useEffect(() => {
    if (openCoupon) {
      setSelectedCoupon(confirmedCoupon || "");
    }
  }, [openCoupon, confirmedCoupon]);




  // which coupon row is currently selected in the popover?
  const selectedCouponObj = useMemo(
    () => couponsView.find((c) => String(c.id) === String(selectedCoupon)),
    [couponsView, selectedCoupon]
  );

  // is that selected coupon already used?
  const selectedIsUsed = !!(selectedCouponObj && isCouponUsed(selectedCouponObj));

  // REALTIME coupon math
  const { couponDiscount, shippingDiscount, couponError } = useMemo(() => {
    if (!activeCoupon?.raw) return { couponDiscount: 0, shippingDiscount: 0, couponError: null };

    const raw = activeCoupon.raw;
    const type = raw.type;
    const subtotal = Number(totalPrice || 0);
    const minSpend = Number(raw?.conditions?.minSpend ?? 0);
    const maxCap = raw?.conditions?.maxCap != null ? Number(raw.conditions.maxCap) : null;

    if (subtotal < minSpend) {
      return { couponDiscount: 0, shippingDiscount: 0, couponError: `Requires minimum spend of ₱${minSpend.toLocaleString()}` };
    }

    if (type === "percentage") {
      const pct = Number(raw.discount || 0) / 100;
      let val = subtotal * pct;
      if (maxCap != null) val = Math.min(val, maxCap);
      return { couponDiscount: Math.max(0, val), shippingDiscount: 0, couponError: null };
    }
    if (type === "fixed") {
      let val = Math.min(subtotal, Number(raw.discount || 0));
      return { couponDiscount: Math.max(0, val), shippingDiscount: 0, couponError: null };
    }
    if (type === "free_shipping") {
      const ship = Number(estimatedShipping || 0);
      return { couponDiscount: 0, shippingDiscount: ship, couponError: null };
    }
    return { couponDiscount: 0, shippingDiscount: 0, couponError: null };
  }, [activeCoupon, totalPrice, estimatedShipping]);


  const isCouponBlocking = useMemo(
    () => !!(confirmedCoupon && couponError),
    [confirmedCoupon, couponError]
  );
  // What the trigger should display
  const couponTrigger = useMemo(() => {
    if (!activeCoupon) {
      return { title: "Select your coupon", msg: "", error: false };
    }
    const title = `${activeCoupon.deal}${activeCoupon?.label ? ` — ${activeCoupon.label}` : ""}`;
    return {
      title,
      msg: couponError || "",         // show min spend or any other client error
      error: !!couponError,
    };
  }, [activeCoupon, couponError]);

  const finalShipping = Math.max(0, (estimatedShipping || 0) - (shippingDiscount || 0));
  const finalTotal = Math.max(0, Number(totalPrice || 0) - Number(couponDiscount || 0) + Number(finalShipping || 0));



  const [showConfirm, setShowConfirm] = useState(false);
  const [isAgreeChecked, setIsAgreeChecked] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // 🔍 Log the current cart content
  console.log("Cart before checkout:", cart);

  const handleConfirmPayment = async () => {
    if (!isAgreeChecked) return;

    setLoadingPayment(true);

    const payload = {
      customer_id: user?.id,
      address_id: selectedAddressId,
      province: shippingProvince,

      // audit originals
      original_subtotal: Number(totalPrice || 0),
      original_shipping_fee: Number(estimatedShipping || 0),

      // final (after coupon)
      shipping_fee_at_order: Number(finalShipping) || 0,
      items: cart.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        price: i.price,
        cost_per_item: i.cost_per_item,
        weight_kg: i.weightKg,
        sku: i.sku,
        name: i.name,
      })),

      // coupon fields (realtime active)
      coupon_id: activeCoupon && !couponError ? activeCoupon.id : null,
      coupon_label: activeCoupon?.label || null,
      coupon_deal: activeCoupon?.deal || null,
      coupon_discount_amount: Number(couponDiscount || 0),
      coupon_shipping_discount: Number(shippingDiscount || 0),
      total_amount: finalTotal,
    };

    console.log("Payload being sent to /checkout:", payload);
    try {
      const res = await api.post(
        `${import.meta.env.VITE_SERVER_URL}/customer/checkout/checkout`,
        payload,
        { withCredentials: true }
      );
      const { redirect_url } = res.data;

      if (!redirect_url) {
        toast.error("Missing payment URL. Please try again.");
        setLoadingPayment(false);
        return;
      }

      // ✅ Clear the cart after confirming order creation
      clearCart();

      window.location.href = redirect_url; // redirect to Maya or payment page
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong.";

      // Show the exact backend message like:
      // "Coupon is not available or expired."
      // "Coupon requires minimum spend of ₱X."
      // etc.
      toast.error("Checkout failed", { description: msg });

      setLoadingPayment(false);
      setShowConfirm(false);
    }
  };

  return (
    <main className="min-h-screen  pt-[5rem] flex justify-center flex-wrap gap-8">
      {/* LEFT: Delivery Address */}
      <section className="flex flex-col w-full max-w-[35rem] gap-4">
        <div className="flex items-center justify-between">
          <Label id="customerAddressLabel" className="font-semibold">
            Delivery Address
          </Label>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                Edit
              </Button>
            </DialogTrigger>

            <DialogContent className="w-[95%] sm:w-[30rem] h-[25rem]  p-[1rem]  sm:h-[33rem]">
              <DialogHeader>
                <DialogTitle>Manage Addresses</DialogTitle>
                <DialogDescription>
                  Create, edit, or delete your delivery addresses.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[15rem] sm:h-[20rem] p-3 flex flex-col gap-6">
                {/* Address Form */}
                <div className="flex flex-col gap-3 p-1">
                  <Input
                    className="w-full"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    className="w-full"
                    placeholder="e.g. 09171234567"
                    value={contact}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^0?$|^09\d{0,9}$/.test(val)) setContact(val);
                    }}
                    inputMode="numeric"
                    maxLength={11}
                  />

                  <Select
                    value={province}
                    onValueChange={(val) => {
                      setProvince(val);
                      setCity("");
                      setDistrict("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[15rem]">
                      {Object.keys(PH_LOCATIONS).map((prov) => (
                        <SelectItem key={prov} value={prov}>
                          {prov}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={city}
                    onValueChange={(val) => {
                      setCity(val);
                      setDistrict("");
                    }}
                    disabled={!province}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[15rem]">
                      {cities.map((ct) => (
                        <SelectItem key={ct} value={ct}>
                          {ct}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={district}
                    onValueChange={setDistrict}
                    disabled={!city}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[15rem]">
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    className="w-full"
                    placeholder="Street / Building / Barangay"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  <div className="flex justify-end gap-2">
                    {editingAddressId && (
                      <Button variant="outline" onClick={clearForm} disabled={savingAddress}>
                        Cancel
                      </Button>
                    )}
                    <Button onClick={saveAddress} disabled={savingAddress} className="bg-[#d6a58b] hover:bg-[#dbaf98] cursor-pointer">
                      {savingAddress ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white bg-[#d6a58b] cursor-pointer" />
                          Saving...
                        </div>
                      ) : editingAddressId ? "Update" : "Add"}
                    </Button>
                  </div>

                </div>

                {/* Address List */}
                <div className="">
                  <Label className="block mb-2 text-sm font-semibold text-gray-700">
                    Saved Addresses
                  </Label>
                  <div className="border rounded-md bg-white shadow-sm">
                    {loadingAddresses ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin h-5 w-5 border-2 border-t-gray-800 border-gray-300 rounded-full" />
                      </div>
                    ) : addresses.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground p-4 text-center">
                        No saved addresses yet.
                      </p>
                    ) : (
                      <div className="divide-y">
                        {addresses.map((a) => (
                          <div
                            key={a.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 transition"
                          >
                            {/* Address info (click to edit) */}
                            <button
                              className="text-left flex-1 text-xs sm:text-sm leading-snug hover:underline"
                              onClick={() => startEditingAddress(a)}
                            >
                              <p>
                                <strong>{a.name}</strong> — {a.contact}
                              </p>
                              <p className="text-gray-600 text-xs sm:text-sm">
                                {a.address}, {a.district}, {a.city}, {a.province}
                              </p>
                            </button>

                            {/* Delete button: right-aligned always */}
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="self-start sm:self-auto"
                                onClick={() => deleteAddress(a.id)}
                                disabled={deletingAddressId === a.id}
                              >
                                {deletingAddressId === a.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-red-500" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                <DialogClose asChild className="cursor-pointer">
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>

        {/* Address Selection */}
        <Select
          value={selectedAddressId}
          onValueChange={setSelectedAddressId}
          name="customerAddressSelect"
          className="w-full bg-white"
        >
          <SelectTrigger className="w-full bg-white cursor-pointer">
            <SelectValue placeholder="Select a saved address" />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name} – {a.city}, {a.province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Address Summary */}
        {selectedAddressId ? (
          (() => {
            const selected = addresses.find(
              (a) => String(a.id) === String(selectedAddressId)
            );
            return selected ? (
              <div className="w-full mt-4 border shadow-lg rounded-md bg-white p-4 space-y-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Contact Number
                  </Label>
                  <p className="font-medium">{selected.contact}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Province</Label>
                    <p className="font-medium">{selected.province}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">City</Label>
                    <p className="font-medium">{selected.city}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">District</Label>
                    <p className="font-medium">{selected.district}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Street Address
                  </Label>
                  <p className="font-medium">{selected.address}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Address not found.
              </p>
            );
          })()
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            Please select an address.
          </p>
        )}

        <div className="w-full">
          <Label className="text-sm font-medium mb-1 block">Coupon</Label>

          <Popover
            open={openCoupon}
            onOpenChange={(o) => {
              setOpenCoupon(o);
              if (o) setSelectedCoupon(confirmedCoupon || ""); // preselect current confirmed
            }}
          >
            <PopoverTrigger asChild>
              <button
                className={[
                  "w-full flex items-center justify-between px-4 py-2 border rounded-md text-sm bg-white hover:bg-gray-50 transition cursor-pointer",
                  couponTrigger.error ? "border-red-300 bg-red-50" : "border-gray-200 text-gray-700",
                ].join(" ")}
                onClick={() => setOpenCoupon(!openCoupon)}
                aria-invalid={couponTrigger.error ? true : undefined}
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className={["truncate", couponTrigger.error ? "text-red-700" : "text-gray-800"].join(" ")}>
                    {couponTrigger.title}
                  </span>

                  {couponTrigger.error && (
                    <span className="text-xs text-red-600 mt-0.5">
                      {couponTrigger.msg} — Please adjust your cart to meet the condition.
                    </span>
                  )}
                </div>

                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${openCoupon ? "rotate-90" : ""}`}
                />
              </button>
            </PopoverTrigger>

            <PopoverContent
              sideOffset={4}
              align="start"
              className="p-0 w-[var(--radix-popover-trigger-width)]"
            >
              <div className="flex justify-between items-center p-4 pb-2">
                <h3 className="text-sm font-semibold">Coupons</h3>
                <span className="text-xs text-muted-foreground">One Coupon Per Order</span>
              </div>

              <ScrollArea className="h-[200px] px-4">
                <RadioGroup
                  value={selectedCoupon}
                  onValueChange={setSelectedCoupon}
                  className="space-y-2 pb-2"
                >
                  {couponsView.map((coupon) => {
                    const isSelected = selectedCoupon === String(coupon.id);
                    const used = isCouponUsed(coupon);

                    return (
                      <div
                        key={coupon.id}
                        onClick={() => {
                          if (used) return;
                          if (isSelected) {
                            // toggling off also clears the confirmed one
                            setSelectedCoupon("");
                            setConfirmedCoupon("");
                          } else {
                            setSelectedCoupon(String(coupon.id));
                          }
                        }}
                        className={[
                          "cursor-pointer flex items-center justify-between p-3 border rounded-md transition",
                          isSelected && !used ? "border-green-500 bg-green-50" : "hover:bg-gray-50",
                          used ? "opacity-50 cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        <div className="space-y-1 text-left">
                          <p className="text-green-600 font-bold text-sm">{coupon.deal}</p>
                          {coupon.label && (
                            <p className="text-xs font-semibold text-green-700">{coupon.label}</p>
                          )}
                          {coupon.description ? <p className="text-sm">{coupon.description}</p> : null}
                          <p className="text-xs text-gray-500">{coupon.validity}</p>
                          {used && <p className="text-[11px] text-red-600 font-medium">Used</p>}
                        </div>
                        <RadioGroupItem
                          value={String(coupon.id)}
                          checked={isSelected}
                          disabled={used}
                          className="pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </RadioGroup>
              </ScrollArea>

              {/* footer: Clear + Confirm */}
              <div className="p-4 pt-2 border-t flex gap-2">
                <Button
                  variant="outline"
                  className="w-1/2"
                  onClick={() => {
                    setSelectedCoupon("");
                    setConfirmedCoupon("");     // ensures trigger shows placeholder
                    setOpenCoupon(false);
                  }}
                >
                  Clear
                </Button>

                <Button
                  disabled={!selectedCoupon || selectedIsUsed}
                  className="w-1/2  text-white bg-[#d6a58b] hover:bg-[#dbaf98] cursor-pointer"
                  onClick={() => {
                    setConfirmedCoupon(selectedCoupon); // only confirmed shows in trigger
                    setOpenCoupon(false);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* show any client-side error (e.g., min spend)
          {activeCoupon && couponError && (
            <p className="text-xs text-red-600 mt-1">{couponError}</p>
          )} */}
        </div>

        {/* Selected Coupon Summary (like address), shows only after Confirm */}
        {confirmedCoupon && !couponError ? (() => {
          const locked = couponsView.find((c) => String(c.id) === String(confirmedCoupon));
          return locked ? (
            <div className="w-full mt-4 border shadow-lg rounded-md bg-white p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">Selected Coupon</Label>
              </div>
              <p className="text-green-700 font-semibold">{locked.deal}</p>
              {locked.label && <p className="text-xs font-semibold text-green-700">{locked.label}</p>}
              {locked.description ? <p className="text-sm">{locked.description}</p> : null}
              <p className="text-xs text-gray-500">{locked.validity}</p>
            </div>
          ) : null;
        })() : null}
      </section>

      {/* RIGHT: Cart + Totals */}
      <section className="flex flex-col w-full max-w-[35rem] gap-4 h-[auto] ">
        <div className="h-auto bg-white shadow-lg border rounded-lg ">
          <div className="flex flex-col p-3 gap-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#283618]">
                Your Cart
              </h3>
            </div>

            {/* Items */}
            <ScrollArea className="min-h-[10rem] h-[18rem] pr-3">
              <div className="w-full flex flex-col gap-2 pt-1">
                {!cartLoaded ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#BC6C25]" />
                  </div>
                ) : cart.length > 0 ? (
                  cart.map((item) => {
                    const category = item.category?.toLowerCase() || "unknown";
                    const type = item.type?.toLowerCase().replace(/\s+/g, "-") || "unknown";
                    const slug = item.name?.toLowerCase().replace(/\s+/g, "-") || "product";
                    const linkPath = `/${category}/${type}/${slug}/${item.sku}`;
                    return (
                      <div
                        key={item.id}
                        className="min-h-[6rem] flex sm:flex-row gap-4 items-center p-2 pr-4 rounded-lg bg-[#f7e8df]"
                      >
                        <NavLink
                          to={linkPath}
                          className="h-[6rem] lg:h-[13rem] w-[6rem] lg:w-[13rem] flex-shrink-0"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-[6rem] lg:h-[13rem] w-[6rem] lg:w-[13rem] object-cover rounded-md transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 hover:shadow-md"
                          />
                        </NavLink>
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex justify-between">
                            <p className="text-[11px] font-bold leading-tight">
                              <NavLink to={linkPath} className="hover:underline">
                                {item.name}
                              </NavLink>
                            </p>
                            <p className="text-xs">
                              Total:{" "}
                              <span className="font-medium">
                                PHP{" "}
                                {(
                                  item.quantity * Number(item.price || 0)
                                ).toLocaleString()}
                              </span>
                            </p>
                          </div>

                          {item.option_values &&
                            Object.keys(item.option_values).length > 0 && (
                              <p className="text-xs text-gray-500">
                                {Object.entries(item.option_values).map(([key, value], idx, arr) => (
                                  <span key={key}>
                                    {value}
                                    {idx < arr.length - 1 && <span className="mx-1">·</span>}
                                  </span>
                                ))}
                              </p>
                            )}

                          <div className="flex flex-col flex-wrap sm:flex-row gap-2 sm:items-center sm:justify-between ">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-2 text-[10px]">
                              <span>Qty:</span>
                              <button
                                className="h-6 w-6 flex items-center justify-center font-bold text-[#D5A58B] border bg-white rounded-lg cursor-pointer hover:border-[#D5A58B]"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.max(item.quantity - 1, 1)
                                  )
                                }
                              >
                                −
                              </button>

                              <input
                                type="number"
                                min={1}
                                max={item.productStock || 1}
                                value={item.quantity}
                                onChange={(e) => {
                                  const v = Math.max(
                                    1,
                                    Math.min(
                                      parseInt(e.target.value || "1", 10),
                                      item.productStock || 1
                                    )
                                  );
                                  updateQuantity(item.id, v);
                                }}
                                className="bg-white w-8 h-6 text-center rounded border"
                              />

                              <button
                                className="h-6 w-6 flex items-center justify-center font-bold text-[#D5A58B] border bg-white rounded-lg cursor-pointer hover:border-[#D5A58B]"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.min(
                                      item.quantity + 1,
                                      item.productStock || item.quantity + 1
                                    )
                                  )
                                }
                              >
                                +
                              </button>
                            </div>

                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-[10px] rounded cursor-pointer"
                              onClick={() => removeFromCart(item.variant_id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 text-sm py-6">
                    Cart is empty
                  </p>
                )}
              </div>
            </ScrollArea>
            {/* Totals + Coupon lines */}
            <div className="pt-1">
              <div className="w-full flex flex-col gap-1 text-[12px]">
                <div className="w-full flex justify-between">
                  <p>Total Items: <span className="font-medium">{totalOrders}</span></p>
                  <p>Subtotal: <span className="font-semibold">PHP {totalPrice.toLocaleString()}</span></p>
                </div>

                <div className="w-full flex justify-between">
                  <p className="text-muted-foreground">
                    Est. Shipping{shippingProvince ? ` (to ${shippingProvince})` : ""}:
                  </p>
                  <p className="font-medium">
                    {estimatedShipping != null ? `PHP ${estimatedShipping.toLocaleString()}` : "—"}
                  </p>
                </div>

                {/* Discount line */}
                {activeCoupon && !couponError && (couponDiscount > 0 || shippingDiscount > 0) && (
                  <div className="w-full flex justify-between">
                    <p className="text-green-700">
                      Discount{activeCoupon?.label ? ` — ${activeCoupon.label}` : ""}
                    </p>
                    <p className="font-medium text-green-700">
                      - PHP {(Number(couponDiscount || 0) + Number(shippingDiscount || 0)).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Show "Shipping After Coupon" ONLY for free shipping */}
                {shippingDiscount > 0 && (
                  <div className="w-full flex justify-between">
                    <p className="text-muted-foreground">Shipping After Coupon</p>
                    <p className="font-medium">
                      {estimatedShipping != null ? `PHP ${finalShipping.toLocaleString()}` : "—"}
                    </p>
                  </div>
                )}

                <div className="w-full flex justify-between border-t pt-1">
                  <p className="font-semibold">Estimated Total:</p>
                  <p className="font-semibold">PHP {finalTotal.toLocaleString()}</p>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  * Once the Payment is confirmed, the order cannot be cancelled.
                </p>
              </div>

              <Button
                type="button"
                className="mt-2 w-full bg-[#d6a58b] hover:bg-[#dbaf98] cursor-pointer"
                onClick={() => {
                  if (isCouponBlocking) {
                    toast.error("Coupon not applicable", {
                      description: `${couponError} Please adjust your cart to meet the condition.`,
                    });
                    return;
                  }
                  setProceeding(true);
                  const start = Date.now();

                  // open confirm dialog after 1s minimum
                  setTimeout(() => {
                    setShowConfirm(true);
                    setProceeding(false);
                  }, Math.max(0, 1000 - (Date.now() - start)));
                }}
                disabled={!selectedAddressId || proceeding || loadingPayment}
              >
                {proceeding ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                    Processing...
                  </div>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>


      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Confirm Purchase</h3>
            <p className="mb-2 text-sm text-gray-700">
              Once the payment is made, the order cannot be cancelled.
            </p>

            {/* Scrollable Terms */}
            <ScrollArea className="h-[12rem] border rounded bg-gray-50 p-3 mb-4">
              <div className="text-sm space-y-3 pr-2">
                <p>
                  By proceeding with payment, you agree to the{" "}
                  <span className="text-blue-600 font-medium">terms and policies</span> below:
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong>Cancellation Policy:</strong> Once payment is completed, orders cannot be cancelled. Please double-check product selections, quantities, and shipping information before confirming your purchase.
                  </li>
                  <li>
                    <strong>Product Issues:</strong> If you receive a missing, incorrect, damaged, or defective product, contact us within 7 days of delivery. We will review your case and may offer a replacement or store credit, per our Return Policy.
                  </li>
                  <li>
                    <strong>Returns & Exchanges:</strong>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>
                        Returns: If approved, you will receive store credit as a coupon equal to your order amount, usable on your next purchase.
                      </li>
                      <li>
                        Exchanges: If approved, we will send a replacement of the same item only.
                      </li>
                    </ul>
                  </li>
                  <li>All sales are final once payment is confirmed.</li>
                  <li>Shipping fees are non-refundable under any condition.</li>
                  <li>
                    You are responsible for providing correct delivery information. We are not liable for lost packages due to incorrect details.
                  </li>
                  <li>
                    Items are subject to stock availability and may change without prior notice.
                  </li>
                  <li>
                    Discounts and promotions cannot be applied after checkout is completed.
                  </li>
                  <li>
                    Shipping timelines may vary depending on your location and logistics partners.
                  </li>
                  <li>
                    You are responsible for any additional import duties or taxes, if applicable.
                  </li>
                </ul>
                <p>
                  Please scroll to the bottom and check the box to confirm you have read and accept these terms and policies.
                </p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-4">
                  <label className="flex items-start text-sm text-gray-800 font-medium gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 accent-green-600"
                      checked={isAgreeChecked}
                      onChange={(e) => setIsAgreeChecked(e.target.checked)}
                    />
                    <span>
                      I confirm I have read and agree to the <span className="text-blue-600">Terms &amp; Policies</span> above.
                    </span>
                  </label>
                </div>
              </div>
            </ScrollArea>
            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={!isAgreeChecked || loadingPayment || isCouponBlocking}
              >
                {loadingPayment ? "Processing…" : "Proceed"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
