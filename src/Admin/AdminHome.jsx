import React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,

} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ChartAreaInteractive } from "@/components/ChartAreaInteractive";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "../api/axios.js"
import { TrendingUp, ShoppingBag, CreditCard, PiggyBank } from "lucide-react";

// ✅ Lucide icons
import { Clock, Truck, CheckCircle, XCircle, RotateCcw, Repeat } from "lucide-react";

// ✅ Lucide icon
import { TrendingDown } from "lucide-react";

export const AdminHome = () => {


  // 📊 Sales stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ✅ Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("customer/orders/admin/sales/stats");
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch stats:", err.message);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const peso = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });


  const [orderStatus, setOrderStatus] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);


  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const res = await api.get("customer/orders/admin/status");
        if (res.data.success) {
          setOrderStatus(res.data.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch order status:", err.message);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchOrderStatus();
  }, []);

  // ✅ Default statuses (always show)
  const defaultStatuses = [
    { status: "pending", label: "Pending", icon: <Clock className="h-5 w-5 text-yellow-600 mb-1" /> },
    { status: "shipped", label: "Shipped", icon: <Truck className="h-5 w-5 text-blue-600 mb-1" /> },
    { status: "completed", label: "Completed", icon: <CheckCircle className="h-5 w-5 text-green-600 mb-1" /> },
    { status: "cancelled", label: "Cancelled", icon: <XCircle className="h-5 w-5 text-red-600 mb-1" /> },
    { status: "failed", label: "Failed", icon: <XCircle className="h-5 w-5 text-red-600 mb-1" /> },
    { status: "return", label: "Returned", icon: <RotateCcw className="h-5 w-5 text-orange-600 mb-1" /> },

  ];

  // ✅ Merge DB data with defaults (fallback 0 if missing)
  const mergedStatuses = defaultStatuses.map((item) => {
    const found = orderStatus.find((os) => os.status.toLowerCase() === item.status);
    return {
      ...item,
      total: found ? found.total_orders : 0,
    };
  });


  const [lowStockItems, setLowStockItems] = useState([]);
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await api.get("customer/orders/admin/low-stock");
        if (res.data.success) {
          setLowStockItems(res.data.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch low stock items:", err.message);
      } finally {
        setLoadingLowStock(false);
      }
    };

    fetchLowStock();
  }, []);

  const filteredProducts = [...lowStockItems]
    .filter((item) => {
      const category = item.sku.includes("-men-")
        ? "men"
        : item.sku.includes("-women-")
          ? "women"
          : "unknown";
      return filter === "all" || category === filter;
    })
    .sort((a, b) => {
      // Sort by severity level: Critical > High > Medium > Low
      const severityOrder = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      if (severityOrder[b.severity_level] !== severityOrder[a.severity_level]) {
        return severityOrder[b.severity_level] - severityOrder[a.severity_level];
      }

      // If severity levels are the same, sort by stock (ascending)
      return a.stock - b.stock;
    });
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
      </div>

      <div className="w-full flex flex-col lg:flex-row h-auto gap-2">
        {/* Revenue */}
        <Card className="w-full h-[20rem] lg:h-[15rem] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Overall Revenue</CardTitle>
            <TrendingUp className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            <span className="text-3xl font-bold text-green-700">
              {loadingStats ? "Loading..." : peso.format(stats?.total_revenue || 0)}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              Gross sales from all paid orders
            </span>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="w-full h-[20rem] lg:h-[15rem] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Overall Orders</CardTitle>
            <ShoppingBag className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            <span className="text-3xl font-bold text-green-700">
              {loadingStats ? "Loading..." : stats?.total_orders || 0}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              Number of completed transactions
            </span>
          </CardContent>
        </Card>

        {/* AOV */}
        <Card className="w-full h-[20rem] lg:h-[15rem] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Average Order Value</CardTitle>
            <CreditCard className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            <span className="text-3xl font-bold text-green-700">
              {loadingStats ? "Loading..." : peso.format(stats?.avg_order_value || 0)}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              Avg. customer spend per order
            </span>
          </CardContent>
        </Card>

        {/* Profit */}
        <Card className="w-full h-[20rem] lg:h-[15rem] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Overall Profit</CardTitle>
            <PiggyBank className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1">
            <span className="text-3xl font-bold text-green-700">
              {loadingStats ? "Loading..." : peso.format(stats?.total_profit || 0)}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              Earnings after costs and discounts
            </span>
          </CardContent>
        </Card>
      </div>


      <div>
        <ChartAreaInteractive />
      </div>

      <div className="w-full flex flex-col lg:flex-row h-auto gap-2 " >
        <Card className="lg:w-[40%] h-auto">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStatus ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-5 justify-items-center">
                {mergedStatuses.map((item) => (
                  <div
                    key={item.status}
                    className="h-[6rem] w-[7rem] bg-white rounded-md border border-gray-200 flex flex-col justify-center items-center shadow-sm"
                  >
                    {item.icon}
                    <span className="text-lg font-bold text-gray-800">{item.total}</span>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full h-[30rem] lg:h-[30rem]">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Product Stock Status</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>

          <CardContent className="h-full p-0">
            <ScrollArea className="h-[20rem] overflow-hidden p-3">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-[#E1E7E4]">
                      <th className="px-4 py-3 text-left">SKU</th>

                      <th className="px-4 py-3 text-right">Stock</th>
                      {/* <th className="px-4 py-3 text-right">Category</th> */}
                      <th className="px-4 py-3 text-right">30d Revenue</th>
                      <th className="px-4 py-3 text-right">Severity</th>
                      <th className="px-4 py-3 text-right">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLowStock ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">Loading...</td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">No products found</td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const severityColor =
                          product.severity_level === "critical"
                            ? "text-red-600"
                            : product.severity_level === "high"
                              ? "text-orange-500"
                              : product.severity_level === "medium"
                                ? "text-yellow-500"
                                : "text-gray-400";

                        // const category = product.sku.includes("-men-")
                        //   ? "Men"
                        //   : product.sku.includes("-women-")
                        //     ? "Women"
                        //     : "Unknown";

                        return (
                          <tr key={product.sku} className="border-b">
                            <td className="px-4 py-4 text-sm">{product.sku}</td>

                            <td className="px-4 py-4 text-sm text-right">{product.stock}</td>
                            {/* <td className="px-4 py-4 text-sm text-right capitalize">{category}</td> */}
                            <td className="px-4 py-4 text-sm text-right">
                              {parseFloat(product.revenue_last_30d).toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              })}
                            </td>
                            <td className={`px-4 py-4 text-sm text-right font-semibold ${severityColor}`}>
                              {product.severity_level.charAt(0).toUpperCase() + product.severity_level.slice(1)}
                            </td>
                            <td className="px-4 py-4 text-sm text-right">{product.recommendation}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>


    </div >
  );
};
