"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, CreditCard, Wallet, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import AuthNavbar from "@/components/AuthNavbar";

const PLANS = {
  bulanan: {
    id: "bulanan",
    name: "Paket Bulanan",
    price: 49000,
    days: 30
  },
  tahunan: {
    id: "tahunan",
    name: "Paket Tahunan",
    price: 399000,
    days: 365
  }
};

export default function CheckoutSubscriptionPage() {
  const { session, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  
  const [status, setStatus] = useState<"loading" | "selecting" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [planDetails, setPlanDetails] = useState<any>(null);
  
  useEffect(() => {
    if (!authLoading && !session) {
      router.push(`/login?redirect=/checkout/subscription/${planId}`);
      return;
    }

    if (session && planId) {
      checkPlan();
    }
  }, [session, authLoading, router, planId]);

  async function checkPlan() {
    const plan = PLANS[planId as keyof typeof PLANS];
    if (plan) {
      setPlanDetails(plan);
      setStatus("selecting");
    } else {
      setStatus("error");
      setErrorMessage("Paket tidak ditemukan");
    }
  }

  const subtotal = planDetails?.price || 0;
  const tax = Math.floor(subtotal * 0.11);
  const total = subtotal + tax;

  const handleSimulateSuccess = async () => {
    await processCheckout("success");
  };

  const handleSimulateError = async () => {
    setStatus("error");
    setErrorMessage("Simulasi pembayaran gagal. Saldo tidak mencukupi atau koneksi terputus.");
  };

  async function processCheckout(simulatedStatus: "success") {
    try {
      setStatus("loading");
      
      // 1. Create Transaction record
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: session?.user.id,
          subtotal: subtotal,
          tax: tax,
          total: total,
          payment_method: paymentMethod,
          status: simulatedStatus
        })
        .select()
        .single();

      if (txError) throw txError;

      // 2. Update User Subscription Status
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + planDetails.days);

      const { error: userError } = await supabase
        .from("users")
        .update({
          is_subscribed: true,
          subscription_plan: planId,
          subscription_expiry: expiryDate.toISOString()
        })
        .eq("id", session?.user.id);

      if (userError) throw userError;

      setStatus("success");
    } catch (err: any) {
      console.error("Subscription checkout error:", err);
      setStatus("error");
      setErrorMessage(err.message || "Gagal memproses langganan");
    }
  }

  if (authLoading) return null;

  return (
    <>
      <AuthNavbar />
      <div style={{ minHeight: "100vh", padding: "20px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "#f9f6f0" }}>
        
        {status === "selecting" && planDetails && (
          <div style={{ maxWidth: "600px", width: "100%" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px", color: "#1e1e1e" }}>Berlangganan Premium</h1>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#333" }}>Ringkasan Paket</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ padding: "12px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
                    <CheckCircle2 size={32} color="#d97706" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: "bold", color: "#1e1e1e" }}>{planDetails.name}</h3>
                    <p style={{ color: "#666", fontSize: "14px" }}>Akses penuh selama {planDetails.days} hari</p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#666" }}>Harga Paket</span>
                  <span>Rp{subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ color: "#666" }}>Pajak (11%)</span>
                  <span>Rp{tax.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "18px", borderTop: "1px solid #eee", paddingTop: "16px", color: "#1e1e1e" }}>
                  <span>Total Bayar</span>
                  <span>Rp{total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#333" }}>Metode</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", border: paymentMethod === "transfer" ? "2px solid #1e1e1e" : "1px solid #ddd", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}>
                    <input type="radio" name="payment" checked={paymentMethod === "transfer"} onChange={() => setPaymentMethod("transfer")} style={{ accentColor: "#1e1e1e" }} />
                    <Wallet size={20} color="#1e1e1e" />
                    <span style={{ color: "#1e1e1e" }}>Transfer Bank (Virtual Account)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", border: paymentMethod === "ewallet" ? "2px solid #1e1e1e" : "1px solid #ddd", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}>
                    <input type="radio" name="payment" checked={paymentMethod === "ewallet"} onChange={() => setPaymentMethod("ewallet")} style={{ accentColor: "#1e1e1e" }} />
                    <Wallet size={20} color="#1e1e1e" />
                    <span style={{ color: "#1e1e1e" }}>E-Wallet (GoPay, OVO, Dana)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", border: paymentMethod === "credit_card" ? "2px solid #1e1e1e" : "1px solid #ddd", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}>
                    <input type="radio" name="payment" checked={paymentMethod === "credit_card"} onChange={() => setPaymentMethod("credit_card")} style={{ accentColor: "#1e1e1e" }} />
                    <CreditCard size={20} color="#1e1e1e" />
                    <span style={{ color: "#1e1e1e" }}>Kartu Kredit / Debit</span>
                  </label>
                </div>
              </div>

              <div style={{ backgroundColor: "#e0f2fe", padding: "24px", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "#0369a1", fontWeight: "bold" }}>
                  <AlertCircle size={20} />
                  <span>Simulasi Pembayaran</span>
                </div>
                <p style={{ color: "#0c4a6e", marginBottom: "16px", fontSize: "14px", lineHeight: "1.5" }}>
                  Karena ini adalah prototype, kami tidak terhubung dengan payment gateway asli. Silakan klik tombol di bawah untuk mensimulasikan hasil pembayaran.
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={handleSimulateSuccess} style={{ flex: 1, backgroundColor: "#22c55e", color: "white", border: "none", padding: "14px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                    Simulasi Berhasil
                  </button>
                  <button onClick={handleSimulateError} style={{ flex: 1, backgroundColor: "#ef4444", color: "white", border: "none", padding: "14px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                    Simulasi Gagal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "12px", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", maxWidth: "400px", width: "90%", display: status === "selecting" ? "none" : "block", marginTop: status === "selecting" ? "0" : "10vh" }}>
          {status === "loading" && (
            <>
              <Loader2 size={48} className="animate-spin" style={{ margin: "0 auto", marginBottom: "20px", color: "#1e1e1e" }} />
              <h2 style={{ fontSize: "20px", marginBottom: "10px", color: "#1e1e1e" }}>Memproses Pembayaran...</h2>
              <p style={{ color: "#666" }}>Mohon tunggu sebentar, kami sedang memproses langgananmu.</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <CheckCircle2 size={64} style={{ margin: "0 auto", marginBottom: "20px", color: "#22c55e" }} />
              <h2 style={{ fontSize: "24px", marginBottom: "10px", color: "#1e1e1e" }}>Langganan Aktif!</h2>
              <p style={{ color: "#666", marginBottom: "30px" }}>Kamu sekarang bisa mengakses semua buku Premium sepuasnya.</p>
              
              <button 
                onClick={() => router.push("/katalog")}
                style={{ backgroundColor: "#1e1e1e", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "8px", fontWeight: "bold" }}
              >
                Mulai Membaca <ArrowRight size={18} />
              </button>
              
              <button 
                onClick={() => router.push("/dashboard/profil")}
                style={{ backgroundColor: "transparent", color: "#1e1e1e", padding: "12px 24px", borderRadius: "8px", border: "1px solid #1e1e1e", cursor: "pointer", width: "100%", marginTop: "12px", fontWeight: "bold" }}
              >
                Lihat Profil
              </button>
            </>
          )}
          
          {status === "error" && (
            <>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", marginBottom: "20px", color: "#ef4444", fontSize: "24px", fontWeight: "bold" }}>!</div>
              <h2 style={{ fontSize: "20px", marginBottom: "10px", color: "#1e1e1e" }}>Pembayaran Gagal</h2>
              <p style={{ color: "#666", marginBottom: "30px" }}>{errorMessage}</p>
              
              <button 
                onClick={() => setStatus("selecting")}
                style={{ backgroundColor: "#1e1e1e", color: "white", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", width: "100%", fontWeight: "bold", marginBottom: "12px" }}
              >
                Coba Lagi
              </button>
              <button 
                onClick={() => router.push("/subscription")}
                style={{ backgroundColor: "transparent", color: "#1e1e1e", padding: "12px 24px", borderRadius: "8px", border: "1px solid #1e1e1e", cursor: "pointer", width: "100%", fontWeight: "bold" }}
              >
                Kembali ke Pilihan Paket
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
