"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Download } from "lucide-react";

type Order = {
  id: string;
  user_id: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  users?: {
    nama: string;
    email: string;
  };
};

export default function AdminTransaksiPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);

    const { data: ordData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordData && ordData.length > 0) {
      const userIds = [...new Set(ordData.map((o) => o.user_id))];
      const { data: usrData } = await supabase
        .from("users")
        .select("id, nama, email")
        .in("id", userIds);

      const usrMap: Record<string, { nama: string; email: string }> = {};
      (usrData || []).forEach((u) => {
        usrMap[u.id] = { nama: u.nama, email: u.email };
      });

      setOrders(
        ordData.map((o) => ({ ...o, users: usrMap[o.user_id] })) as Order[]
      );
    } else {
      setOrders([]);
    }

    setLoading(false);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.users?.nama || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.users?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);

  const exportCSV = () => {
    const header = ["ID Transaksi", "Nama", "Email", "Total", "Metode Bayar", "Status", "Tanggal"];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.users?.nama || "-",
      o.users?.email || "-",
      o.total,
      o.payment_method || "-",
      o.status,
      new Date(o.created_at).toLocaleDateString("id-ID")
    ]);
    const csvContent = [header, ...rows].map((r) => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-transaksi-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#2d1a08", margin: 0 }}>Daftar Transaksi</h1>
          <p style={{ color: "#6b5744", margin: "8px 0 0 0" }}>Kelola semua transaksi pembelian dan langganan</p>
        </div>
      </div>

      <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #ece5dd" }}>
        <div style={{ marginBottom: 24, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
            <Search size={20} color="#9e8268" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Cari ID transaksi, nama, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: 12, border: "1px solid #ece5dd", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={exportCSV}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
              background: "#1a1108", color: "#e8cfb5", border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
            }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>Memuat transaksi...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ece5dd", textAlign: "left", color: "#6b5744", fontSize: 14 }}>
                <th style={{ padding: "16px 8px" }}>Order ID / Tanggal</th>
                <th style={{ padding: "16px 8px" }}>Pelanggan</th>
                <th style={{ padding: "16px 8px" }}>Total</th>
                <th style={{ padding: "16px 8px" }}>Metode</th>
                <th style={{ padding: "16px 8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f6f2ee" }}>
                  <td style={{ padding: "16px 8px" }}>
                    <div style={{ fontWeight: 600, color: "#2d1a08", fontSize: 13, fontFamily: "monospace" }}>
                      {order.id.substring(0, 8)}...
                    </div>
                    <div style={{ color: "#6b5744", fontSize: 12 }}>
                      {new Date(order.created_at).toLocaleString("id-ID")}
                    </div>
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    <div style={{ fontWeight: 500, color: "#2d1a08" }}>{order.users?.nama || "Unknown"}</div>
                    <div style={{ color: "#6b5744", fontSize: 13 }}>{order.users?.email || "-"}</div>
                  </td>
                  <td style={{ padding: "16px 8px", fontWeight: 600, color: "#2d1a08" }}>
                    {formatRupiah(order.total)}
                  </td>
                  <td style={{ padding: "16px 8px", color: "#6b5744" }}>
                    {order.payment_method || "-"}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    {order.status === "success" ? (
                      <span style={{ background: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: 8, fontSize: 12 }}>Berhasil</span>
                    ) : order.status === "failed" ? (
                      <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: 8, fontSize: 12 }}>Gagal</span>
                    ) : (
                      <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: 8, fontSize: 12 }}>Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>
                    Tidak ada transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
