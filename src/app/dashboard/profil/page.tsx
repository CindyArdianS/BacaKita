"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import styles from "../dashboard.module.css";
import { Save, Lock, User as UserIcon, Settings, Image as ImageIcon, CheckCircle2, BookOpen } from "lucide-react";
import Image from "next/image";

export default function ProfilPage() {
  const { session, user, userData } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"ringkasan" | "edit">("ringkasan");

  const [nama, setNama] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalBuku: 0,
    selesaiBaca: 0,
    progressBulanIni: 0,
    targetBulanIni: 0,
  });

  useEffect(() => {
    if (userData) {
      setNama(userData.nama || "");
      setBio(userData.bio || "");
      setPhone(userData.phone || "");
      setAvatarUrl(userData.avatar_url || "");
    }
  }, [userData]);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    if (!session) return;
    const userId = session.user.id;

    // Fetch library
    const { data: libData } = await supabase.from("library").select("book_id").eq("user_id", userId);
    const { data: progressData } = await supabase.from("reading_progress").select("book_id, progress_percentage").eq("user_id", userId);
    
    const totalBuku = libData?.length || 0;
    const selesaiBaca = progressData?.filter(p => p.progress_percentage === 100).length || 0;

    // Fetch reading goals for current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const { data: goalData } = await supabase
      .from("reading_goals")
      .select("target_books")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .maybeSingle();

    setStats({
      totalBuku,
      selesaiBaca,
      progressBulanIni: selesaiBaca, // Simple approximation
      targetBulanIni: goalData?.target_books || 0,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const updates = {
      nama,
      bio,
      phone,
      avatar_url: avatarUrl,
    };

    const { error: dbError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session?.user.id);

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      setMessage("Profil berhasil diperbarui!");
      // reload page to reflect changes in layout
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password berhasil diperbarui!");
      setPassword("");
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError("");
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${session?.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setLoading(true);
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gunakan data dari sesi sebagai fallback jika userData belum ada
  const displayNama = userData?.nama || nama || session?.user?.user_metadata?.nama || session?.user?.email?.split("@")[0] || "Pengguna";
  const displayEmail = userData?.email || session?.user?.email || "";
  const displayRole = userData?.role || "customer";
  const displayAvatar = avatarUrl || userData?.avatar_url || "";
  const isAdmin = userData?.role === "admin";

  if (!session) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#9e8268" }}>
        <p>Silakan login terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      <header className={styles.topHeader}>
        <h2>Profil Saya</h2>
      </header>

      {/* Tabs */}
      <div className={styles.bukuSayaTabs} style={{ marginTop: 24, marginBottom: 24 }}>
        <button
          className={`${styles.bukuSayaTab} ${activeTab === "ringkasan" ? styles.bukuSayaTabActive : ""}`}
          onClick={() => setActiveTab("ringkasan")}
        >
          <UserIcon size={18} /> Ringkasan Akun
        </button>
        <button
          className={`${styles.bukuSayaTab} ${activeTab === "edit" ? styles.bukuSayaTabActive : ""}`}
          onClick={() => setActiveTab("edit")}
        >
          <Settings size={18} /> Edit Profil
        </button>
      </div>

      {activeTab === "ringkasan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Profile Card */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #ece5dd", display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#f0ece4", overflow: "hidden", position: "relative", flexShrink: 0 }}>
              {displayAvatar ? (
                <Image src={displayAvatar} alt="Avatar" fill style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#7a5230", fontWeight: 700 }}>
                  {displayNama?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 style={{ margin: 0, color: "#2d1a08", fontSize: 24 }}>{displayNama}</h2>
              <p style={{ margin: "4px 0", color: "#6b5744" }}>{displayEmail}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span style={{ background: "#f0fdf4", color: "#166534", padding: "4px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                  Status: {userData?.subscription_plan ? `Langganan ${userData?.subscription_plan}` : "Regular"}
                </span>
                <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                  Role: {displayRole === 'admin' ? "Admin" : "Customer"}
                </span>
              </div>
              {isAdmin && (
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button 
                    onClick={() => router.push("/admin")}
                    style={{ padding: "8px 16px", background: "#1a1108", color: "#e8cfb5", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                  >
                    Masuk ke Dashboard Admin →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #ece5dd", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b5744" }}>
                <BookOpen size={18} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Total Buku Dimiliki</span>
              </div>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#2d1a08" }}>{stats.totalBuku}</span>
            </div>
            
            <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #ece5dd", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b5744" }}>
                <CheckCircle2 size={18} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Buku Selesai</span>
              </div>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#22c55e" }}>{stats.selesaiBaca}</span>
            </div>

          </div>
        </div>
      )}

      {activeTab === "edit" && (
        <div style={{ background: "white", padding: "32px", borderRadius: "16px", maxWidth: "600px", border: "1px solid #ece5dd" }}>
          
          {message && <div style={{ background: "#dcfce7", color: "#166534", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>{message}</div>}
          {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>{error}</div>}

          <h3 style={{ fontSize: "18px", color: "#1a1108", marginBottom: "16px" }}>Informasi Dasar</h3>
          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
            
            {/* Avatar Upload */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "14px", color: "#6b5744", marginBottom: "8px", fontWeight: 500 }}>Foto Profil</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0ece4", overflow: "hidden", position: "relative" }}>
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" fill style={{ objectFit: "cover" }} />
                  ) : (
                    <ImageIcon size={32} style={{ position: "absolute", top: 16, left: 16, color: "#c8bcae" }} />
                  )}
                </div>
                <div>
                  <label htmlFor="avatar_upload" style={{ cursor: "pointer", background: "#f6f2ee", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#7a5230", border: "1px solid #e5dbcf", display: "inline-block" }}>
                    {loading ? "Mengupload..." : "Pilih Foto Baru"}
                  </label>
                  <input type="file" id="avatar_upload" accept="image/*" onChange={uploadAvatar} disabled={loading} style={{ display: "none" }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", color: "#6b5744", marginBottom: "6px" }}>Email (Tidak dapat diubah)</label>
              <input type="email" value={user?.email || ""} disabled style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #ece5dd", background: "#f6f2ee", color: "#9e8268" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", color: "#6b5744", marginBottom: "6px", fontWeight: 500 }}>Nama Lengkap</label>
              <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #ece5dd", color: "#2d1a08" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", color: "#6b5744", marginBottom: "6px", fontWeight: 500 }}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #ece5dd", color: "#2d1a08", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", color: "#6b5744", marginBottom: "6px", fontWeight: 500 }}>Nomor HP</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #ece5dd", color: "#2d1a08" }} />
            </div>
            <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#7a5230", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
              <Save size={16} /> {loading ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </form>

          <hr style={{ border: "none", borderTop: "1px solid #ece5dd", margin: "32px 0" }} />

          <h3 style={{ fontSize: "18px", color: "#1a1108", marginBottom: "16px" }}>Ganti Password</h3>
          <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", color: "#6b5744", marginBottom: "6px", fontWeight: 500 }}>Password Baru</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Minimal 8 karakter" style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #ece5dd", color: "#2d1a08" }} />
            </div>
            <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "white", color: "#7a5230", border: "1.5px solid #7a5230", padding: "12px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
              <Lock size={16} /> {loading ? "Menyimpan..." : "Perbarui Password"}
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
