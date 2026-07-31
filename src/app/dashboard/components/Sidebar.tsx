"use client";

import { Home, Compass, Library, ShoppingCart, History, LogOut, Crown, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import styles from "../dashboard.module.css";

type Props = {
  isOpen: boolean;
  closeSidebar: () => void;
};

export default function Sidebar({ isOpen, closeSidebar }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!session) return;

    // Fetch user name
    supabase
      .from("users")
      .select("nama, email")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setUserName(data.nama || data.email || "Pengguna");
      });

    // Fetch cart count
    const fetchCount = async () => {
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id)
        .single();
      if (cart) {
        const { count } = await supabase
          .from("cart_items")
          .select("*", { count: "exact", head: true })
          .eq("cart_id", cart.id);
        setCartCount(count || 0);
      }
    };

    fetchCount();

    const channel = supabase
      .channel("sidebar-cart-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const nav = (path: string) => {
    router.push(path);
    closeSidebar();
  };

  const menuItems = [
    { path: "/dashboard", icon: Home, label: "Beranda" },
    { path: "/dashboard/katalog", icon: Compass, label: "Katalog" },
    { path: "/dashboard/buku-saya", icon: Library, label: "Buku Saya" },
    { path: "/dashboard/history", icon: History, label: "Riwayat" },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.mobileOverlay} ${isOpen ? styles.active : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`${styles.mobileSidebar} ${isOpen ? styles.active : ""}`}>
        {/* Header */}
        <div className={styles.mobileSidebarHeader}>
          <h2>BacaKita</h2>
          <button className={styles.closeSidebar} onClick={closeSidebar}>✕</button>
        </div>

        {/* User Info */}
        {session && (
          <div style={{
            padding: "12px 20px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid #f0ece4"
          }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: "50%",
              background: "#7a5230",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{userName}</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>Akun Aktif</div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className={styles.mobileMenu}>
          {menuItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => nav(path)}
              className={pathname === path ? styles.activeIcon : ""}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}

          {/* Keranjang dengan badge */}
          <button
            onClick={() => nav("/cart")}
            className={pathname === "/cart" ? styles.activeIcon : ""}
            style={{ position: "relative" }}
          >
            <ShoppingCart size={18} />
            Keranjang
            {cartCount > 0 && (
              <span style={{
                marginLeft: "auto",
                background: "#ee4d2d",
                color: "white",
                fontSize: 11,
                fontWeight: 800,
                borderRadius: 10,
                padding: "2px 8px",
                minWidth: 20,
                textAlign: "center"
              }}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <hr style={{ border: "none", borderTop: "1px solid #f0ece4", margin: "8px 0" }} />

          {/* Langganan */}
          <button onClick={() => nav("/subscription")}>
            <Crown size={18} />
            Berlangganan Premium
          </button>

          {/* Profil */}
          <button
            onClick={() => nav("/dashboard/profil")}
            className={pathname === "/dashboard/profil" ? styles.activeIcon : ""}
          >
            <User size={18} />
            Profil Saya
          </button>

          {/* Logout */}
          <button
            style={{ color: "#ef4444" }}
            onClick={async () => {
              await supabase.auth.signOut();
              closeSidebar();
              router.push("/");
            }}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}