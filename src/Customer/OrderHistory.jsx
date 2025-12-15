import React, { useEffect, useState, useContext } from "react";
import intro_bg from "../Images/intro-bg.png";
import api from "@/api/axios";
import { CustomerAuthContext } from "@/context/CustomerAuthContext";
import { toast } from "sonner";
import { compressImage } from "@/utils/compressImage";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { socket } from "@/lib/socket";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Skeleton } from "@/components/ui/skeleton";

import { SalesInvoice } from "@/components/SalesInvoice";
import { Clock, Truck, CheckCircle } from "lucide-react";

// Popover Calendar (across all devices)
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";

// shadcn Switch
import { Switch } from "@/components/ui/switch";

export const OrderHistory = () => {
  const { user, isAuthLoading } = useContext(CustomerAuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [exchangeRequestsByOrderId, setExchangeRequestsByOrderId] = useState({});

  const [markingReceived, setMarkingReceived] = useState(null);
  const [confirmMarkReceivedId, setConfirmMarkReceivedId] = useState(null); // For dialog


  // Mark order as received with confirmation
  const handleMarkAsReceived = async (orderId) => {
    setMarkingReceived(orderId);
    try {
      const res = await api.patch(`/customer/orders/${orderId}/mark-received`);

      if (res.data?.success) {
        toast.success("Order marked as received!");

        // Update local state immediately
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                ...o,
                order_status: "completed",
                delivered_at: new Date().toISOString(),
              }
              : o
          )
        );
      } else {
        toast.error(res.data?.message || "Failed to mark order as received.");
      }
    } catch (err) {
      console.error("Mark as received error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to mark order as received."
      );
    } finally {
      setMarkingReceived(null);
    }
  };



  function formatReturnId(id) {
    // Pad to 3 digits, e.g. 1 -> '001'; 12 -> '012'
    return `EXCH-${id.toString().padStart(3, "0")}`;
  }


  // --- Realtime: Join customer room & listen for order updates ---
  useEffect(() => {
    if (!user?.id || !socket) return;
    socket.emit("joinRoom", `customer_${user.id}`);

    const handleOrderStatusChanged = (event) => {
      console.log('Received orderStatusChanged:', event);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          String(order.id) === String(event.orderId)
            ? {
              ...order,
              ...event,
              order_status: event.order_status || event.status, // Fallback to event.status!
            }
            : order
        )
      );
      // toast.info(
      //   `Order ${event.orderId} status changed to ${event.status}${event.courier ? " (Courier: " + event.courier + ")" : ""}${event.delivered_at ? " (Delivered: " + new Date(event.delivered_at).toLocaleString() + ")" : ""}`
      // );
    };

    socket.on("orderStatusChanged", handleOrderStatusChanged);

    return () => {
      socket.off("orderStatusChanged", handleOrderStatusChanged);
    };
  }, [user]);

  const fetchExchangeRequestedOrderIds = async () => {
    try {
      const res = await api.get("/customer/exchange-return/exchange/my");
      const map = {};
      (res.data?.requests || []).forEach((r) => {
        map[r.order_id] = r;
      });
      setExchangeRequestsByOrderId(map);
    } catch (err) {
      console.error("Failed to fetch exchange/return requests:", err);
    }
  };
  // Initial load
  useEffect(() => {
    if (!user) return;
    fetchExchangeRequestedOrderIds();
  }, [user]);

  const imageBaseUrl = `${import.meta.env.VITE_SERVER_URL}/uploads/`;

  // Filters & Pagination
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterOrderProgress, setFilterOrderProgress] = useState("all");
  // Date filter with Popover calendar
  const [filterDateObj, setFilterDateObj] = useState(null);
  const filterDateStr = filterDateObj ? format(filterDateObj, "yyyy-MM-dd") : "";
  const filterDateLabel = filterDateObj ? format(filterDateObj, "PPP") : "Filter by Date";
  const [dateOpen, setDateOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user) return;
        const res = await api.get("/customer/orders/history");
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const php = (n) =>
    `₱${parseFloat(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const hasCoupon = (o) =>
    Number(o?.coupon_discount_amount || 0) > 0 ||
    Number(o?.coupon_shipping_discount || 0) > 0 ||
    !!o?.coupon_id;

  const combinedDiscount = (o) =>
    Number(o?.coupon_discount_amount || 0) +
    Number(o?.coupon_shipping_discount || 0);

  const filteredOrders = orders.filter((order) => {
    const paymentStatusMatch = filterPaymentStatus === "all" || !filterPaymentStatus
      ? true
      : String(order.payment_status || "").toLowerCase() === filterPaymentStatus;

    const orderProgressMatch = filterOrderProgress === "all" || !filterOrderProgress
      ? true
      : String(order.order_status || "").toLowerCase() === filterOrderProgress;



    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = `${d.getMonth() + 1}`.padStart(2, "0");
      const day = `${d.getDate()}`.padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const dateMatch = filterDateObj ? formatDate(order.created_at) === filterDateStr : true;
    return paymentStatusMatch && orderProgressMatch && dateMatch;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ---------- Reviews state ----------
  const [rating, setRating] = useState(0);
  const [displayName, setDisplayName] = useState("");
  // New: anonymous toggle - when true show "Anonymous", when false use name derived from email
  const [anonymous, setAnonymous] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [images, setImages] = useState([]); // data URLs for preview
  const [imageFiles, setImageFiles] = useState([]); // compressed File objects
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set()); // orders already reviewed
  const [reviewsByOrder, setReviewsByOrder] = useState({}); // { [orderId]: { ... } }

  // helper to derive name from email
  const deriveNameFromEmail = (email) => {
    if (!email) return "Customer";
    const local = String(email).split("@")[0] || "Customer";
    // replace dots/underscores/hyphens with space and title-case
    const words = local.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Customer";
  };

  // Prefetch which orders already have feedback + their details
  useEffect(() => {
    if (!user || orders.length === 0) return;
    (async () => {
      try {
        const res = await api.get("/customer/feedback/feedback/my");
        const ids = Array.isArray(res.data?.order_ids) ? res.data.order_ids : [];
        const idSet = new Set(ids);

        const detailPromises = ids.map((oid) =>
          api
            .get(`/customer/feedback/${oid}/feedback`)
            .then((r) => [oid, r.data?.feedback || null])
            .catch((err) => {
              console.error("Fetch feedback failed for order", oid, err);
              return [oid, null];
            })
        );
        const entries = await Promise.all(detailPromises);

        const map = {};
        entries.forEach(([oid, fb]) => {
          if (fb) map[oid] = fb;
        });

        setReviewedOrderIds(idSet);
        setReviewsByOrder(map);
      } catch (err) {
        console.error("Failed to fetch reviewed orders/details:", err);
      }
    })();
  }, [user, orders]);

  // ---------- Image upload (strict 1–3; reject overs) ----------
  const MAX_IMAGES = 3;

  const readAsDataURL = (blobOrFile) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blobOrFile);
    });

  const handleImageUpload = async (e) => {
    const input = e.target;
    // Only accept image files, extra check for safety
    const picked = Array.from(input.files || []).filter((f) =>
      (f.type || "").startsWith("image/")
    );

    // If user tries to upload anything that's not an image, block and show error
    if (picked.length === 0 && (input.files && input.files.length > 0)) {
      toast.error("Only image files are allowed (jpg, png, webp, etc.).");
      input.value = "";
      return;
    }

    const resetInput = () => {
      try {
        input.value = "";
      } catch (err) {
        console.error("Failed to reset file input:", err);
      }
    };

    if (picked.length === 0) {
      resetInput();
      return;
    }

    if (imageFiles.length >= MAX_IMAGES) {
      toast.error(`You already have ${MAX_IMAGES} images. Remove some, then upload again.`);
      resetInput();
      return;
    }

    if (picked.length > MAX_IMAGES) {
      toast.error(`You selected ${picked.length} images. Maximum is ${MAX_IMAGES}. Please upload again.`);
      resetInput();
      return;
    }

    if (imageFiles.length + picked.length > MAX_IMAGES) {
      toast.error(
        `Adding ${picked.length} exceeds the ${MAX_IMAGES}-image limit. Please upload again with fewer files.`
      );
      resetInput();
      return;
    }

    try {
      const opts = {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        fileType: "image/webp",
      };

      const compressed = await Promise.all(picked.map((f) => compressImage(f, opts)));
      const previews = await Promise.all(compressed.map((f) => readAsDataURL(f)));

      setImageFiles((prev) => [...prev, ...compressed]);
      setImages((prev) => [...prev, ...previews]);
    } catch (err) {
      console.error("Image compression/preview failed:", err);
      toast.error("Failed to process selected images. Please try again.");
    } finally {
      resetInput();
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------- Submit review (all fields required; 150 chars; images 1–3; lock after) ----------
  const handleSubmit = async () => {
    if (!selectedOrder?.id) {
      toast.error("No order selected.");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }
    if (!feedback.trim()) {
      toast.error("Feedback is required.");
      return;
    }
    if (feedback.length > 150) {
      toast.error("Feedback must be 150 characters or fewer.");
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please choose a star rating.");
      return;
    }
    if (imageFiles.length === 0) {
      toast.error("At least 1 image is required.");
      return;
    }
    if (imageFiles.length > 3) {
      toast.error("You can upload up to 3 images.");
      return;
    }
    if (reviewedOrderIds.has(selectedOrder.id)) {
      toast.error("You already submitted a review for this order.");
      return;
    }

    try {
      setSubmittingReview(true);
      const fd = new FormData();
      if (!anonymous) fd.append("display_name", displayName.trim());
      fd.append("is_anonymous", anonymous ? "1" : "0"); // <-- always send this!
      fd.append("rating", String(rating));
      fd.append("message", feedback.trim());
      imageFiles.forEach((f) => fd.append("images", f));


      const res = await api.post(
        `/customer/feedback/${selectedOrder.id}/feedback`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (!res.data?.success) throw new Error("Failed to submit feedback.");

      setReviewedOrderIds((prev) => {
        const next = new Set(prev);
        next.add(selectedOrder.id);
        return next;
      });
      setReviewsByOrder((prev) => ({
        ...prev,
        [selectedOrder.id]: {
          display_name: displayName.trim(),
          rating,
          message: feedback.trim(),
          image_urls: Array.isArray(res.data.image_urls) ? res.data.image_urls : [],
          created_at: res.data.created_at,
        },
      }));

      toast.success("Thank you for your feedback!");

      // Reset form and close dialog
      setRating(0);
      setDisplayName("");
      setAnonymous(false);
      setFeedback("");
      setImages([]);
      setImageFiles([]);
      setReviewDialogOpen(false);
    } catch (err) {
      console.error("Submit review failed:", err);
      toast.error(err?.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // ---------- Return as Coupon (exchange) ----------
  const MAX_IMAGE_COUNT = 2;
  const MAX_VIDEO_SIZE_MB = 30;
  const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
  const [submittingExchange, setSubmittingExchange] = useState(false);
  // Multi-product return state
  const [productReturns, setProductReturns] = useState([
    {
      productIdx: null,
      quantity: 1,
      reason: "",
      description: "",
      images: [],
      video: null,
    },
  ]);

  const getProductOptions = () => {
    if (!selectedOrder?.items) return [];
    // Exclude already selected products
    const selectedIdxs = productReturns.map(r => r.productIdx).filter(idx => idx !== null);
    return selectedOrder.items.map((item, idx) => ({
      label: item.sku?.replace(/-b\d+/gi, "") || `Product #${idx + 1}`,
      value: String(idx),
      maxQuantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      image: item.image_key ? `${imageBaseUrl}${item.image_key}` : "",
      disabled: selectedIdxs.includes(idx),
    }));
  };

  const getReturnTotalPrice = (prodReturn) => {
    if (
      prodReturn.productIdx === null ||
      !selectedOrder?.items ||
      !selectedOrder.items[prodReturn.productIdx]
    )
      return 0;
    const item = selectedOrder.items[prodReturn.productIdx];
    return Number(item.price || 0) * Number(prodReturn.quantity || 1);
  };

  const handleProductSelect = (returnIdx, productIdxStr) => {
    const idx = Number(productIdxStr);
    setProductReturns((prev) =>
      prev.map((r, i) =>
        i === returnIdx
          ? { ...r, productIdx: idx, quantity: 1 }
          : r
      )
    );
  };

  const handleReturnFieldChange = (returnIdx, field, value) => {
    setProductReturns((prev) =>
      prev.map((r, i) => (i === returnIdx ? { ...r, [field]: value } : r))
    );
  };

  const handleReturnImageUpload = async (returnIdx, e) => {
    // Only accept image files (no video, no doc, etc.)
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    // Extra: if any file is NOT an image, show error
    if (files.length === 0 && e.target.files.length > 0) {
      toast.error("Only image files are allowed (jpg, png, webp, etc.).");
      e.target.value = "";
      return;
    }
    if (files.length === 0) return;
    if (files.length > MAX_IMAGE_COUNT) {
      toast.error(`You can upload up to ${MAX_IMAGE_COUNT} images only.`);
      e.target.value = "";
      return;
    }
    const compressed = await Promise.all(
      files.slice(0, MAX_IMAGE_COUNT).map((f) => compressImage(f))
    );
    setProductReturns((prev) =>
      prev.map((r, i) => (i === returnIdx ? { ...r, images: compressed } : r))
    );
    e.target.value = "";
  };
  const handleReturnVideoUpload = (returnIdx, e) => {
    // Only accept video files (no image, no doc, etc.)
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("video/"));
    // Extra: if any file is NOT a video, show error
    if (files.length === 0 && e.target.files.length > 0) {
      toast.error("Only video files are allowed (MP4 or WEBM).");
      e.target.value = "";
      return;
    }
    if (files.length === 0) return;
    const file = files[0];
    if (!ALLOWED_VIDEO_TYPES.includes(file.type) || file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error("Invalid video. Only MP4/WEBM, <30MB allowed.");
      setProductReturns((prev) =>
        prev.map((r, i) => (i === returnIdx ? { ...r, video: null } : r))
      );
      e.target.value = "";
      return;
    }
    setProductReturns((prev) =>
      prev.map((r, i) => (i === returnIdx ? { ...r, video: file } : r))
    );
    e.target.value = "";
  };
  const removeReturnImage = (returnIdx, imgIdx) => {
    setProductReturns((prev) =>
      prev.map((r, i) =>
        i === returnIdx
          ? { ...r, images: r.images.filter((_, j) => j !== imgIdx) }
          : r
      )
    );
  };
  const removeReturnVideo = (returnIdx) => {
    setProductReturns((prev) =>
      prev.map((r, i) => (i === returnIdx ? { ...r, video: null } : r))
    );
  };
  const handleAddAnotherReturn = () => {
    setProductReturns((prev) => [
      ...prev,
      {
        productIdx: null,
        quantity: 1,
        reason: "",
        description: "",
        images: [],
        video: null,
      },
    ]);
  };
  const handleRemoveReturnRow = (returnIdx) => {
    setProductReturns((prev) => prev.filter((_, i) => i !== returnIdx));
  };

  const handleExchangeSubmit = async () => {
    if (!selectedOrder?.id) return toast.error("No order selected.");
    if (!isWithin7DaysOfDelivery(selectedOrder.delivered_at))
      return toast.error("Return Ticket as coupon only allowed within 7 days of delivery.");

    for (let i = 0; i < productReturns.length; i++) {
      const r = productReturns[i];
      if (r.productIdx === null)
        return toast.error(`Return Ticket #${i + 1}: Select a product.`);
      if (!r.reason)
        return toast.error(`Return Ticket #${i + 1}: Choose a reason.`);
      if (!r.description.trim())
        return toast.error(`Return Ticket #${i + 1}: Add a description.`);
      if (r.description.length > 200)
        return toast.error(`Return Ticket #${i + 1}: Description max 200 chars.`);
      if (r.images.length === 0)
        return toast.error(`Return Ticket #${i + 1}: At least one image required.`);
      if (r.images.length > MAX_IMAGE_COUNT)
        return toast.error(`Return Ticket #${i + 1}: Max 2 images.`);
      if (!r.video)
        return toast.error(`Return Ticket #${i + 1}: Video required.`);
      const prod = selectedOrder.items[r.productIdx];
      if (r.quantity < 1 || r.quantity > (prod?.quantity || 1))
        return toast.error(`Return Ticket #${i + 1}: Invalid quantity.`);
    }

    setSubmittingExchange(true);
    try {
      const payloadReturns = productReturns.map((r) => ({
        product_idx: r.productIdx,
        sku: selectedOrder.items[r.productIdx]?.sku,
        quantity: r.quantity,
        reason: r.reason,
        description: r.description.trim(),
        total_price: getReturnTotalPrice(r),
      }));

      const fd = new FormData();
      fd.append(
        "payload",
        JSON.stringify({
          type: "return",
          returns: payloadReturns,
          customer_id: user.id,
        })
      );

      productReturns.forEach((r, i) => {
        r.images.forEach((img) => fd.append(`return_${i}_images`, img));
        if (r.video) fd.append(`return_${i}_video`, r.video);
      });

      const res = await api.post(
        `/customer/exchange-return/${selectedOrder.id}/exchange`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (!res.data?.success) throw new Error("Failed to submit exchange request.");
      toast.success("Return Ticket as coupon request submitted.");
      await fetchExchangeRequestedOrderIds();
      setExchangeDialogOpen(false);
      setProductReturns([
        {
          productIdx: null,
          quantity: 1,
          reason: "",
          description: "",
          images: [],
          video: null,
        },
      ]);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to submit exchange request."
      );
    } finally {
      setSubmittingExchange(false);
    }
  };

  const isWithin7DaysOfDelivery = (deliveredAt) => {
    if (!deliveredAt) return false;
    const delivered = new Date(deliveredAt);
    const now = new Date();
    const diffDays = (now - delivered) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };


  // Skeleton delay: 2s after loading finishes
  useEffect(() => {
    if (loading) setShowSkeleton(true);
    else {
      const timer = setTimeout(() => setShowSkeleton(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // --- SKELETON UI ---
  if (isAuthLoading || loading || showSkeleton) {
    return (
      <main className="w-full h-auto flex flex-col">
        {/* Hero */}
        <div
          className="w-full h-[15rem] bg-cover bg-top flex items-center justify-center text-white rounded-2xl my-[1rem] bg-black/20 bg-blend-overlay bg-fixed pt-[5rem] pb-[5rem]"
          style={{ backgroundImage: `url(${intro_bg})` }}
        >
          <div className="text-center">
            <Skeleton className="h-9 w-1/3 mb-3 bg-gray-300 mx-auto" />
            <Skeleton className="h-4 w-2/3 mx-auto bg-gray-200" />
          </div>
        </div>
        {/* Filters */}
        <div className="w-[90%] mb-6 flex flex-col md:flex-row items-center justify-between gap-4 mx-auto">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full md:w-[30%] rounded bg-gray-200" />
          ))}
          <Skeleton className="h-10 w-full md:w-auto rounded bg-gray-100" />
        </div>
        {/* Orders */}
        <section className="w-full flex flex-col items-center gap-6 pb-16">
          {[...Array(1)].map((_, i) => (
            <div key={i} className="bg-white w-full sm:w-[90%] shadow-md rounded-xl p-6 flex flex-col gap-6 border border-gray-200">
              {/* Header Skeleton */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 border-b pb-4">
                <div className="space-y-1">
                  <Skeleton className="h-6 w-32 mb-1 bg-gray-200" />
                  <Skeleton className="h-4 w-24 mb-1 bg-gray-100" />
                  <Skeleton className="h-4 w-28 bg-gray-100" />
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <Skeleton className="h-4 w-24 bg-gray-100" />
                  <Skeleton className="h-6 w-16 bg-gray-200" />
                </div>
              </div>
              {/* Tracking Skeleton */}
              <Skeleton className="h-6 w-1/4 bg-gray-200" />
              <Skeleton className="h-4 w-full bg-gray-100" />
              {/* Items Skeleton */}
              <div className="flex flex-col gap-3">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-gray-50 p-3 rounded-lg border">
                    <Skeleton className="w-full sm:w-20 h-32 sm:h-20 bg-gray-200 rounded" />
                    <div className="flex-1 flex flex-col justify-between">
                      <Skeleton className="h-4 w-24 bg-gray-100 mb-1" />
                      <Skeleton className="h-4 w-16 bg-gray-100 mb-1" />
                      <Skeleton className="h-4 w-16 bg-gray-100 mb-1" />
                      <Skeleton className="h-4 w-20 bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Coupon Skeleton */}
              <Skeleton className="h-8 w-40 bg-gray-100 rounded" />
              {/* Totals Skeleton */}
              <div className="flex justify-between mt-2">
                <Skeleton className="h-4 w-24 bg-gray-200" />
                <Skeleton className="h-4 w-20 bg-gray-200" />
              </div>
              {/* Actions Skeleton */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                <Skeleton className="h-8 w-40 bg-gray-200 rounded" />
                <Skeleton className="h-8 w-32 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </section>
      </main>
    );
  }

  if (!user) {
    return <p className="text-center mt-10">Please log in to view your orders.</p>;
  }

  return (
    <main className="w-full h-auto flex flex-col">
      {/* Hero */}
      <div
        className="w-full h-[15rem] bg-cover bg-top flex items-center justify-center text-white rounded-2xl my-[1rem] bg-black/20 bg-blend-overlay bg-fixed pt-[5rem] pb-[5rem]"
        style={{ backgroundImage: `url(${intro_bg})` }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold capitalize">SPLND&apos;D - Order History</h1>
          <p className="max-w-[32rem] mt-4 mx-auto">
            Get a closer look at your past purchases. Browse your orders and track their status.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full md:w-[90%] mb-4 flex flex-col md:flex-row items-center justify-between gap-2 mx-auto">
        <div className="grid grid-cols-2 gap-2 w-full md:w-1/2">
          {/* Payment Status Filter */}
          <Select
            value={filterPaymentStatus}
            onValueChange={(val) => {
              setFilterPaymentStatus(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full bg-white text-xs md:text-sm">
              <SelectValue placeholder="Filter by Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Status</SelectItem> {/* Changed from value="" to value="all" */}
              <SelectItem value="pending">Pending Payment Status</SelectItem>
              <SelectItem value="paid">Paid Payment Status</SelectItem>
              <SelectItem value="cancelled">Cancelled Payment Status</SelectItem>
              <SelectItem value="failed">Failed Payment Status</SelectItem>
            </SelectContent>
          </Select>

          {/* Order Progress Filter */}
          <Select
            value={filterOrderProgress}
            onValueChange={(val) => {
              setFilterOrderProgress(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full bg-white text-xs md:text-sm">
              <SelectValue placeholder="Filter by Order Progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Order Status</SelectItem> {/* Changed from value="" to value="all" */}
              <SelectItem value="pending">Pending Order Status</SelectItem>
              <SelectItem value="shipped">Shipped Order Status</SelectItem>
              <SelectItem value="completed">Completed Order Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date filter: single Popover calendar (works on all devices) */}
        <div className="grid grid-cols-[2fr_1fr] md:grid-cols-2 gap-2 w-full md:w-1/2">
          <div className="w-full">
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white font-normal text-xs md:text-sm text-gray-500"
                >
                  {filterDateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filterDateObj}
                  onSelect={(d) => {
                    setFilterDateObj(d);
                    setCurrentPage(1);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
                <div className="flex items-center justify-between p-2 gap-2 text-xs md:text-sm">
                  <Button
                    variant="ghost"
                    className="w-1/2"
                    onClick={() => {
                      setFilterDateObj(null);
                      setCurrentPage(1);
                      setDateOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button className="w-1/2" onClick={() => setDateOpen(false)}>
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            className="w-full md:w-auto whitespace-nowrap text-xs md:text-sm"
            onClick={() => {
              setFilterPaymentStatus("all");
              setFilterOrderProgress("all");
              setFilterDateObj(null);
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Orders */}
      <section className="w-full flex flex-col items-center gap-6 pb-16">
        {paginatedOrders.length === 0 ? (
          <p className="text-center text-gray-500">No matching orders found.</p>
        ) : (
          paginatedOrders.map((order) => {
            const paymentStatus = (order.payment_status || "").toLowerCase();
            const orderStatus = (order.order_status || "").toLowerCase();
            const isPaid = paymentStatus === "paid";

            const showTracking =
              isPaid &&
              ["pending", "shipped", "completed"].includes(orderStatus) &&
              !["cancelled", "declined"].includes(orderStatus);

            const getProgressWidth = () => {
              switch (orderStatus) {
                case "pending":
                  return "33%";
                case "shipped":
                  return "66%";
                case "completed":
                  return "100%";
                default:
                  return "0%";
              }
            };

            const isStepDone = (i) => {
              if (i === 0) return ["pending", "shipped", "completed"].includes(orderStatus);
              if (i === 1) return ["shipped", "completed"].includes(orderStatus);
              if (i === 2) return orderStatus === "completed";
              return false;
            };

            const steps = [
              { label: "Pending", icon: Clock },
              { label: "Order Picked Up", icon: Truck },
              { label: "Order Delivered", icon: CheckCircle },
            ];

            const alreadyReviewed = reviewedOrderIds.has(order.id);
            const review = reviewsByOrder[order.id];
            const canExchange = isWithin7DaysOfDelivery(order.delivered_at);

            // --- Return Status Logic ---
            const exchangeReq = exchangeRequestsByOrderId[order.id];
            const alreadyRequestedExchange = !!exchangeReq;
            const exchangeStatus = exchangeReq?.status;
            const statusBadgeClass =
              exchangeStatus === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : exchangeStatus === "approved"
                  ? "bg-green-100 text-green-700"
                  : exchangeStatus === "declined"
                    ? "bg-red-100 text-red-700"
                    : "";

            return (
              <div
                key={order.id}
                className="bg-white w-full sm:w-[90%] shadow-md rounded-xl p-4 sm:p-6 flex flex-col gap-6 border border-gray-200"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b pb-4">
                  <div className="space-y-1">
                    <h2 className="font-semibold text-base sm:text-lg">
                      Order ID: {order.order_reference || "—"}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Payment reference: {order.payment_reference || "—"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Date Ordered: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex sm:flex-col sm:items-end gap-2">
                    {isPaid && (
                      <button
                        className="w-1/2 sm:w-full text-blue-600 bg-blue-100 sm:px-6 py-2 rounded-sm text-xs sm:text-sm font-medium cursor-pointer order-2 sm:order-1"
                        onClick={() => {
                          setSelectedOrder(order);
                          setTimeout(() => setInvoiceDialogOpen(true), 0);
                        }}
                      >
                        View Receipt
                      </button>
                    )}
                    <span
                      className={`w-1/2 bg-gray-100 sm:w-full text-center sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium order-1 sm:order-2 ${isPaid
                        ? " text-green-700"
                        : paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      <span className="font-normal">Payment Status:</span> {order.payment_status || "—"}
                    </span>

                  </div>
                </div>

                {/* Tracking */}
                {showTracking && (
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Order Progress
                    </p>
                    <div className="flex items-center justify-between mt-3 relative">
                      {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                          <div
                            key={i}
                            className="flex flex-col items-center z-10 flex-1"
                          >
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-all ${isStepDone(i)
                                ? "bg-[#f79c63] text-white"
                                : "bg-gray-300 text-gray-600"
                                }`}
                            >
                              <Icon size={16} className="sm:w-5 sm:h-5" />
                            </div>
                            <p
                              className={`mt-1 sm:mt-2 text-[10px] sm:text-xs text-center ${isStepDone(i) ? "text-[#f79c63]" : "text-gray-400"
                                }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                      <div className="absolute top-3 sm:top-4 left-0 w-full h-[2px] sm:h-[3px] bg-gray-200 z-0" />
                      <div
                        className="absolute top-3 sm:top-4 left-0 h-[2px] sm:h-[3px] bg-[#f79c63] transition-all z-0"
                        style={{ width: getProgressWidth() }}
                      />
                    </div>
                  </div>
                )}

                {/* Courier & Delivery Info */}
                {isPaid && (
                  <div className="flex flex-col sm:flex-row justify-between flex-wrap text-xs sm:text-sm border-y py-3 gap-2">
                    <div className="space-y-1">
                      <p>
                        <strong>Courier:</strong>{" "}
                        {order.courier || (
                          <span className="text-gray-500">
                            Waiting for the item to be shipped
                          </span>
                        )}
                      </p>

                      <p className="flex items-center gap-2">
                        <strong>Tracking:</strong>
                        {order.courier_reference ? (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(order.courier_reference);
                              toast.success("Tracking number copied!");
                            }}
                            className="font-mono px-2 py-1 text-[11px] sm:text-xs bg-gray-100 rounded hover:bg-gray-200 transition"
                          >
                            {order.courier_reference}
                          </button>
                        ) : (
                          <span className="text-gray-500">Waiting for the item to be shipped</span>
                        )}
                      </p>
                      {order.courier && order.courier_reference && (
                        <a
                          href={
                            order.courier.toLowerCase() === "ninjavan"
                              ? `https://www.ninjavan.co/en-ph/tracking?tracking_id=${order.courier_reference}`
                              : order.courier.toLowerCase().includes("jnt") ||
                                order.courier.toLowerCase().includes("j&t")
                                ? "https://www.jtexpress.ph/trajectoryQuery"
                                : null
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-xs sm:text-sm font-medium hover:underline"
                        >
                          Track Shipment
                        </a>
                      )}
                    </div>

                    {order.delivered_at && (
                      <div>
                        <p>
                          <strong>Delivered:</strong>{" "}
                          {new Date(order.delivered_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Items */}

                <ScrollArea className="h-[10rem] p-3">
                  <div className="flex flex-col gap-3"> {/* gap between items */}
                    {order.items?.map((item, i) => {
                      const qty = Number(item.quantity || 1);
                      const price = Number(item.price || 0);
                      const total = qty * price;
                      const imageUrl = item.image_key
                        ? `${imageBaseUrl}${item.image_key}`
                        : "";

                      return (
                        <div
                          key={i}
                          className="flex gap-2 sm:gap-3 bg-gray-50 p-3 rounded-lg border"
                        >
                          <img
                            src={imageUrl}
                            alt={item.sku}
                            className="w-20 object-contain h-20 rounded border"
                          />
                          <div className="text-xs sm:text-sm flex flex-col justify-center gap-2">
                            <p className="font-medium">
                              {item.sku?.replace(/-b\d+/gi, "")}
                            </p>
                            <div className="flex justify-between">
                              <p>Qty: {qty}</p>
                              <p>Unit: {php(price)}</p>
                            </div>

                            <p className="font-semibold">Total: {php(total)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {orderStatus === "shipped" && isPaid && (
                  <div className="flex flex-col gap-3 p-4 border-t">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setConfirmMarkReceivedId(order.id)}
                      disabled={markingReceived === order.id}
                    >
                      {markingReceived === order.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          Marking as Received...
                        </span>
                      ) : (
                        "Mark as Received"
                      )}
                    </button>
                    <p className="text-xs text-gray-600 text-center">
                      ✓ Click here when you've received your order
                    </p>
                  </div>
                )}

                {/* Alert Dialog for Confirmation */}
                <AlertDialog
                  open={confirmMarkReceivedId !== null}
                  onOpenChange={(open) => {
                    if (!open) setConfirmMarkReceivedId(null);
                  }}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Order Received</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you've received this order? This action will mark your order as completed and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          handleMarkAsReceived(confirmMarkReceivedId);
                          setConfirmMarkReceivedId(null);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Yes, Mark as Received
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
                {/* Coupon */}
                {hasCoupon(order) && (
                  <div className="mt-2 border rounded-lg px-3 py-2 bg-green-50 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-700">
                        {order.coupon_label || order.coupon_deal || "Coupon"}
                      </span>
                      {combinedDiscount(order) > 0 && (
                        <span className="font-medium text-green-700">
                          − {php(combinedDiscount(order))}
                        </span>
                      )}
                    </div>
                    {Number(order.coupon_shipping_discount || 0) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping Discount</span>
                        <span>− {php(order.coupon_shipping_discount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-between mt-2 text-xs sm:text-sm">
                  <span>Shipping: {php(order.shipping_fee)}</span>
                  <span className="font-semibold text-gray-800">
                    Total: {php(order.total_amount)}
                  </span>
                </div>

                {/* Review */}
                {review && (
                  <div className="mt-3 border rounded-lg px-3 py-2 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-semibold">
                        Your Review
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span
                            key={i}
                            className={
                              i <= Number(review.rating || 0)
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-gray-700">
                      <span className="font-medium">{review.display_name}</span>
                      {review.message && <> — {review.message}</>}
                    </p>
                    {Array.isArray(review.image_urls) &&
                      review.image_urls.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {review.image_urls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`review-${idx}`}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* Actions */}
                {orderStatus === "completed" && (
                  <div className="flex flex-col sm:flex-row justify-between gap-3 p-4 border-t">
                    <div className="flex flex-col items-center gap-2 p-2">
                      <div className="flex justify-center gap-4 p-2">
                        <button
                          className="text-blue-600 text-xs sm:text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!canExchange || alreadyRequestedExchange}
                          onClick={() => {
                            setSelectedOrder(order);
                            setExchangeDialogOpen(true);
                          }}
                        >
                          {alreadyRequestedExchange ? "Return Ticket as Coupon Submitted" : "Request Return Ticket as Coupon"}
                        </button>
                        {alreadyRequestedExchange && (
                          <span
                            className={`text-xs mt-1 ml-1 px-2 py-1 rounded text-center whitespace-pre-line ${statusBadgeClass}`}
                          >
                            {exchangeStatus === "pending"
                              ? `Status: Pending\nExchange Ref: ${formatReturnId(exchangeReq?.id ?? "?")}`
                              : exchangeStatus === "approved"
                                ? `Status: Approved\nExchange Ref: ${formatReturnId(exchangeReq?.id ?? "?")}`
                                : exchangeStatus === "declined"
                                  ? `Status: Declined\nExchange Ref: ${formatReturnId(exchangeReq?.id ?? "?")}`
                                  : `Status: Unknown\nExchange Ref: ${formatReturnId(exchangeReq?.id ?? "?")}`}
                          </span>
                        )}

                      </div>
                      {!canExchange && (
                        <span className="text-xs text-red-500 mt-2 sm:mt-0">
                          Return Ticket as coupon only allowed within 7 days of delivery.
                        </span>
                      )}
                      {/* {alreadyRequestedExchange && (
                        <span className="text-xs text-red-500 mt-2 sm:mt-0">
                          You already submitted a return as coupon request for this order.<br />
                          Request ID: <span className="font-mono">{exchangeReq?.id ?? "?"}</span>
                        </span>
                      )} */}
                    </div>
                    <button
                      className="text-blue-600 text-xs sm:text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isPaid || orderStatus !== "completed" || alreadyReviewed}
                      onClick={() => {
                        setRating(0);
                        // set displayName based on current anonymous toggle; default anonymous = false
                        // but if user toggled previously, respect it; otherwise derive
                        const initialAnon = anonymous;
                        setAnonymous(initialAnon);
                        setDisplayName(initialAnon ? "Anonymous" : deriveNameFromEmail(user?.email));
                        setFeedback("");
                        setImages([]);
                        setImageFiles([]);
                        setSelectedOrder(order);
                        setReviewDialogOpen(true);
                      }}
                    >
                      {alreadyReviewed ? "Review Submitted" : "Write A Review"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mb-10">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-[20rem] max-h-[90vh] overflow-y-scroll">
          {selectedOrder && selectedOrder.id ? (
            <SalesInvoice
              order={{
                invoice: String(selectedOrder.id).padStart(6, "0"),
                created_at: selectedOrder.created_at,
                customer: { contact: user?.email || "" },
                items: selectedOrder.items || [],
                totals: {
                  revenue:
                    parseFloat(selectedOrder.total_amount || 0) -
                    parseFloat(selectedOrder.shipping_fee || 0),
                  shipping: parseFloat(selectedOrder.shipping_fee || 0),
                },
                coupon: {
                  id: selectedOrder.coupon_id,
                  label: selectedOrder.coupon_label,
                  deal: selectedOrder.coupon_deal,
                  itemsDiscount: Number(selectedOrder.coupon_discount_amount || 0),
                  shippingDiscount: Number(selectedOrder.coupon_shipping_discount || 0),
                },
              }}
            />
          ) : (
            <p>Invoice data not available.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="w-[90%] max-w-md">
          <h2 className="text-lg font-semibold mb-4">Add Review</h2>

          {/* Star Rating (required) */}
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl transition ${star <= rating ? "text-yellow-400" : "text-gray-400"}`}
                type="button"
              >
                ★
              </button>
            ))}
          </div>

          {/* Anonymous toggle + derived display name (replaces input) */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm mb-1 block">Post as</Label>
              <div className="text-sm text-gray-700">
                <span className="font-medium">{anonymous ? "Anonymous" : deriveNameFromEmail(user?.email)}</span>
                <div className="text-xs text-gray-500">Toggle to post anonymously</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Anonymous</span>
              <Switch
                checked={anonymous}
                onCheckedChange={(val) => {
                  const next = Boolean(val);
                  setAnonymous(next);
                  setDisplayName(next ? "Anonymous" : deriveNameFromEmail(user?.email));
                }}
              />
            </div>
          </div>

          <ScrollArea className="h-[10rem] md:h-[15rem] p-3">
            {/* Feedback (required, max 150) */}
            <div className="mb-3">
              <label className="text-sm font-medium mb-1 block">
                Feedback <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Write your feedback here..."
                value={feedback}
                maxLength={150}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1">{feedback.length}/150</div>
            </div>

            {/* Image Upload + Previews (1–3) */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1">Images (1–3)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={imageFiles.length >= 3}
              />
              {images.length > 0 && (
                <div className="flex gap-4 mt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`preview-${idx}`} className="w-20 h-20 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex flex-col gap-2 ">
            {/* Submit */}
            <Button
              className="w-full bg-[#d9a27e] hover:bg-[#c28861] text-white"
              onClick={handleSubmit}
              disabled={
                submittingReview ||
                (selectedOrder && reviewedOrderIds.has(selectedOrder.id)) ||
                images.length === 0
              }
            >
              {submittingReview ? "Submitting..." : "Submit Feedback"}
            </Button>

            <Button
              className="w-full  hover:bg-gray-300 text-gray-700"
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              type="button"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exchange Dialog (Return as Coupon) */}
      <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
        <DialogContent className="w-[25rem] flex flex-col ">
          <h2 className="text-lg font-semibold mb-4">Return Ticket as Coupon</h2>
          <ScrollArea className="h-[40vh] w-[20rem] mb-4">
            <div className="space-y-8 flex flex-col w-[20rem] p-3 ">
              {productReturns.map((prodReturn, idx) => {
                const productOptions = getProductOptions();
                const selectedProduct =
                  prodReturn.productIdx !== null ? productOptions[prodReturn.productIdx] : null;
                return (
                  <div key={idx} className="border p-3 rounded-lg bg-gray-50 flex flex-col  w-[100%] ">
                    <div className="mb-2 flex flex-col">
                      <Label className="text-sm">Product to Return</Label>
                      <Select
                        value={prodReturn.productIdx !== null ? String(prodReturn.productIdx) : ""}
                        onValueChange={(val) => handleProductSelect(idx, val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="w-[20rem] h-[15rem]">
                          {productOptions.map((opt, i) => (
                            <SelectItem key={i} value={String(i)} disabled={opt.disabled && (prodReturn.productIdx !== i)}>
                              <div className="flex items-center gap-2">
                                {opt.image && (
                                  <img
                                    src={opt.image}
                                    alt={opt.label}
                                    className="w-10 h-8 object-cover rounded border"
                                  />
                                )}
                                <span>{opt.label}</span>
                                <span className="ml-2 text-xs text-gray-400">
                                  (Max Qty: {opt.maxQuantity})
                                </span>
                                <span className="ml-2 text-xs text-gray-600">
                                  Unit Price: ₱{opt.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedProduct && (
                      <div className="mb-2">
                        <Label className="text-sm">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          max={selectedProduct.maxQuantity}
                          value={prodReturn.quantity}
                          onChange={(e) =>
                            handleReturnFieldChange(
                              idx,
                              "quantity",
                              Math.max(
                                1,
                                Math.min(selectedProduct.maxQuantity, Number(e.target.value) || 1)
                              )
                            )
                          }
                          className="w-full"
                        />
                        {/* Total Price display */}
                        <div className="text-xs mt-1 text-gray-700 font-semibold">
                          Total Price: ₱{getReturnTotalPrice(prodReturn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}
                    <div className="mb-2">
                      <Label className="text-sm">Reason</Label>
                      <Select
                        value={prodReturn.reason}
                        onValueChange={(val) => handleReturnFieldChange(idx, "reason", val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wrong-item">Wrong Item Delivered</SelectItem>
                          <SelectItem value="damaged">Damaged Product</SelectItem>
                          <SelectItem value="other">Missing Item</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mb-2">
                      <Label className="text-sm">Description</Label>
                      <Textarea
                        value={prodReturn.description}
                        onChange={(e) =>
                          handleReturnFieldChange(
                            idx,
                            "description",
                            e.target.value.slice(0, 200)
                          )
                        }
                        maxLength={200}
                        placeholder="Add more details here (max 200 characters)..."
                      />
                      <div className="text-xs text-gray-400 text-right">
                        {prodReturn.description.length}/200
                      </div>
                    </div>
                    <div className="mb-2">
                      <Label className="text-sm mb-1 block">
                        Images (max 2, required)
                      </Label>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleReturnImageUpload(idx, e)}
                        className="mb-2"
                      />
                      <div className="flex gap-3 mb-2">
                        {prodReturn.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative">
                            <img
                              src={URL.createObjectURL(img)}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              className="absolute top-0 right-0 text-xs text-red-600 bg-white rounded-full"
                              onClick={() => removeReturnImage(idx, imgIdx)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <Label className="text-sm mb-1 block">
                        Video (max 1, required; &lt;30MB)
                      </Label>
                      <Input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => handleReturnVideoUpload(idx, e)}
                        className="mb-2"
                      />
                      {prodReturn.video && (
                        <div className="relative mb-2">
                          <video
                            src={URL.createObjectURL(prodReturn.video)}
                            controls
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            className="absolute top-0 right-0 text-xs text-red-600 bg-white rounded-full"
                            onClick={() => removeReturnVideo(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                    {productReturns.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleRemoveReturnRow(idx)}
                      >
                        Remove This Return
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddAnotherReturn}
                disabled={
                  productReturns.length >= (selectedOrder?.items?.length || 1) ||
                  getProductOptions().filter(opt => !opt.disabled).length === 0
                }
              >
                Select Another Return
              </Button>
            </div>
          </ScrollArea>
          <div className="flex justify-between mt-6">
            <Button
              onClick={handleExchangeSubmit}
              className="bg-[#d9a27e] hover:bg-[#c28861] text-white"
              disabled={submittingExchange || !isWithin7DaysOfDelivery(selectedOrder?.delivered_at)}
            >
              {submittingExchange ? "Submitting..." : "Submit"}
            </Button>
            <Button variant="ghost" onClick={() => setExchangeDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};