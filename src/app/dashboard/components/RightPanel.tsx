"use client";

import styles from "../dashboard.module.css";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Crown } from "lucide-react";

export default function RightPanel() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Nama pengguna dari metadata (yang diset waktu register)
  const displayName = userData?.nama || user?.user_metadata?.nama || user?.email?.split("@")[0] || "Pembaca";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = userData?.avatar_url || null;

  return (
    <aside className={styles.rightPanel}>

      <div className={styles.profileCard}>
        <div className={styles.profileAvatar} style={{ position: "relative", overflow: "hidden" }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="80px"
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
          ) : (
            initial
          )}
        </div>
        <h3 style={{ textTransform: "capitalize" }}>{displayName}</h3>
        <p>{user?.email}</p>
        
        {userData?.is_subscribed ? (
          // User sudah berlangganan → tampilkan badge status aktif
          <div 
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px", padding: "10px", borderRadius: "10px", background: "#f0fdf4", color: "#15803d", fontSize: "14px", fontWeight: 700 }}
          >
            <Crown size={16} /> Premium Aktif ✓
          </div>
        ) : (
          // User belum berlangganan → tampilkan tombol ajakan berlangganan
          <button 
            className={styles.actionBtn}
            onClick={() => router.push("/subscription")}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px", padding: "10px", borderRadius: "10px", border: "none", background: "#fef3c7", color: "#b45309", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
          >
            <Crown size={16} /> Berlangganan Premium
          </button>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button 
            className={styles.actionBtn}
            onClick={() => router.push("/dashboard/profil")}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", borderRadius: "10px", border: "1px solid #e0d5cb", background: "white", color: "#7a5230", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            <Settings size={14} /> Profil
          </button>
        </div>
      </div>

      {/* Continue Reading */}
      <div 
        className={styles.readingCard} 
        style={{ cursor: "pointer" }} 
        onClick={() => router.push("/baca/1")}
      >
        <h4>Lanjutkan Membaca</h4>

        <Image
          src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500"
          alt="Atomic Habits"
          width={280}
          height={180}
          style={{ objectFit: "cover", borderRadius: "12px", width: "100%", marginTop: "12px", marginBottom: "12px" }}
        />

        <h5>Atomic Habits</h5>
        <small>James Clear</small>

        <div className={styles.progress}>
          <div
            className={styles.progressValue}
            style={{ width: "68%" }}
          />
        </div>

        <span>68% selesai</span>
      </div>


      {/* Premium */}
      <div className={styles.memberCard}>
        <h4>Premium Member</h4>
        <p>
          Nikmati akses tanpa batas ke
          seluruh koleksi ebook premium.
        </p>
        <button onClick={() => router.push("/subscription")}>Kelola Langganan</button>
      </div>

    </aside>
  );
}