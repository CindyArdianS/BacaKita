"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, CreditCard, Wallet, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import AuthNavbar from "@/components/AuthNavbar";
import { supabase } from "@/lib/supabase";

export default function CheckoutDirectPage() {
  const { session, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [status, setStatus] = useState<"selecting" | "loading" | "success" | "error">("selecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [bookDetails, setBookDetails] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push(`/login?redirect=/checkout/direct/${bookId}`);
      return;
    }
    if (session && bookId) {
      validateBook();
    }
  }, [session, authLoading, bookId]);

  async function validateBook() {
    // Check already in library
    const { data: existing } = await supabase
      .from("library")
      .select("id")
      .eq("user_id", session?.user.id)
      .eq("book_id", bookId)
      .single();

    if (existing) {
      setStatus("error");
      setErrorMessage("Kamu sudah memiliki buku ini di perpustakaan.");
      return;
    }

    const { data: book } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .maybeSingle();

    if (book) {
      const numPrice = book.harga ?? book.price ?? 0;
      setBookDetails({
        ...book,
        cover: book.cover || book.cover_url || "",
        price: numPrice === 0 ? "Gratis" : `Rp${numPrice.toLocaleString("id-ID")}`,
      });
    } else {
      setStatus("error");
      setErrorMessage("Buku tidak ditemukan.");
    }
  }

  const parsePrice = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
  const price = bookDetails?.price ? parseInt(bookDetails.price.replace(/[^0-9]/g, ""), 10) : 0;
  const tax = Math.floor(price * 0.11);
  const total = price + tax;

  const handleSimulateSuccess = async () => processCheckout("success");
  const handleSimulateError = () => {
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

      // 2. Order item
      await supabase.from("order_items").insert({
        order_id: order.id,
        book_id: bookId,
        price
      });

      // 3. Add to library
      await supabase.from("library").insert({
        user_id: session?.user.id,
        book_id: bookId
      });

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Gagal memproses pembelian");
    }
  }

  if (authLoading) return null;

  return (
    <>
      <AuthNavbar />
      <div style={{ minHeight: "100vh", padding: "20px 20px 40px", backgroundColor: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {status === "selecting" && bookDetails && (
          <div style={{ maxWidth: 640, width: "100%" }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 20 }}>Beli Langsung</h1>

            {/* Book Card */}
            <div style={{ background: "white", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ position: "relative", width: 72, height: 108, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                {bookDetails.cover && (
                  <Image src={bookDetails.cover} alt={bookDetails.title} fill sizes="72px" style={{ objectFit: "cover" }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{bookDetails.title}</h3>
                <p style={{ color: "#888", fontSize: 13, marginBottom: 10 }}>{bookDetails.author}</p>
                <span style={{ fontWeight: 800, color: "#ee4d2d", fontSize: 18 }}>{bookDetails.price}</span>
              </div>
            </div>

            {/* Price breakdown */}
            <div style={{ background: "white", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#888", fontSize: 14 }}>Harga Buku</span>
                <span style={{ fontWeight: 600 }}>{parsePrice(price)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "#888", fontSize: 14 }}>Pajak (11%)</span>
                <span style={{ fontWeight: 600 }}>{parsePrice(tax)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "2px solid #f0f0f0" }}>
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
                <label key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, border: paymentMethod === id ? "2px solid #ee4d2d" : "1px solid #e0e0e0", borderRadius: 12, cursor: "pointer" }}>
                  <input type="radio" name="pay" checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} style={{ accentColor: "#ee4d2d" }} />
                  <Icon size={18} color={paymentMethod === id ? "#ee4d2d" : "#999"} />
                  <span style={{ fontSize: 14, color: "#1a1a1a" }}>{label}</span>
                </label>
              ))}
            </div>

            {/* Simulation */}
            <div style={{ background: "#fff7ed", borderRadius: 18, padding: 20, border: "1px solid #fed7aa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#c2410c", fontWeight: 700 }}>
                <AlertCircle size={18} /> Simulasi Pembayaran
              </div>
              <p style={{ color: "#78350f", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                Ini adalah prototype. Klik tombol di bawah untuk mensimulasikan hasil pembayaran.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={handleSimulateSuccess} style={{ flex: 1, background: "#22c55e", color: "white", border: "none", padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  ✅ Simulasi Berhasil
                </button>
                <button onClick={handleSimulateError} style={{ flex: 1, background: "#ef4444", color: "white", border: "none", padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  ❌ Simulasi Gagal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        {status !== "selecting" && (
          <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 420, width: "90%", marginTop: "8vh" }}>
            {status === "loading" && (
              <>
                <Loader2 size={52} className="animate-spin" style={{ margin: "0 auto 20px", color: "#ee4d2d" }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Memproses Pembelian...</h2>
              </>
            )}
            {status === "success" && (
              <>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <CheckCircle2 size={56} style={{ margin: "0 auto 16px", color: "#22c55e" }} />
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", marginBottom: 10 }}>Pembelian Berhasil!</h2>
                <p style={{ color: "#666", marginBottom: 28 }}>Buku telah masuk ke Perpustakaan Saya. Selamat membaca!</p>
                <button onClick={() => router.push(`/baca/${bookId}`)} style={{ background: "#ee4d2d", color: "white", padding: "14px 24px", borderRadius: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 8, fontWeight: 700 }}>
                  Baca Sekarang <ArrowRight size={18} />
                </button>
                <button onClick={() => router.push("/dashboard/katalog")} style={{ background: "transparent", color: "#1a1a1a", padding: "12px 24px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer", width: "100%", marginTop: 12, fontWeight: 600 }}>
                  Lihat Perpustakaan
                </button>
              </>
            )}
            {status === "error" && (
              <>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#ef4444", fontSize: 28, fontWeight: 900 }}>!</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>Pembelian Gagal</h2>
                <p style={{ color: "#888", marginBottom: 28 }}>{errorMessage}</p>
                {!errorMessage.includes("perpustakaan") && (
                  <button onClick={() => setStatus("selecting")} style={{ background: "#ee4d2d", color: "white", padding: "14px 24px", borderRadius: 12, border: "none", cursor: "pointer", width: "100%", fontWeight: 700, marginBottom: 10 }}>
                    Coba Lagi
                  </button>
                )}
                <button onClick={() => router.push(`/buku/${bookId}`)} style={{ background: "transparent", color: "#1a1a1a", padding: "12px 24px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer", width: "100%", fontWeight: 600 }}>
                  Kembali ke Detail Buku
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
