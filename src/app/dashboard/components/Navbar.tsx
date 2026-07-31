"use client";

import { Menu, ShoppingCart, Crown, User } from "lucide-react";
import styles from "../dashboard.module.css";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  openSidebar: () => void;
};

export default function Navbar({ openSidebar }: Props) {
  const { session } = useAuth();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session) return;

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
      .channel("dashboard-cart-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/dashboard/katalog?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftHeader}>
        <button className={styles.iconButton} onClick={openSidebar}>
          <Menu size={24} />
        </button>
        <h1 className={styles.logo} onClick={() => router.push("/dashboard")} style={{ cursor: "pointer" }}>
          BacaKita
        </h1>
      </div>

      <form className={styles.searchBar} onSubmit={handleSearch} style={{ display: "flex" }}>
        <input
          type="text"
          placeholder="Cari buku..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className={styles.rightHeader}>
        {/* Cart with badge */}
        <button
          className={styles.iconButton}
          onClick={() => router.push("/cart")}
          style={{ position: "relative" }}
          title="Keranjang"
        >
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span style={{
              position: "absolute", top: -2, right: -2,
              background: "#ee4d2d", color: "white",
              fontSize: 10, fontWeight: 800,
              borderRadius: 10, padding: "1px 5px",
              minWidth: 16, textAlign: "center", lineHeight: "14px"
            }}>
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>

        <button
          className={styles.subscriptionBtn}
          onClick={() => router.push("/subscription")}
        >
          <Crown size={18} />
          Langganan
        </button>

        {session && (
          <button
            className={styles.subscriptionBtn}
            onClick={() => router.push("/dashboard/profil")}
          >
            <User size={18} />
            Profil
          </button>
        )}
      </div>
    </header>
  );
}