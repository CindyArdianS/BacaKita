"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { LayoutDashboard, Users, BookOpen, FileText, LogOut, Loader2, Library } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Tunggu sampai loading selesai DAN session sudah tahu
    if (loading) return;

    if (!session) {
      router.push("/login?redirect=/admin");
      return;
    }

    const bypass = new URLSearchParams(window.location.search).get("bypass") === "true";

    // Profile yang gagal dibaca bukan lagi state loading. Keluar dari halaman
    // admin agar spinner tidak ditampilkan selamanya.
    if (!bypass && (!userData || userData.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [session, userData, loading, router]);

  const bypass = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bypass") === "true";

  // AuthContext menyelesaikan `loading` untuk hasil sukses, gagal, dan profil
  // tidak ditemukan. `userData === null` adalah hasil otorisasi, bukan loading.
  if (!bypass && loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F7F2ED", flexDirection: "column", gap: 16 }}>
        <Loader2 size={32} style={{ color: "#7A5230", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#7A5230", fontWeight: 500 }}>Memuat Dashboard Admin...</p>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  // Jika tidak punya session atau bukan admin, jangan render apapun (redirect sudah dipanggil di atas)
  if (!bypass && (!session || userData?.role !== "admin")) {
    return null;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F7F2ED", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: "#1a1108", color: "white", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "28px 24px", borderBottom: "1px solid #33261a" }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#e8cfb5" }}>BacaKita</h1>
          <span style={{ fontSize: 12, color: "#6b5744", fontWeight: 600, letterSpacing: 2 }}>ADMIN PANEL</span>
        </div>

        <nav style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <NavLink href="/admin" icon={<LayoutDashboard size={18} />} label="Ringkasan" active={pathname === "/admin"} />
          <NavLink href="/admin/buku" icon={<BookOpen size={18} />} label="Kelola Buku" active={pathname?.startsWith("/admin/buku") || pathname?.startsWith("/admin/bab")} />
          <NavLink href="/admin/transaksi" icon={<FileText size={18} />} label="Transaksi" active={pathname === "/admin/transaksi"} />
          <NavLink href="/admin/user" icon={<Users size={18} />} label="Kelola User" active={pathname === "/admin/user"} />
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid #33261a", display: "flex", flexDirection: "column", gap: 4 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", color: "#a89078", textDecoration: "none", borderRadius: 10, fontSize: 14 }}>
            <Library size={18} />
            Mode Customer
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", color: "#f87171", background: "none", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, textAlign: "left", width: "100%" }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
        {children}
      </main>

      <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
    </div>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        color: active ? "#fff" : "#a89078",
        background: active ? "#7A5230" : "transparent",
        textDecoration: "none",
        fontWeight: active ? 600 : 500,
        fontSize: 14,
        transition: "all 0.15s",
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
