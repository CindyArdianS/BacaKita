"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export default function DebugCartPage() {
  const { session } = useAuth();
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toISOString().slice(11, 19)} ${msg}`]);

  const runTest = async () => {
    setLog([]);
    addLog("=== MULAI TEST CART ===");

    if (!session) {
      addLog("❌ Tidak ada session! Silakan login dulu.");
      return;
    }
    addLog(`✅ Session ada: user_id = ${session.user.id}`);

    // 1. Test carts table
    addLog("--- Test 1: Cek tabel carts ---");
    const { data: cartData, error: cartErr } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    
    if (cartErr) {
      addLog(`❌ Error carts: ${cartErr.message} [${cartErr.code}]`);
    } else if (cartData) {
      addLog(`✅ Cart sudah ada: cart_id = ${cartData.id}`);
    } else {
      addLog("⚠️ Cart belum ada, mencoba buat cart baru...");
    }

    // 2. Insert cart if not exist
    let cartId = cartData?.id;
    if (!cartId) {
      const { data: newCart, error: newCartErr } = await supabase
        .from("carts")
        .insert({ user_id: session.user.id })
        .select("id")
        .single();

      if (newCartErr) {
        addLog(`❌ Gagal buat cart: ${newCartErr.message} [${newCartErr.code}]`);
        addLog("Hint: " + JSON.stringify(newCartErr.details));
        return;
      }
      cartId = newCart.id;
      addLog(`✅ Cart baru dibuat: cart_id = ${cartId}`);
    }

    // 3. Test cart_items insert
    addLog("--- Test 2: Insert ke cart_items ---");
    const testBookId = "test-book-" + Date.now();
    const { data: itemData, error: itemErr } = await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, book_id: testBookId })
      .select()
      .single();

    if (itemErr) {
      addLog(`❌ Error insert cart_items: ${itemErr.message} [${itemErr.code}]`);
      addLog("Details: " + JSON.stringify(itemErr.details));
    } else {
      addLog(`✅ Insert berhasil! item_id = ${itemData.id}`);
      
      // Cleanup
      await supabase.from("cart_items").delete().eq("id", itemData.id);
      addLog("🧹 Test item sudah dihapus.");
    }

    // 4. Test library
    addLog("--- Test 3: Cek tabel library ---");
    const { error: libErr } = await supabase
      .from("library")
      .select("id")
      .eq("user_id", session.user.id)
      .limit(1);
    
    if (libErr) {
      addLog(`❌ Error library: ${libErr.message} [${libErr.code}]`);
    } else {
      addLog("✅ Tabel library OK");
    }

    // 5. Test orders
    addLog("--- Test 4: Cek tabel orders ---");
    const { error: ordErr } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", session.user.id)
      .limit(1);
    
    if (ordErr) {
      addLog(`❌ Error orders: ${ordErr.message} [${ordErr.code}]`);
    } else {
      addLog("✅ Tabel orders OK");
    }

    addLog("=== SELESAI ===");
  };

  return (
    <div style={{ padding: 40, fontFamily: "monospace", background: "#0f0f0f", minHeight: "100vh", color: "#e0e0e0" }}>
      <h1 style={{ color: "#22c55e", marginBottom: 20 }}>🔧 Debug Cart Database</h1>

      {!session && (
        <p style={{ color: "#ef4444", marginBottom: 16 }}>⚠️ Kamu belum login! Halaman ini perlu login dulu.</p>
      )}

      <button
        onClick={runTest}
        style={{ background: "#3b82f6", color: "white", padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 24 }}
      >
        ▶ Jalankan Test
      </button>

      <div style={{ background: "#1a1a1a", padding: 20, borderRadius: 12, maxHeight: 500, overflowY: "auto", border: "1px solid #333" }}>
        {log.length === 0 ? (
          <p style={{ color: "#666" }}>Output log akan muncul di sini...</p>
        ) : (
          log.map((line, i) => (
            <div key={i} style={{
              padding: "4px 0",
              color: line.includes("❌") ? "#ef4444" : line.includes("✅") ? "#22c55e" : line.includes("⚠️") ? "#f59e0b" : line.includes("===") ? "#3b82f6" : "#e0e0e0",
              fontSize: 13
            }}>
              {line}
            </div>
          ))
        )}
      </div>

      <p style={{ marginTop: 20, color: "#666", fontSize: 12 }}>
        Halaman ini hanya untuk debugging. Akses di: <code style={{ color: "#3b82f6" }}>localhost:3000/debug-cart</code>
      </p>
    </div>
  );
}
