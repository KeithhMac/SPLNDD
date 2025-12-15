import React, { useEffect, useState, useContext } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton"; // Add this import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PH_LOCATIONS } from "@/utils/PH_LOCATIONS";
import { toast } from "sonner";
import api from "@/api/axios";
import { CustomerAuthContext } from "@/context/CustomerAuthContext.jsx";
import { Loader2, Trash2 } from "lucide-react";
import intro_bg from "../Images/intro-bg.png";
import { useNavigate } from "react-router-dom";

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

export const SaveAddress = () => {
  const { user, isAuthLoading } = useContext(CustomerAuthContext);
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Add this state for initial loading

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [editingAddressId, setEditingAddressId] = useState("");

  // form
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");

  // loading states
  const [loading, setLoading] = useState(false); // for save/update
  const [deletingId, setDeletingId] = useState(""); // for delete buttons

  const cities = province ? Object.keys(PH_LOCATIONS[province]) : [];
  const districts = province && city ? PH_LOCATIONS[province][city] : [];

  useEffect(() => {
    if (!user || isAuthLoading) return;
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        setInitialLoading(true);

        const res = await api.get(
          `${import.meta.env.VITE_SERVER_URL}/customer/personal-info/addresses`,
          { withCredentials: true }
        );

        // Add 2 second delay as requested
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setAddresses(res.data.addresses || []);
      } catch {
        toast.error("Failed to load your addresses.");
      } finally {
        setLoadingAddresses(false);
        setInitialLoading(false);
      }
    };
    fetchAddresses();
  }, [user, isAuthLoading]);

  const clearAddressForm = () => {
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
    if (!user) return toast.error("You must be logged in.");
    if (!name || !contact || !province || !city || !district || !address) {
      return toast.error("All fields are required.");
    }
    if (!/^09\d{9}$/.test(contact)) {
      return toast.error("Invalid contact number. Format: 09XXXXXXXXX");
    }

    const payload = { name, contact, province, city, district, address };

    setLoading(true);
    try {
      let saved = null;
      if (editingAddressId) {
        const res = await api.patch(
          `${import.meta.env.VITE_SERVER_URL
          }/customer/personal-info/addresses/${editingAddressId}`,
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

      // ensure at least 1 second delay for smoothness
      await new Promise((resolve) => setTimeout(resolve, 1000));

      clearAddressForm();
    } catch {
      toast.error("Failed to save address.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(
        `${import.meta.env.VITE_SERVER_URL
        }/customer/personal-info/addresses/${id}`,
        { withCredentials: true }
      );
      setAddresses((prev) => prev.filter((a) => String(a.id) !== String(id)));
      if (String(selectedAddressId) === String(id)) setSelectedAddressId("");
      toast.success("Address deleted.");

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch {
      toast.error("Failed to delete address.");
    } finally {
      setDeletingId("");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await api.delete(
        `${import.meta.env.VITE_SERVER_URL}/customer/delete-account`,
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success("Your account has been deleted.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        toast.error(res.data?.message || "Failed to delete account.");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      toast.error("Failed to delete account. Please try again.");
    } finally {

      localStorage.removeItem("customer_token");
      sessionStorage.clear();

      document.cookie = "customer_acc=; Path=/; Max-Age=0; SameSite=None; Secure";

      navigate(0); // or window.location.reload();
    }
  };

  // Skeleton component for the address form
  const AddressFormSkeleton = () => (
    <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
      <Skeleton className="h-6 w-48 mb-6" />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-36 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-44 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div>
          <Skeleton className="h-4 w-56 mb-2" />
          <Skeleton className="h-24 w-full" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );

  // Skeleton component for the address list
  const AddressListSkeleton = () => (
    <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
      <Skeleton className="h-6 w-36 mb-6" />

      <ScrollArea className="h-[20rem] pr-1">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  if (isAuthLoading) {
    return (
      <main className="w-full flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="w-full flex justify-center items-center min-h-screen">
        <p className="text-sm text-muted-foreground">
          Please sign in to manage your saved addresses.
        </p>
      </main>
    );
  }

  return (
    <main className="w-full flex flex-col items-center min-h-screen mb-10">
      {/* Hero */}
      <div
        className="w-full h-[12rem] bg-cover bg-center flex items-center justify-center text-white rounded-lg my-6 bg-black/40 bg-blend-overlay"
        style={{ backgroundImage: `url(${intro_bg})` }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">Personal Information</h1>
          <p className="text-sm opacity-90 max-w-md mt-4">
            Manage your personal details, add multiple delivery addresses for
            faster checkout, and delete your account as needed.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-6xl flex flex-col gap-6 p-4">
        <div className="w-full text-xl">Saved Addresses</div>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Address Form - Show skeleton during loading */}
          {initialLoading ? (
            <AddressFormSkeleton />
          ) : (
            <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                {editingAddressId ? "Edit Address" : "Add New Address"}
              </h2>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Juan Dela Cruz"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. 09171234567"
                      value={contact}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^0?$|^09\d{0,9}$/.test(val)) setContact(val);
                      }}
                      inputMode="numeric"
                      maxLength={11}
                    />
                  </div>
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
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
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {Object.keys(PH_LOCATIONS).map((prov) => (
                        <SelectItem key={prov} value={prov}>
                          {prov}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City / Municipality <span className="text-red-500">*</span>
                    </label>
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
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {cities.map((ct) => (
                          <SelectItem key={ct} value={ct}>
                            {ct}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District / Barangay <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={district}
                      onValueChange={setDistrict}
                      disabled={!city}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {districts.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Street / Building */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street / Building / Details{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="House No., Street, Subdivision, Building, etc."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  {editingAddressId && (
                    <Button
                      variant="outline"
                      onClick={clearAddressForm}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={saveAddress}
                    disabled={loading}
                    className={"bg-[#D5A58B] hover:bg-[#e0b9a4] cursor-pointer"}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4 text-white" />
                        Saving...
                      </div>
                    ) : editingAddressId ? (
                      "Update Address"
                    ) : (
                      "+ Add Address"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Address List - Show skeleton during loading */}
          {initialLoading ? (
            <AddressListSkeleton />
          ) : (
            <div className="flex-1 border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Your Addresses</h2>

              <ScrollArea className="h-[20rem] pr-1">
                {loadingAddresses ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-4 bg-gray-50">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    No saved addresses yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((a) => (
                      <div
                        key={a.id}
                        className="group border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition flex justify-between items-start"
                      >
                        {/* Address Info */}
                        <button
                          className="text-left flex-1"
                          onClick={() => startEditingAddress(a)}
                          disabled={loading || deletingId === a.id}
                        >
                          <p className="font-medium text-sm text-gray-900">
                            {a.name}{" "}
                            <span className="text-gray-500">— {a.contact}</span>
                          </p>
                          <p className="text-sm text-gray-700 mt-1 leading-snug">
                            {a.address}, {a.district}, {a.city}, {a.province}
                          </p>
                        </button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-70 hover:opacity-100 ml-2"
                          onClick={() => deleteAddress(a.id)}
                          disabled={deletingId === a.id || loading}
                        >
                          {deletingId === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Account Section */}
        <div className="flex flex-col gap-2 w-full text-xl mt-5">
          My Account{" "}
        </div>

        {initialLoading ? (
          <div className="p-4 rounded-lg bg-white border shadow-sm grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-6">
            <div>
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-white border shadow-sm grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-6 ">
            <div>
              <span className="text-base font-semibold">
                Your personal information is safe with us.{" "}
              </span>
              <br />
              <span className="text-sm lg:text-base">
                If you wish to delete your account, all your data, including saved
                addresses and purchase history, will be removed.
              </span>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="w-full flex-1 flex items-center justify-center gap-2 h-10 md:w-sm border border-red-400 rounded-lg lg:px-4 py-2 bg-white hover:bg-red-100/50 cursor-pointer shadow-sm text-red-700"
                >
                  <Trash2 />
                  Delete My Account
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently deactivate your account and remove all your data, including
                    saved addresses and purchase history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </main>
  );
};