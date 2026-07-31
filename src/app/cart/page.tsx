"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import AuthNavbar from "@/components/AuthNavbar";
import styles from "./cart.module.css";

type CartItem = {
  id: string;
  cart_id: string;
  book_id: string;
  selected: boolean;
  bookDetails?: {
    id: string;
    title: string;
    author: string;
    price: string;
    cover: string;
  };
};

// Simple Toast
function Toast({ msg, type, show }: { msg: string; type: string; show: boolean }) {
  const bg = type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#3b82f6";
  return (
    <div style={{
      position: "fixed", bottom: "130px", left: "50%",
      transform: `translateX(-50%) translateY(${show ? 0 : 20}px)`,
      background: bg, color: "white", padding: "12px 24px",
      borderRadius: "12px", fontWeight: 700, fontSize: 14,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 9999,
      opacity: show ? 1 : 0, transition: "all 0.3s ease", pointerEvents: "none"
    }}>{msg}</div>
  );
}

export default function CartPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState({ msg: "", type: "success", show: false });

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/login?redirect=/cart");
    }
  }, [authLoading, session, router]);

  const fetchCartItems = useCallback(async () => {
    if (!session) return;
    setLoading(true);

    // Get or create cart
    let { data: cart } = await supabase.from("carts").select("id").eq("user_id", session.user.id).single();
    if (!cart) {
      const { data: newCart } = await supabase.from("carts").insert({ user_id: session.user.id }).select("id").single();
      cart = newCart;
    }
    if (!cart) { setLoading(false); return; }

    const { data: items, error } = await supabase
      .from("cart_items")
      .select("id, cart_id, book_id, created_at")
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: true });

    if (error) { console.error(error); setLoading(false); return; }

    const bookIds = (items || []).map(item => item.book_id);
    let booksMap: Record<string, any> = {};

    if (bookIds.length > 0) {
      const { data: dbBooks } = await supabase
        .from("books")
        .select("*")
        .in("id", bookIds);

      (dbBooks || []).forEach(b => {
        const numPrice = b.harga ?? b.price ?? 0;
        booksMap[b.id] = {
          id: b.id,
          title: b.title,
          author: b.author,
          price: numPrice === 0 ? "Gratis" : `Rp${numPrice.toLocaleString("id-ID")}`,
          cover: b.cover || b.cover_url || "",
        };
      });
    }

    const enriched: CartItem[] = (items || []).map(item => ({
      ...item,
      selected: true,
      bookDetails: booksMap[item.book_id]
    }));
    setCartItems(enriched);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) fetchCartItems();
  }, [session, fetchCartItems]);

  // Parse price helper
  const parsePrice = (priceStr?: string) => {
    if (!priceStr) return 0;
    return parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
  };

  const formatPrice = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

  // Computed values
  const selectedItems = cartItems.filter(i => i.selected);
  const subtotal = selectedItems.reduce((sum, i) => sum + parsePrice(i.bookDetails?.price), 0);
  const allSelected = cartItems.length > 0 && cartItems.every(i => i.selected);

  // Toggle single item
  const toggleSelect = (id: string) => {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  // Toggle all
  const toggleSelectAll = () => {
    const next = !allSelected;
    setCartItems(prev => prev.map(i => ({ ...i, selected: next })));
  };

  // Remove item
  const removeItem = async (itemId: string) => {
    setRemoving(itemId);
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
    if (!error) {
      setCartItems(prev => prev.filter(i => i.id !== itemId));
      showToast("Item dihapus dari keranjang.", "info");
    } else {
      showToast("Gagal menghapus item.", "error");
    }
    setRemoving(null);
  };

  // Checkout
  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    const ids = selectedItems.map(i => i.id).join(",");
    router.push(`/checkout/cart?items=${encodeURIComponent(ids)}`);
  };

  if (authLoading || (loading && !cartItems.length)) {
    return (
      <div className={styles.page}>
        <AuthNavbar />
        <div className={styles.header}>
          <div className={styles.headerInner}><h1>Keranjang Belanja</h1></div>
        </div>
        <div className={styles.container}>
          {[1, 2, 3].map(n => (
            <div key={n} className={styles.skeleton}>
              <div className={styles.skeletonBox} style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0 }} />
              <div className={styles.skeletonBox} style={{ width: 72, height: 108, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className={styles.skeletonBox} style={{ height: 16, width: "70%", marginBottom: 8 }} />
                <div className={styles.skeletonBox} style={{ height: 13, width: "40%", marginBottom: 12 }} />
                <div className={styles.skeletonBox} style={{ height: 17, width: "30%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AuthNavbar />
      <Toast msg={toast.msg} type={toast.type} show={toast.show} />

      <div className={styles.header}>
        <div className={styles.headerInner}>
          <h1>Keranjang Belanja</h1>
          {cartItems.length > 0 && (
            <span className={styles.itemCount}>({cartItems.length} item)</span>
          )}
        </div>
      </div>

      <div className={styles.container}>
        {cartItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>🛒</div>
            <h2>Keranjangmu Masih Kosong</h2>
            <p>Temukan buku favoritmu dan mulai berbelanja sekarang.</p>
            <button className={styles.exploreBtn} onClick={() => router.push("/katalog")}>
              Jelajahi Buku
            </button>
          </div>
        ) : (
          <>
            {cartItems.map(item => (
              <div
                key={item.id}
                className={styles.cartItem}
                style={{ opacity: removing === item.id ? 0.5 : 1 }}
              >
                {/* Custom Checkbox */}
                <input
                  type="checkbox"
                  className={styles.customCheckbox}
                  id={`chk-${item.id}`}
                  checked={item.selected}
                  onChange={() => toggleSelect(item.id)}
                />
                <label htmlFor={`chk-${item.id}`} className={styles.checkboxLabel}>
                  <div className={styles.checkboxBox}>
                    {item.selected && <span className={styles.checkmark}>✓</span>}
                  </div>
                </label>

                {/* Book Cover */}
                <div className={styles.coverWrap}>
                  {item.bookDetails?.cover ? (
                    <Image
                      src={item.bookDetails.cover}
                      alt={item.bookDetails.title || "Cover"}
                      fill
                      sizes="72px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#f0ece4" }} />
                  )}
                </div>

                {/* Info */}
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>
                    {item.bookDetails?.title || "Buku tidak ditemukan"}
                  </h3>
                  <p className={styles.itemAuthor}>{item.bookDetails?.author || "-"}</p>
                  <p className={styles.itemPrice}>{item.bookDetails?.price || "—"}</p>
                </div>

                {/* Delete */}
                <button
                  className={styles.deleteBtn}
                  onClick={() => removeItem(item.id)}
                  disabled={removing === item.id}
                  title="Hapus dari keranjang"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* STICKY FOOTER */}
      {cartItems.length > 0 && (
        <div className={styles.stickyFooter}>
          <div className={styles.footerInner}>
            {/* Select All */}
            <input
              type="checkbox"
              className={styles.customCheckbox}
              id="chk-all"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            <label htmlFor="chk-all" className={styles.selectAllLabel}>
              <div className={styles.checkboxBox}>
                {allSelected && <span className={styles.checkmark}>✓</span>}
              </div>
              Pilih Semua
            </label>

            {/* Total */}
            <div className={styles.footerTotal}>
              <div className={styles.totalBooks}>
                {selectedItems.length} buku dipilih
              </div>
              <div className={styles.totalLabel}>Total Harga</div>
              <div className={styles.totalPrice}>{formatPrice(subtotal)}</div>
            </div>

            {/* Checkout Button */}
            <button
              className={styles.checkoutBtn}
              disabled={selectedItems.length === 0}
              onClick={handleCheckout}
            >
              Checkout ({selectedItems.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
