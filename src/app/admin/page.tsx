"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, BookOpen, FileText, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalOrders: 0,
    revenueToday: 0,
    revenueMonth: 0,
    revenueTotal: 0,
  });

  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true });
    const { count: booksCount } = await supabase.from("books").select("*", { count: "exact", head: true });
    const { count: ordersCount } = await supabase.from("orders").select("*", { count: "exact", head: true });

    const { data: orders } = await supabase
      .from("orders")
      .select("total, created_at, status")
      .eq("status", "success");

    let revTotal = 0;
    let revToday = 0;
    let revMonth = 0;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const monthStr = todayStr.substring(0, 7);
    const revByDay: Record<string, number> = {};

    (orders || []).forEach((o) => {
      revTotal += o.total;
      const orderDate = new Date(o.created_at);
      const dateStr = orderDate.toISOString().split("T")[0];
      const orderMonth = dateStr.substring(0, 7);
      if (dateStr === todayStr) revToday += o.total;
      if (orderMonth === monthStr) revMonth += o.total;
      revByDay[dateStr] = (revByDay[dateStr] || 0) + o.total;
    });

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      chartData.push({
        date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        revenue: revByDay[ds] || 0,
      });
    }

    setStats({
      totalUsers: usersCount || 0,
      totalBooks: booksCount || 0,
      totalOrders: ordersCount || 0,
      revenueToday: revToday,
      revenueMonth: revMonth,
      revenueTotal: revTotal,
    });
    setRevenueData(chartData);
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);

  const formatYAxis = (val: number) => {
    if (val >= 1000000) return "Rp" + (val / 1000000).toFixed(1) + "jt";
    if (val >= 1000) return "Rp" + (val / 1000).toFixed(0) + "k";
    return "Rp" + val;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#2d1a08", margin: 0 }}>Dashboard Ringkasan</h1>
          <p style={{ color: "#6b5744", margin: "8px 0 0 0" }}>Statistik realtime aplikasi BacaKita</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
        <StatCard icon={<Users size={24} color="#3b82f6" />} label="Total User" value={stats.totalUsers} bg="#eff6ff" />
        <StatCard icon={<BookOpen size={24} color="#10b981" />} label="Total Buku" value={stats.totalBooks} bg="#f0fdf4" />
        <StatCard icon={<FileText size={24} color="#f59e0b" />} label="Total Transaksi" value={stats.totalOrders} bg="#fffbeb" />
        <StatCard icon={<TrendingUp size={24} color="#ef4444" />} label="Pendapatan Total" value={formatRupiah(stats.revenueTotal)} bg="#fef2f2" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Revenue Chart */}
        <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #ece5dd" }}>
          <h3 style={{ margin: "0 0 24px 0", color: "#2d1a08" }}>Pendapatan 7 Hari Terakhir</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece4" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9e8268", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9e8268", fontSize: 11 }}
                  dx={-4}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(value), "Pendapatan"]}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7A5230"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#7A5230", strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Highlights */}
        <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #ece5dd", display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ margin: 0, color: "#2d1a08" }}>Sorotan Keuangan</h3>

          <div style={{ padding: 20, background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
            <div style={{ color: "#166534", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Pendapatan Hari Ini</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#15803d" }}>{formatRupiah(stats.revenueToday)}</div>
          </div>

          <div style={{ padding: 20, background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe" }}>
            <div style={{ color: "#1e40af", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Pendapatan Bulan Ini</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1d4ed8" }}>{formatRupiah(stats.revenueMonth)}</div>
          </div>

          <div style={{ padding: 20, background: "#fef9ec", borderRadius: 12, border: "1px solid #fde68a" }}>
            <div style={{ color: "#92400e", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Total Pendapatan</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706" }}>{formatRupiah(stats.revenueTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #ece5dd", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ color: "#6b5744", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#2d1a08", fontSize: 22, fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}
