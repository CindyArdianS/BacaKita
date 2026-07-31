"use client";

import { Crown, LogIn, User, X, Menu, BookOpen, Home, Info, ShoppingCart, Library, History, LogOut } from "lucide-react";
import styles from "./navbar.module.css";
import { useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function PublicNavbar() {
  const { session, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const publicLinks = [
    { label: "Beranda", href: "/", icon: Home },
    { label: "Katalog", href: "/katalog", icon: BookOpen },
    { label: "Tentang Kami", href: "/tentang", icon: Info },
  ];

  useEffect(() => {
    if (!session) { setCartCount(0); return; }

    const fetchCount = async () => {
      const { data: cart } = await supabase.from("carts").select("id").eq("user_id", session.user.id).single();
      if (cart) {
        const { count } = await supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("cart_id", cart.id);
        setCartCount(count || 0);
      }
    };

    fetchCount();

    const channel = supabase
      .channel("public-navbar-cart")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const nav = (href: string) => { router.push(href); setMobileOpen(false); };

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.menuBtn} onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className={styles.logo} onClick={() => router.push(session ? "/dashboard" : "/")}>
            BacaKita
          </h1>
        </div>

        {/* Center nav — only public links */}
        <nav className={styles.navCenter}>
          {publicLinks.map((link) => (
            <button
              key={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ""}`}
              onClick={() => router.push(link.href)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className={styles.navRight}>
          {/* Cart icon — only when logged in */}
          {session && (
            <button className={styles.cartIconWrapper} onClick={() => router.push("/cart")}>
              <ShoppingCart size={22} className={styles.cartIcon} />
              {cartCount > 0 && (
                <span className={styles.cartBadge}>{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </button>
          )}

          {session ? (
            <button className={styles.profileBtn} onClick={() => router.push("/dashboard/profil")}>
              {userData?.avatar_url ? (
                <div style={{ position: "relative", width: 20, height: 20, borderRadius: "50%", overflow: "hidden" }}>
                  <Image src={userData.avatar_url} alt="Profile" fill style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <User size={18} />
              )}
              Profil
            </button>
          ) : (
            <button className={styles.loginBtn} onClick={() => router.push("/login")}>
              <LogIn size={18} />
              Login
            </button>
          )}
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`${styles.mobileSidebar} ${mobileOpen ? styles.mobileOpen : ""}`}>
        <div className={styles.mobileHeader}>
          <h2>BacaKita</h2>
          <button onClick={() => setMobileOpen(false)}><X size={22} /></button>
        </div>

        <nav className={styles.mobileNav}>
          {/* Public links always visible */}
          {publicLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                className={`${styles.mobileLink} ${pathname === link.href ? styles.mobileLinkActive : ""}`}
                onClick={() => nav(link.href)}
              >
                <Icon size={20} />
                {link.label}
              </button>
            );
          })}

          <hr className={styles.mobileDivider} />

          {session ? (
            <>
              {/* Logged-in menu items */}
              <button
                className={`${styles.mobileLink} ${pathname === "/cart" ? styles.mobileLinkActive : ""}`}
                onClick={() => nav("/cart")}
                style={{ justifyContent: "space-between" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ShoppingCart size={20} />
                  Keranjang
                </span>
                {cartCount > 0 && (
                  <span style={{ background: "#ee4d2d", color: "white", fontSize: 11, fontWeight: 700, borderRadius: 10, padding: "2px 8px" }}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <button
                className={`${styles.mobileLink} ${pathname.startsWith("/dashboard/buku-saya") ? styles.mobileLinkActive : ""}`}
                onClick={() => nav("/dashboard/buku-saya")}
              >
                <Library size={20} />
                Buku Saya
              </button>

              <button
                className={`${styles.mobileLink} ${pathname.startsWith("/dashboard/history") ? styles.mobileLinkActive : ""}`}
                onClick={() => nav("/dashboard/history")}
              >
                <History size={20} />
                Riwayat
              </button>

              <button
                className={`${styles.mobileLink} ${pathname.startsWith("/dashboard/profil") ? styles.mobileLinkActive : ""}`}
                onClick={() => nav("/dashboard/profil")}
              >
                {userData?.avatar_url ? (
                  <div style={{ position: "relative", width: 20, height: 20, borderRadius: "50%", overflow: "hidden" }}>
                    <Image src={userData.avatar_url} alt="Profile" fill style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <User size={20} />
                )}
                Profil Saya
              </button>

              <button
                className={`${styles.mobileLink} ${pathname === "/subscription" ? styles.mobileLinkActive : ""}`}
                onClick={() => nav("/subscription")}
              >
                <Crown size={20} />
                Berlangganan Premium
              </button>

              <hr className={styles.mobileDivider} />

              <button
                className={styles.mobileLink}
                style={{ color: "#ef4444" }}
                onClick={async () => {
                  await supabase.auth.signOut();
                  setMobileOpen(false);
                  router.push("/");
                }}
              >
                <LogOut size={20} />
                Keluar
              </button>
            </>
          ) : (
            <button
              className={styles.mobileLink}
              onClick={() => nav("/login")}
            >
              <LogIn size={20} />
              Login
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}
