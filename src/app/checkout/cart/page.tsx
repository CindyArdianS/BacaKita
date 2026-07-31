"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, CreditCard, Wallet, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import AuthNavbar from "@/components/AuthNavbar";
import { books } from "@/lib/data/books";

type CheckoutItem = {
  cart_item_id: string;
  book_id: string;
  price: number;
  title: string;
};

function CheckoutCartContent() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"selecting" | "loading" | "success" | "error">("selecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/login?redirect=/checkout/cart");
      return;
    }
    if (session) {
      loadItems();
    }
  }, [session, authLoading]);

  async function loadItems() {
    // Get selected item IDs from query string
    const itemIdsParam = searchParams.get("items");
    if (!itemIdsParam) {
      setErrorMessage("Tidak ada item yang dipilih.");
      setStatus("error");
      return;
    }
    const selectedIds = decodeURIComponent(itemIdsParam).split(",").filter(Boolean);

    // Fetch those specific cart items
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("id, book_id")
      .in("id", selectedIds);

    if (!cartItems || cartItems.length === 0) {
      setErrorMessage("Item tidak ditemukan.");
      setStatus("error");
      return;
    }

    const items: CheckoutItem[] = cartItems.map(ci => {
      const book = books.find(b => b.id === ci.book_id);
      const price = book?.price ? parseInt(book.price.replace(/[^0-9]/g, ""), 10) : 0;
      return {
        cart_item_id: ci.id,
        book_id: ci.book_id,
        price,
        title: book?.title || "Buku"
      };
    });
    setCheckoutItems(items);
  }

  const parsePrice = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
  const subtotal = checkoutItems.reduce((s, i) => s + i.price, 0);
  const tax = Math.floor(subtotal * 0.11);
  const total = subtotal + tax;

  const handleSimulateSuccess = async () => processCheckout("success");
  const handleSimulateError = async () => {
    setStatus("error");
    setErrorMessage("Simulasi pembayaran gagal. Silakan coba lagi.");
  };

  async function processCheckout(simulatedStatus: "success") {
    try {
      setStatus("loading");

      // 1. Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: session?.user.id,
          total,
          payment_method: paymentMethod,
          status: simulatedStatus
        })
        .select()
        .single();
      if (orderErr) throw orderErr;
      setOrderId(order.id);

      // 2. Create order items
      const { error: orderItemsErr } = await supabase
        .from("order_items")
        .insert(checkoutItems.map(ci => ({
          order_id: order.id,
          book_id: ci.book_id,
          price: ci.price
        })));
      if (orderItemsErr) throw orderItemsErr;

      // 3. Add to library (skip already-owned)
      const { data: existing } = await supabase
        .from("library")
        .select("book_id")
        .eq("user_id", session?.user.id)
        .in("book_id", checkoutItems.map(i => i.book_id));

      const existingIds = new Set((existing || []).map(e => e.book_id));
      const newBooks = checkoutItems.filter(i => !existingIds.has(i.book_id));
      if (newBooks.length > 0) {
        await supabase.from("library").insert(
          newBooks.map(i => ({ user_id: session?.user.id, book_id: i.book_id }))
        );
      }

      // 4. Remove purchased items from cart
      await supabase
        .from("cart_items")
        .delete()
        .in("id", checkoutItems.map(i => i.cart_item_id));

      setStatus("success");
    } catch (err: any) {
      console.error("Checkout error:", err);
      setStatus("error");
      setErrorMessage(err.message || "Gagal memproses checkout");
    }
  }

  if (authLoading) return null;

  return (
    <>
      <AuthNavbar />
      <div style={{ minHeight: "100vh", padding: "20px 20px 40px", backgroundColor: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {status === "selecting" && checkoutItems.length > 0 && (
          <div style={{ maxWidth: 640, width: "100%" }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 20 }}>Konfirmasi Pembayaran</h1>

            {/* Items Summary */}
            <div style={{ background: "white", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#333" }}>Buku yang Dibeli</h2>
              {checkoutItems.map(item => (
                <div key={item.cart_item_id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ color: "#1a1a1a", fontSize: 14 }}>{item.title}</span>
                  <span style={{ fontWeight: 700, color: "#ee4d2d" }}>{parsePrice(item.price)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <span style={{ color: "#888", fontSize: 14 }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{parsePrice(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: "#888", fontSize: 14 }}>Pajak (11%)</span>
                <span style={{ fontWeight: 600 }}>{parsePrice(tax)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "2px solid #f0f0f0" }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>Total Bayar</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#ee4d2d" }}>{parsePrice(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ background: "white", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#333" }}>Metode Pembayaran</h2>
              {[
                { id: "transfer", label: "Transfer Bank (Virtual Account)", Icon: Wallet },
                { id: "ewallet", label: "E-Wallet (GoPay, OVO, Dana)", Icon: Wallet },
                { id: "credit_card", label: "Kartu Kredit / Debit", Icon: CreditCard }
              ].map(({ id, label, Icon }) => (
                <label key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, border: paymentMethod === id ? "2px solid #ee4d2d" : "1px solid #e0e0e0", borderRadius: 12, cursor: "pointer", transition: "all 0.2s" }}>
                  <input type="radio" name="pay" checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} style={{ accentColor: "#ee4d2d" }} />
                  <Icon size={18} color={paymentMethod === id ? "#ee4d2d" : "#999"} />
                  <span style={{ fontSize: 14, color: "#1a1a1a" }}>{label}</span>
                </label>
              ))}
            </div>

            {/* Simulation Box */}
            <div style={{ background: "#fff7ed", borderRadius: 18, padding: 20, border: "1px solid #fed7aa", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#c2410c", fontWeight: 700 }}>
                <AlertCircle size={18} /> Simulasi Pembayaran
              </div>
              <p style={{ color: "#78350f", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                Ini adalah prototype. Klik tombol di bawah untuk mensimulasikan hasil pembayaran.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={handleSimulateSuccess} style={{ flex: 1, background: "#22c55e", color: "white", border: "none", padding: "14px 0", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  ✅ Simulasi Berhasil
                </button>
                <button onClick={handleSimulateError} style={{ flex: 1, background: "#ef4444", color: "white", border: "none", padding: "14px 0", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  ❌ Simulasi Gagal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status States */}
        {status !== "selecting" && (
          <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 420, width: "90%", marginTop: "8vh" }}>
            {status === "loading" && (
              <>
                <Loader2 size={52} className="animate-spin" style={{ margin: "0 auto 20px", color: "#ee4d2d" }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>Memproses Pembayaran...</h2>
                <p style={{ color: "#888" }}>Mohon tunggu sebentar.</p>
              </>
            )}
            {status === "success" && (
              <>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <CheckCircle2 size={56} style={{ margin: "0 auto 16px", color: "#22c55e" }} />
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", marginBottom: 10 }}>Pembayaran Berhasil!</h2>
                <p style={{ color: "#666", marginBottom: 28, lineHeight: 1.6 }}>Buku-bukumu telah masuk ke <strong>Perpustakaan</strong>. Selamat membaca!</p>
                <button onClick={() => router.push("/dashboard/katalog")} style={{ background: "#ee4d2d", color: "white", padding: "14px 24px", borderRadius: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 8, fontWeight: 700, fontSize: 15 }}>
                  Ke Perpustakaan Saya <ArrowRight size={18} />
                </button>
                <button onClick={() => router.push("/katalog")} style={{ background: "transparent", color: "#1a1a1a", padding: "12px 24px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer", width: "100%", marginTop: 12, fontWeight: 600 }}>
                  Belanja Lagi
                </button>
              </>
            )}
            {status === "error" && (
              <>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#ef4444", fontSize: 28, fontWeight: 900 }}>!</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>Pembayaran Gagal</h2>
                <p style={{ color: "#888", marginBottom: 28 }}>{errorMessage}</p>
                <button onClick={() => setStatus("selecting")} style={{ background: "#ee4d2d", color: "white", padding: "14px 24px", borderRadius: 12, border: "none", cursor: "pointer", width: "100%", fontWeight: 700, marginBottom: 10 }}>
                  Coba Lagi
                </button>
                <button onClick={() => router.push("/cart")} style={{ background: "transparent", color: "#1a1a1a", padding: "12px 24px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer", width: "100%", fontWeight: 600 }}>
                  Kembali ke Keranjang
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function CheckoutCartPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutCartContent />
    </Suspense>
  );
}
