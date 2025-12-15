import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { Skeleton } from "@/components/ui/skeleton";

export const CancelledPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderRef = searchParams.get("ref");

  const [loading, setLoading] = useState(true);
  const [orderExists, setOrderExists] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!orderRef) return setLoading(false);

    const checkOrder = async () => {
      try {
        const res = await api.get(
          `${import.meta.env.VITE_SERVER_URL}/customer/orders/${orderRef}`,
          { withCredentials: true }
        );
        const status = res.data?.order?.payment_status?.toLowerCase();
        if (res.data?.success && (status === "cancelled" || status === "pending")) {
          setOrderExists(true);
          setIsPending(status === "pending");
        } else {
          setOrderExists(false);
        }
      } catch {
        setOrderExists(false);
      } finally {
        setLoading(false);
      }
    };

    checkOrder();
  }, [orderRef]);


  // 2s skeleton delay after loading
  useEffect(() => {
    if (loading) setShowSkeleton(true);
    else {
      const timer = setTimeout(() => setShowSkeleton(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!orderRef) {
    return <InvalidPage message="Missing order reference." />;
  }

  if (loading || showSkeleton) {
    return <CancelledSkeleton />;
  }

  if (!orderExists) {
    return <InvalidPage message="Invalid or non-existent order reference." />;
  }

  return (
    <main className="w-full h-auto p-4 flex justify-center items-center">
      <section className="mt-40 bg-[#fffcf2] shadow-lg p-6 flex flex-col gap-4 justify-center items-center w-full max-w-md rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold">
          {isPending ? "Cancelling Your Order..." : "Your Order has been Cancelled!"}
        </h2>
        <p className="text-center text-muted-foreground">
          {isPending
            ? "⏳ Your order cancellation is being processed. Please refresh this page in a few minutes."
            : "❌ We're sorry to inform you that your order was cancelled."}
        </p>
        <p className="text-sm text-center">
          <strong>Order Reference:</strong>
          <br />
          {orderRef}
        </p>
        <Button className="w-full" onClick={() => navigate("/Order-History")}>
          View Order Details
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </Button>
      </section>
    </main>
  );
};


const CancelledSkeleton = () => (
  <main className="w-full h-auto p-4 flex justify-center items-center">
    <section className="mt-40 bg-[#fffcf2] shadow-lg p-6 flex flex-col gap-4 justify-center items-center w-full max-w-md rounded-lg border border-gray-200">
      <Skeleton className="h-8 w-2/3 mb-2 bg-gray-300" />
      <Skeleton className="h-5 w-1/2 mb-2 bg-gray-200" />
      <Skeleton className="h-4 w-1/3 mb-3 bg-gray-100" />
      <Skeleton className="h-10 w-full mb-2 bg-gray-200" />
      <Skeleton className="h-10 w-full mb-2 bg-gray-100" />
    </section>
  </main>
);

const InvalidPage = ({ message }) => {
  const navigate = useNavigate();
  return (
    <main className="w-full h-auto p-4 flex justify-center items-center">
      <section className="mt-40 bg-red-50 shadow-lg p-6 flex flex-col gap-4 justify-center items-center w-full max-w-md rounded-lg border border-red-200">
        <h2 className="text-xl font-semibold text-red-600">❌ Invalid Order</h2>
        <p className="text-center text-gray-600">{message}</p>
        <p className="text-sm text-gray-500 text-center">
          This order does not exist or you do not have access to it.
        </p>
        <Button
          className="w-full"
          onClick={() => navigate("/Order-History")}
        >
          Go to Order History
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </section>
    </main>
  );
};