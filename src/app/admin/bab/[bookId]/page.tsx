"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { Plus, Edit, Trash2, ArrowLeft, X } from "lucide-react";

type Chapter = {
  id: string;
  title: string;
  order_num: number;
  is_free: boolean;
};

type FormData = {
  title: string;
  content: string;
  order_num: number;
  is_free: boolean;
};

export default function AdminBabPage() {
  const params = useParams();
  const bookId = params.bookId as string;
  const router = useRouter();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bookTitle, setBookTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    order_num: 1,
    is_free: false,
  });

  useEffect(() => {
    if (bookId) fetchData();
  }, [bookId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: book } = await supabase.from("books").select("title").eq("id", bookId).single();
    if (book) setBookTitle(book.title);

    const { data, error } = await supabase
      .from("chapters")
      .select("id, title, order_num, is_free")
      .eq("book_id", bookId)
      .order("order_num", { ascending: true });

    if (!error && data) setChapters(data);
    setLoading(false);
  };

  const handleOpenModal = async (chapterId?: string) => {
    if (chapterId) {
      setEditingId(chapterId);
      const { data } = await supabase.from("chapters").select("*").eq("id", chapterId).single();
      if (data) {
        setFormData({
          title: data.title,
          content: data.content || "",
          order_num: data.order_num,
          is_free: data.is_free,
        });
      }
    } else {
      setEditingId(null);
      setFormData({ title: "", content: "", order_num: chapters.length + 1, is_free: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from("chapters").update(formData).eq("id", editingId);
    } else {
      await supabase.from("chapters").insert({ ...formData, book_id: bookId });
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah anda yakin ingin menghapus bab ini?")) return;
    await supabase.from("chapters").delete().eq("id", id);
    fetchData();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 32 }}>
        <button
          onClick={() => router.push("/admin/buku")}
          style={{ padding: 12, background: "white", border: "1px solid #ece5dd", borderRadius: 12, cursor: "pointer", color: "#6b5744", flexShrink: 0 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#2d1a08", margin: 0 }}>Kelola Bab</h1>
          <p style={{ color: "#6b5744", margin: "8px 0 0 0" }}>Buku: {bookTitle}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          style={{ background: "#7A5230", color: "white", padding: "12px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          <Plus size={20} />
          Tambah Bab
        </button>
      </div>

      <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #ece5dd" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>Memuat bab...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ece5dd", textAlign: "left", color: "#6b5744", fontSize: 14 }}>
                <th style={{ padding: "16px 8px", width: 80 }}>Urutan</th>
                <th style={{ padding: "16px 8px" }}>Judul Bab</th>
                <th style={{ padding: "16px 8px" }}>Akses</th>
                <th style={{ padding: "16px 8px", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((ch) => (
                <tr key={ch.id} style={{ borderBottom: "1px solid #f6f2ee" }}>
                  <td style={{ padding: "16px 8px", fontWeight: 600, color: "#2d1a08" }}>{ch.order_num}</td>
                  <td style={{ padding: "16px 8px", fontWeight: 500, color: "#2d1a08" }}>{ch.title}</td>
                  <td style={{ padding: "16px 8px" }}>
                    {ch.is_free ? (
                      <span style={{ background: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: 8, fontSize: 12 }}>Gratis</span>
                    ) : (
                      <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: 8, fontSize: 12 }}>Premium</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => handleOpenModal(ch.id)} style={{ padding: 8, background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 8, cursor: "pointer" }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(ch.id)} style={{ padding: 8, background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer" }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {chapters.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>Belum ada bab untuk buku ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 800, borderRadius: 16, padding: 32, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: "#2d1a08" }}>{editingId ? "Edit Bab" : "Tambah Bab"}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b5744" }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ width: 100 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Urutan</label>
                  <input type="number" required value={formData.order_num} onChange={(e) => setFormData({ ...formData, order_num: Number(e.target.value) })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ece5dd", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Judul Bab</label>
                  <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ece5dd", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Isi Konten Bab</label>
                <textarea
                  required
                  rows={15}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tulis atau paste isi bab di sini..."
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ece5dd", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={formData.is_free} onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })} />
                Bab Gratis (bisa dibaca tanpa beli/langganan)
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "12px 24px", borderRadius: 8, border: "1px solid #ece5dd", background: "white", color: "#6b5744", fontWeight: 600, cursor: "pointer" }}>Batal</button>
                <button type="submit" style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: "#7A5230", color: "white", fontWeight: 600, cursor: "pointer" }}>Simpan Bab</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
