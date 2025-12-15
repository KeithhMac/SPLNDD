import React from "react";
import {
    AreaChart, Area, CartesianGrid, XAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import api from "../api/axios.js";

const chartConfig = {
    revenue: { label: "Revenue", color: "#A7F3D0" },
    netSales: { label: "Net Sales", color: "#22C55E" },
    profit: { label: "Profit", color: "#166534" },
};

function generateSampleData(days = 365) {
    const arr = [];
    for (let i = days; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().substring(0, 10);
        const profit = Math.floor(Math.random() * 6500) + 200;
        const netSales = profit + Math.floor(Math.random() * 7000) + 500;
        const revenue = netSales + Math.floor(Math.random() * 6500) + 500;
        arr.push({
            date: dateStr,
            revenue,
            netSales,
            profit,
        });
    }
    return arr;
}

export function ChartAreaInteractive() {
    const [timeRange, setTimeRange] = React.useState("90d");
    const [chartData, setChartData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchSalesOverview = async () => {
            try {
                const res = await api.get("customer/orders/admin/sales/overview");
                let formatted = [];
                if (res.data.success) {
                    formatted = res.data.data.map((row) => {
                        // Normalize to YYYY-MM-DD
                        const dateOnly = new Date(row.date).toISOString().substring(0, 10);
                        return {
                            date: dateOnly,
                            revenue: Number(row.revenue) || 0,
                            netSales: Number(row.net_sales) || 0,
                            profit: Number(row.profit) || 0,
                        };
                    });
                }
                // Merge with sample data (365 days to support 1 year range)
                const merged = [...generateSampleData(365), ...formatted];
                // Deduplicate: keep only one row per date, API data takes precedence
                const uniqueByDate = {};
                for (const row of merged) {
                    uniqueByDate[row.date] = row;
                }
                const deduped = Object.values(uniqueByDate).sort((a, b) => new Date(a.date) - new Date(b.date));
                setChartData(deduped);
            } catch (err) {
                console.error("❌ Failed to fetch sales overview:", err.message);
                setChartData(generateSampleData(365));
            } finally {
                setLoading(false);
            }
        };

        fetchSalesOverview();
    }, []);

    const filteredData = React.useMemo(() => {
        if (chartData.length === 0) return [];
        const ref = new Date();
        let days = 90;
        if (timeRange === "7d") days = 7;
        else if (timeRange === "30d") days = 30;
        else if (timeRange === "180d") days = 180;
        else if (timeRange === "365d") days = 365;
        const start = new Date(ref);
        start.setDate(start.getDate() - days);
        const filtered = chartData.filter((d) => new Date(d.date) >= start);

        // Ensure today is included
        const todayStr = new Date().toISOString().substring(0, 10);
        if (!filtered.some(d => d.date === todayStr)) {
            filtered.push({
                date: todayStr,
                revenue: 0,
                netSales: 0,
                profit: 0
            });
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        return filtered;
    }, [chartData, timeRange]);

    const peso = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    });

    const labelFormatter = (value) =>
        new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const orderIndex = { revenue: 1, netSales: 2, profit: 3 };
    const displayName = { revenue: "Revenue", netSales: "Net Sales", profit: "Profit" };

    if (loading) {
        return (
            <Card className="pt-0">
                <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Loading data...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="pt-0">
            <CardHeader className="flex flex-col items-center gap-5 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>
                        Revenue, Net Sales & Profit for the selected range
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[160px] rounded-lg ml-auto flex" aria-label="Select a value">
                        <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">


                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 3 months</SelectItem>
                        <SelectItem value="180d">Last 6 months</SelectItem>
                        <SelectItem value="365d">Last 1 year</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>

            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredData}>
                            <defs>
                                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#A7F3D0" stopOpacity={0.85} />
                                    <stop offset="95%" stopColor="#A7F3D0" stopOpacity={0.12} />
                                </linearGradient>
                                <linearGradient id="fillNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.85} />
                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.12} />
                                </linearGradient>
                                <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#166534" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#166534" stopOpacity={0.06} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid vertical={false} />

                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(v) =>
                                    new Date(v).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })
                                }
                            />

                            <Tooltip
                                cursor={false}
                                labelFormatter={labelFormatter}
                                itemSorter={(item) => orderIndex[item.dataKey] || 99}
                                formatter={(val, _name, { dataKey }) => {
                                    const colorMap = {
                                        revenue: "#4ADE80",
                                        netSales: "#22C55E",
                                        profit: "#166534",
                                    };

                                    return [
                                        <>
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: 10,
                                                    height: 10,
                                                    backgroundColor: colorMap[dataKey],
                                                    marginRight: 8,
                                                    borderRadius: 2,
                                                }}
                                            />
                                            <span style={{ color: "#000" }}>{peso.format(val)}</span>
                                        </>,
                                        displayName[dataKey] || dataKey,
                                    ];
                                }}
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderColor: "#d1d5db",
                                    borderRadius: 8,
                                    fontSize: "0.875rem",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                }}
                                itemStyle={{
                                    color: "#000000",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                                labelStyle={{
                                    color: "#000000",
                                    fontWeight: 600,
                                    marginBottom: 4,
                                }}
                            />

                            <Area
                                dataKey="revenue"
                                name={chartConfig.revenue.label}
                                type="monotone"
                                fill="url(#fillRevenue)"
                                stroke={chartConfig.revenue.color}
                                strokeWidth={2}
                            />
                            <Area
                                dataKey="netSales"
                                name={chartConfig.netSales.label}
                                type="monotone"
                                fill="url(#fillNet)"
                                stroke={chartConfig.netSales.color}
                                strokeWidth={2}
                            />
                            <Area
                                dataKey="profit"
                                name={chartConfig.profit.label}
                                type="monotone"
                                fill="url(#fillProfit)"
                                stroke={chartConfig.profit.color}
                                strokeWidth={2}
                            />

                            <Legend
                                iconType="plainline"
                                formatter={(value, entry) => {
                                    const colorMap = {
                                        revenue: "#4ADE80",
                                        netSales: "#22C55E",
                                        profit: "#166534",
                                    };
                                    return (
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                color: "#000",
                                                fontWeight: 500,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    backgroundColor: colorMap[entry.dataKey],
                                                    display: "inline-block",
                                                    marginRight: 8,
                                                    borderRadius: 2,
                                                }}
                                            />
                                            {chartConfig[entry.dataKey]?.label || value}
                                        </span>
                                    );
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}