"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { History as HistoryIcon, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "../dashboard.module.css";

type OrderItem = {
  book_id: string;
  price: number;
};

type Order = {
  id: string;
  total: number;
  payment_method: string;
  status: "success" | "pending" | "failed";
  created_at: string;
  order_items: OrderItem[];
};

export default function HistoryPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transaksi" | "baca">("transaksi");
  const [readHistory, setReadHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetchOrders();
      fetchReadHistory();
    }
  }, [session, authLoading, router]);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, total, payment_method, status, created_at, order_items(book_id, price)")
      .eq("user_id", session?.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const fetchedOrders = data as Order[];
      setOrders(fetchedOrders);

      const allBookIds = Array.from(new Set(fetchedOrders.flatMap(o => (o.order_items || []).map(oi => oi.book_id))));
      if (allBookIds.length > 0) {
        const { data: dbBooks } = await supabase
          .from("books")
          .select("id, title")
          .in("id", allBookIds);

        const titles: Record<string, string> = {};
        (dbBooks || []).forEach(b => { titles[b.id] = b.title; });
        setOrdersMap(titles);
      }
    }
    setLoading(false);
  }

  async function fetchReadHistory() {
    const { data: progresses } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", session?.user.id)
      .lt("progress_percentage", 100)
      .order("updated_at", { ascending: false });

    const bookIds = (progresses || []).map(p => p.book_id);
    let dbBooksMap = new Map<string, any>();
    if (bookIds.length > 0) {
      const { data: dbBooks } = await supabase
        .from("books")
        .select("*")
        .in("id", bookIds);
      (dbBooks || []).forEach(b => dbBooksMap.set(b.id, b));
    }

    const enriched = (progresses || [])
      .map(p => {
        const book = dbBooksMap.get(p.book_id);
        if (!book) return null;
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          cover: book.cover || book.cover_url || "",
          lastChapter: p.last_chapter ?? 0,
          progressPercentage: p.progress_percentage ?? 0,
          updatedAt: p.updated_at
        };
      })
      .filter(Boolean);
    setReadHistory(enriched);
  }

  const formatPrice = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const statusConfig = {
    success: { label: "Berhasil", color: "#22c55e", bg: "#f0fdf4", Icon: CheckCircle2 },
    pending: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", Icon: AlertCircle },
    failed: { label: "Gagal", color: "#ef4444", bg: "#fef2f2", Icon: XCircle },
  };

  if (authLoading || loading) {
    return <div style={{ padding: "60px", textAlign: "center", color: "#9e8268" }}>Memuat riwayat...</div>;
  }

  return (
    <div className={styles.bukuSayaPage}>
      <div className={styles.bukuSayaHeader}>
        <h1>Riwayat</h1>
        <p>Riwayat transaksi dan aktivitas membacamu.</p>
      </div>

      {/* Tabs */}
      <div className={styles.bukuSayaTabs}>
        <button
          className={`${styles.bukuSayaTab} ${activeTab === "transaksi" ? styles.bukuSayaTabActive : ""}`}
          onClick={() => setActiveTab("transaksi")}
        >
          <HistoryIcon size={18} /> Riwayat Transaksi
          <span className={styles.tabBadge}>{orders.length}</span>
        </button>
        <button
          className={`${styles.bukuSayaTab} ${activeTab === "baca" ? styles.bukuSayaTabActive : ""}`}
          onClick={() => setActiveTab("baca")}
        >
          <Clock size={18} /> Sedang Dibaca
          <span className={styles.tabBadge}>{readHistory.length}</span>
        </button>
      </div>

      {/* TRANSAKSI TAB */}
      {activeTab === "transaksi" && (
        <>
          {orders.length === 0 ? (
            <div className={styles.emptyBukuSaya}>
              <HistoryIcon size={56} color="#c8bcae" />
              <h2>Belum Ada Transaksi</h2>
              <p>Kamu belum pernah melakukan pembelian buku.</p>
              <button onClick={() => router.push("/katalog")}>Jelajahi Katalog</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {orders.map(order => {
                const sc = statusConfig[order.status] || statusConfig.pending;
                const bookTitles = (order.order_items || []).map(oi => {
                  return ordersMap[oi.book_id] || "Buku #" + oi.book_id.slice(0, 6);
                });

                return (
                  <div key={order.id} style={{ background: "white", borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    {/* Order Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 12, color: "#aaa" }}>No. Transaksi</span>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#555", fontFamily: "monospace" }}>
                          #{order.id.slice(0, 16).toUpperCase()}
                        </p>
                      </div>
                      <div style={{ background: sc.bg, color: sc.color, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        <sc.Icon size={14} />
                        {sc.label}
                      </div>
                    </div>

                    {/* Books list */}
                    <div style={{ borderTop: "1px solid #f5f5f5", paddingTop: 12, marginBottom: 12 }}>
                      {bookTitles.map((title, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 14 }}>
                          <span style={{ color: "#333" }}>📖 {title}</span>
                          <span style={{ color: "#ee4d2d", fontWeight: 600 }}>
                            {formatPrice((order.order_items[i]?.price) || 0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f5f5f5", paddingTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>
                          <Clock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                          {formatDate(order.created_at)}
                        </div>
                        <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                          via {order.payment_method?.replace("_", " ") || "-"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "#aaa" }}>Total</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>{formatPrice(order.total)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* READ HISTORY TAB */}
      {activeTab === "baca" && (
        <>
          {readHistory.length === 0 ? (
            <div className={styles.emptyBukuSaya}>
              <Clock size={56} color="#c8bcae" />
              <h2>Belum Ada Riwayat Baca</h2>
              <p>Kamu belum memiliki buku yang sedang dibaca.</p>
              <button onClick={() => router.push("/dashboard/buku-saya")}>Lihat Buku Saya</button>
            </div>
          ) : (
            <div className={styles.bukuSayaGrid}>
              {readHistory.map((book: any) => (
                <div key={book.id} className={styles.bukuSayaCard} onClick={() => router.push(`/baca/${book.id}`)}>
                  <div className={styles.bukuSayaCover}>
                    <img src={book.cover} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                  </div>
                  <div className={styles.bukuSayaInfo}>
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <div className={styles.bukuSayaProgressBar}>
                      <div className={styles.bukuSayaProgressFill} style={{ width: `${book.progressPercentage}%` }} />
                    </div>
                    <span className={styles.bukuSayaProgressText}>{book.progressPercentage}% — Bab {book.lastChapter + 1}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12, color: "#b58b63" }}>
                      <Clock size={12} />
                      <span>Terakhir: {formatDate(book.updatedAt)}</span>
                    </div>
                    <button className={styles.bukuSayaReadBtn} onClick={e => { e.stopPropagation(); router.push(`/baca/${book.id}`); }}>
                      Lanjut Baca
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
