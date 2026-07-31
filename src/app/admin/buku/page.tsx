"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";

type Book = {
  id: string;
  title: string;
  author: string;
  price: number;
  is_active: boolean;
  is_premium: boolean;
};

type FormData = {
  title: string;
  author: string;
  description: string;
  price: number;
  genre: string;
  is_premium: boolean;
  is_active: boolean;
};

export default function AdminBukuPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    author: "",
    description: "",
    price: 0,
    genre: "",
    is_premium: false,
    is_active: true,
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setBooks(data);
    setLoading(false);
  };

  const handleOpenModal = async (book?: any) => {
    if (book) {
      setEditingId(book.id);
      setFormData({
        title: book.title || "",
        author: book.author || "",
        description: book.description || "",
        price: book.price || 0,
        genre: book.genre || "",
        is_premium: book.is_premium || false,
        is_active: book.is_active !== false,
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", author: "", description: "", price: 0, genre: "", is_premium: false, is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from("books").update(formData).eq("id", editingId);
    } else {
      await supabase.from("books").insert(formData);
    }
    setIsModalOpen(false);
    fetchBooks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah anda yakin ingin menghapus buku ini?")) return;
    await supabase.from("books").delete().eq("id", id);
    fetchBooks();
  };

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#2d1a08", margin: 0 }}>Kelola Buku</h1>
          <p style={{ color: "#6b5744", margin: "8px 0 0 0" }}>Tambah, edit, dan hapus katalog buku</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{ background: "#7A5230", color: "white", padding: "12px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          <Plus size={20} />
          Tambah Buku
        </button>
      </div>

      <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #ece5dd" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ position: "relative", maxWidth: 400 }}>
            <Search size={20} color="#9e8268" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Cari judul buku..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: 12, border: "1px solid #ece5dd", fontSize: 14 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>Memuat buku...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ece5dd", textAlign: "left", color: "#6b5744", fontSize: 14 }}>
                <th style={{ padding: "16px 8px" }}>Judul Buku</th>
                <th style={{ padding: "16px 8px" }}>Penulis</th>
                <th style={{ padding: "16px 8px" }}>Harga</th>
                <th style={{ padding: "16px 8px" }}>Status</th>
                <th style={{ padding: "16px 8px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book.id} style={{ borderBottom: "1px solid #f6f2ee" }}>
                  <td style={{ padding: "16px 8px", fontWeight: 600, color: "#2d1a08" }}>{book.title}</td>
                  <td style={{ padding: "16px 8px", color: "#6b5744" }}>{book.author}</td>
                  <td style={{ padding: "16px 8px", color: "#6b5744" }}>
                    {book.price === 0 ? "Gratis" : "Rp " + book.price.toLocaleString("id-ID")}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    {book.is_active ? (
                      <span style={{ background: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: 8, fontSize: 12 }}>Aktif</span>
                    ) : (
                      <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: 8, fontSize: 12 }}>Tidak Aktif</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <a href={"/admin/bab/" + book.id} style={{ padding: 8, background: "#f0ece4", color: "#7A5230", borderRadius: 8, cursor: "pointer", textDecoration: "none", fontSize: 13 }}>Bab</a>
                      <button onClick={() => handleOpenModal(book)} style={{ padding: 8, background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 8, cursor: "pointer" }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(book.id)} style={{ padding: 8, background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer" }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>Tidak ada buku ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 600, borderRadius: 16, padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: "#2d1a08" }}>{editingId ? "Edit Buku" : "Tambah Buku"}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b5744" }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Judul Buku</label>
                <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ece5dd", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Penulis</label>
                <input required value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ece5dd", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Deskripsi</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ece5dd", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Harga (Rp)</label>
                  <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ece5dd", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Genre</label>
                  <input value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ece5dd", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.is_premium} onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })} />
                  Premium Only
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  Status Aktif
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "12px 24px", borderRadius: 8, border: "1px solid #ece5dd", background: "white", color: "#6b5744", fontWeight: 600, cursor: "pointer" }}>Batal</button>
                <button type="submit" style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: "#7A5230", color: "white", fontWeight: 600, cursor: "pointer" }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
