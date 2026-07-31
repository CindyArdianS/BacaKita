"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Shield, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";

type UserRow = {
  id: string;
  nama: string;
  email: string;
  role: string;
  avatar_url: string;
  is_active: boolean;
  is_subscribed: boolean;
  subscription_plan: string;
  created_at: string;
};

export default function AdminUserPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "customer" : "admin";
    if (!confirm("Ubah role user ini menjadi " + newRole.toUpperCase() + "?")) return;
    await supabase.from("users").update({ role: newRole }).eq("id", userId);
    fetchUsers();
  };

  const toggleStatus = async (userId: string, isActive: boolean) => {
    const action = isActive ? "Suspend/Nonaktifkan" : "Aktifkan";
    if (!confirm("Apakah anda yakin ingin " + action + " akun ini?")) return;
    await supabase.from("users").update({ is_active: !isActive }).eq("id", userId);
    fetchUsers();
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.nama || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#2d1a08", margin: 0 }}>Kelola User</h1>
          <p style={{ color: "#6b5744", margin: "8px 0 0 0" }}>Lihat daftar pengguna dan atur hak akses</p>
        </div>
      </div>

      <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #ece5dd" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ position: "relative", maxWidth: 400 }}>
            <Search size={20} color="#9e8268" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: 12, border: "1px solid #ece5dd", fontSize: 14 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>Memuat pengguna...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ece5dd", textAlign: "left", color: "#6b5744", fontSize: 14 }}>
                <th style={{ padding: "16px 8px" }}>Profil Pengguna</th>
                <th style={{ padding: "16px 8px" }}>Role</th>
                <th style={{ padding: "16px 8px" }}>Langganan</th>
                <th style={{ padding: "16px 8px" }}>Status Akun</th>
                <th style={{ padding: "16px 8px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #f6f2ee" }}>
                  <td style={{ padding: "16px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0ece4", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                        {user.avatar_url ? (
                          <Image src={user.avatar_url} alt={user.nama || "User"} fill style={{ objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A5230", fontWeight: 700 }}>
                            {(user.nama || user.email || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#2d1a08" }}>{user.nama || "Unknown"}</div>
                        <div style={{ color: "#6b5744", fontSize: 13 }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    <span style={{
                      background: user.role === "admin" ? "#fef3c7" : "#eff6ff",
                      color: user.role === "admin" ? "#92400e" : "#1d4ed8",
                      padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600
                    }}>
                      {user.role === "admin" ? "Admin" : "Customer"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    {user.is_subscribed ? (
                      <span style={{ background: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: 8, fontSize: 12 }}>
                        {user.subscription_plan || "Aktif"}
                      </span>
                    ) : (
                      <span style={{ color: "#9e8268", fontSize: 13 }}>Regular</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    {user.is_active ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#166534", fontSize: 13 }}>
                        <CheckCircle2 size={16} /> Aktif
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#991b1b", fontSize: 13 }}>
                        <XCircle size={16} /> Suspended
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        title={user.role === "admin" ? "Jadikan Customer" : "Jadikan Admin"}
                        style={{ padding: 8, background: "#f0ece4", color: "#7A5230", border: "none", borderRadius: 8, cursor: "pointer" }}
                      >
                        {user.role === "admin" ? <ShieldAlert size={16} /> : <Shield size={16} />}
                      </button>
                      <button
                        onClick={() => toggleStatus(user.id, user.is_active)}
                        title={user.is_active ? "Suspend Akun" : "Aktifkan Akun"}
                        style={{ padding: 8, background: user.is_active ? "#fee2e2" : "#dcfce7", color: user.is_active ? "#ef4444" : "#22c55e", border: "none", borderRadius: 8, cursor: "pointer" }}
                      >
                        {user.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
