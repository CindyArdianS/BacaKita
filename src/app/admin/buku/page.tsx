"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Edit, Plus, Search, Trash2, X } from "lucide-react";

const COVER_BUCKET = "book-assets";
const PDF_BUCKET = "book-pdfs";
const REQUEST_TIMEOUT_MS = 60_000;

type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string | null;
  cover: string | null;
  pdf_url: string | null;
  harga: number | null;
  // Kolom lama dipertahankan sebagai fallback untuk data katalog yang sudah ada.
  cover_url: string | null;
  genre: string | null;
  price: number | null;
  created_at: string;
};

type BookForm = {
  title: string;
  author: string;
  description: string;
  category: string;
  harga: number;
};

const emptyForm: BookForm = { title: "", author: "", description: "", category: "", harga: 0 };

function getStoragePath(url: string | null, bucket: string) {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

function createStoragePath(file: File, folder: "covers" | "pdfs") {
  const extension = file.name.split(".").pop()?.toLowerCase() || "file";
  return `${folder}/${crypto.randomUUID()}.${extension}`;
}

function withTimeout<T>(promise: PromiseLike<T>, operation: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(`${operation} melebihi batas waktu. Periksa koneksi dan policy Supabase Storage.`)), REQUEST_TIMEOUT_MS);
    Promise.resolve(promise).then(
      (value) => { window.clearTimeout(timeout); resolve(value); },
      (error) => { window.clearTimeout(timeout); reject(error); }
    );
  });
}

function logSupabaseFailure(stage: string, error: unknown) {
  const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
  console.error("Raw Supabase Error:", error);
  console.error("Message:", supabaseError?.message);
  console.error("Code:", supabaseError?.code);
  console.error("Details:", supabaseError?.details);
  console.error("Hint:", supabaseError?.hint);
  console.error(`FAILED ${stage}`, {
    code: supabaseError?.code ?? "UNKNOWN",
    message: supabaseError?.message ?? String(error),
    details: supabaseError?.details ?? null,
    hint: supabaseError?.hint ?? null,
  });
}

export default function AdminBukuPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookForm>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await withTimeout(
        supabase.from("books").select("*").order("created_at", { ascending: false }),
        "Memuat daftar buku"
      );
      if (fetchError) throw fetchError;
      setBooks((data || []) as Book[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat daftar buku.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBooks();
  }, []);

  const openForm = (book?: Book) => {
    setError("");
    setCoverFile(null);
    setPdfFile(null);
    setEditingBook(book || null);
    setFormData(book ? {
      title: book.title,
      author: book.author,
      description: book.description || "",
      category: book.category || book.genre || "",
      harga: book.harga ?? book.price ?? 0,
    } : emptyForm);
    setIsModalOpen(true);
  };

  const uploadFile = async (file: File, path: string, label: "cover" | "pdf") => {
    const bucket = label === "pdf" ? PDF_BUCKET : COVER_BUCKET;
    console.log(`START upload ${label}`, { bucket, path, name: file.name, size: file.size, type: file.type });
    try {
      const { error: uploadError } = await withTimeout(
        supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type }),
        `Mengunggah ${file.name}`
      );
      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      if (!publicUrl) throw new Error(`URL ${label} tidak diterima dari Supabase Storage.`);
      console.log(`SUCCESS upload ${label}`, { path, publicUrl });
      return publicUrl;
    } catch (uploadError) {
      logSupabaseFailure(`upload ${label}`, uploadError);
      throw uploadError;
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>, kind: "cover" | "pdf") => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (kind === "cover" && !file.type.startsWith("image/")) {
      setError("Cover harus berupa file gambar.");
      event.target.value = "";
      return;
    }
    if (kind === "pdf" && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("File buku harus berformat PDF.");
      event.target.value = "";
      return;
    }
    setError("");
    if (kind === "cover") setCoverFile(file);
    else setPdfFile(file);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingBook && (!coverFile || !pdfFile)) {
      setError("Cover dan file PDF wajib diunggah saat menambah buku.");
      return;
    }

    setSaving(true);
    setError("");
    const uploadedCoverPaths: string[] = [];
    const uploadedPdfPaths: string[] = [];
    let stage = "upload cover";
    try {
      const coverPath = coverFile ? createStoragePath(coverFile, "covers") : null;
      const pdfPath = pdfFile ? createStoragePath(pdfFile, "pdfs") : null;
      if (coverPath) uploadedCoverPaths.push(coverPath);
      const coverUrl = coverFile && coverPath ? await uploadFile(coverFile, coverPath, "cover") : (editingBook?.cover || editingBook?.cover_url || null);
      if (!coverUrl) throw new Error("URL cover kosong. Insert buku dibatalkan.");
      stage = "upload pdf";
      if (pdfPath) uploadedPdfPaths.push(pdfPath);
      const pdfUrl = pdfFile && pdfPath ? await uploadFile(pdfFile, pdfPath, "pdf") : (editingBook?.pdf_url || null);
      if (!pdfUrl) throw new Error("URL PDF kosong. Insert buku dibatalkan.");
      const payload = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        category: formData.category,
        cover: coverUrl,
        pdf_url: pdfUrl,
        harga: formData.harga,
        is_active: true,
        // Menjaga kartu/katalog lama tetap membaca buku baru selama migrasi.
        cover_url: coverUrl,
        genre: formData.category,
        price: formData.harga,
      };
      console.log("START insert books", payload);
      stage = "insert books";
      const { data: savedBook, error: saveError } = await withTimeout(
        editingBook
          ? supabase.from("books").update(payload).eq("id", editingBook.id).select("id, title, cover, pdf_url").single()
          : supabase.from("books").insert(payload).select("id, title, cover, pdf_url").single(),
        "Menyimpan data buku"
      );
      if (saveError) throw saveError;
      if (!savedBook) throw new Error("Data buku tidak dikembalikan setelah disimpan.");
      console.log("SUCCESS insert books", savedBook);

      // Bersihkan file lama hanya setelah URL baru tersimpan di database.
      if (editingBook) {
        const oldCoverPath = coverFile ? getStoragePath(editingBook.cover || editingBook.cover_url, COVER_BUCKET) : null;
        const oldPdfPath = pdfFile ? getStoragePath(editingBook.pdf_url, PDF_BUCKET) : null;
        if (oldCoverPath) await supabase.storage.from(COVER_BUCKET).remove([oldCoverPath]);
        if (oldPdfPath) await supabase.storage.from(PDF_BUCKET).remove([oldPdfPath]);
      }

      setIsModalOpen(false);
      await fetchBooks();
    } catch (saveError) {
      logSupabaseFailure(stage, saveError);
      if (uploadedCoverPaths.length) {
        // Cleanup is best-effort and must never delay returning the upload
        // error or keep the submit button in its loading state.
        void withTimeout(supabase.storage.from(COVER_BUCKET).remove(uploadedCoverPaths), "Membersihkan cover upload").catch(() => undefined);
      }
      if (uploadedPdfPaths.length) {
        void withTimeout(supabase.storage.from(PDF_BUCKET).remove(uploadedPdfPaths), "Membersihkan PDF upload").catch(() => undefined);
      }
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan buku.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`Hapus buku "${book.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setError("");
    const { error: deleteError } = await supabase.from("books").delete().eq("id", book.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    const coverPath = getStoragePath(book.cover || book.cover_url, COVER_BUCKET);
    const pdfPath = getStoragePath(book.pdf_url, PDF_BUCKET);
    if (coverPath) await supabase.storage.from(COVER_BUCKET).remove([coverPath]);
    if (pdfPath) await supabase.storage.from(PDF_BUCKET).remove([pdfPath]);
    await fetchBooks();
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      (book.category || book.genre || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#2d1a08", margin: 0 }}>Kelola Buku</h1>
          <p style={{ color: "#6b5744", margin: "8px 0 0" }}>Tambah, edit, dan hapus katalog buku PDF</p>
        </div>
        <button onClick={() => openForm()} style={primaryButton}>
          <Plus size={20} /> Tambah Buku
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid #ece5dd" }}>
        <div style={{ position: "relative", maxWidth: 400, marginBottom: 24 }}>
          <Search size={20} color="#9e8268" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, penulis, atau kategori..."
            style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: 12, border: "1px solid #ece5dd", fontSize: 14, boxSizing: "border-box" }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>Memuat buku...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={tableHeader}>
                <th style={cell}>Cover</th>
                <th style={cell}>Judul Buku</th>
                <th style={cell}>Penulis</th>
                <th style={cell}>Kategori</th>
                <th style={cell}>Harga</th>
                <th style={cell}>File PDF</th>
                <th style={{ ...cell, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => {
                const coverSrc = book.cover || book.cover_url;
                const bookPrice = book.harga ?? book.price ?? 0;
                return (
                  <tr key={book.id} style={{ borderBottom: "1px solid #f6f2ee" }}>
                    <td style={cell}>
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt={book.title}
                          style={{ width: 40, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 56, background: "#f0ece4", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
                      )}
                    </td>
                    <td style={{ ...cell, fontWeight: 600 }}>{book.title}</td>
                    <td style={cell}>{book.author}</td>
                    <td style={cell}>{book.category || book.genre || "-"}</td>
                    <td style={cell}>
                      {bookPrice === 0 ? <span style={{ color: "#16a34a", fontWeight: 600 }}>Gratis</span> : `Rp ${bookPrice.toLocaleString("id-ID")}`}
                    </td>
                    <td style={cell}>
                      {book.pdf_url ? (
                        <span style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>✓ Tersedia</span>
                      ) : (
                        <span style={{ color: "#dc2626", fontSize: 13 }}>Belum ada</span>
                      )}
                    </td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      <button onClick={() => openForm(book)} style={iconButton} title="Edit Buku">
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => void handleDelete(book)}
                        style={{ ...iconButton, color: "#b91c1c", background: "#fef2f2", marginLeft: 8 }}
                        title="Hapus Buku"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9e8268" }}>
                    Tidak ada buku ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={overlay}>
          <div style={modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>{editingBook ? "Edit Buku" : "Tambah Buku"}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 0, background: "none", cursor: "pointer" }}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Judul Buku">
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={inputStyle}
                  placeholder="Masukkan judul buku"
                />
              </Field>

              <Field label="Penulis">
                <input
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  style={inputStyle}
                  placeholder="Nama penulis / pengarang"
                />
              </Field>

              <Field label="Deskripsi">
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={inputStyle}
                  placeholder="Sinopsis atau deskripsi buku"
                />
              </Field>

              <Field label="Kategori">
                <input
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={inputStyle}
                  placeholder="Contoh: Novel, Teknologi, Bisnis, Komik"
                />
              </Field>

              <Field label="Harga (Rp)">
                <input
                  required
                  min="0"
                  type="number"
                  value={formData.harga}
                  onChange={(e) => setFormData({ ...formData, harga: Number(e.target.value) })}
                  style={inputStyle}
                />
              </Field>

              <Field label={`Cover Buku ${editingBook ? "(opsional untuk mengganti)" : ""}`}>
                <input
                  required={!editingBook}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e, "cover")}
                />
                {coverFile ? (
                  <small style={{ color: "#16a34a" }}>Terpilih: {coverFile.name}</small>
                ) : editingBook?.cover || editingBook?.cover_url ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                    <img
                      src={(editingBook.cover || editingBook.cover_url)!}
                      alt="Cover saat ini"
                      style={{ width: 48, height: 64, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }}
                    />
                    <small style={{ color: "#666" }}>Cover saat ini digunakan jika tidak diganti.</small>
                  </div>
                ) : null}
              </Field>

              <Field label={`File Buku PDF ${editingBook ? "(opsional untuk mengganti)" : ""}`}>
                <input
                  required={!editingBook}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => handleFile(e, "pdf")}
                />
                {pdfFile ? (
                  <small style={{ color: "#16a34a" }}>Terpilih: {pdfFile.name}</small>
                ) : editingBook?.pdf_url ? (
                  <small style={{ color: "#666" }}>File PDF lama akan tetap digunakan jika tidak diganti.</small>
                ) : null}
              </Field>

              {error && <div style={{ color: "#b91c1c", fontSize: 14 }}>{error}</div>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={cancelButton}>
                  Batal
                </button>
                <button disabled={saving} type="submit" style={primaryButton}>
                  {saving ? "Mengunggah & menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14, fontWeight: 500 }}>
      {label}
      {children}
    </label>
  );
}

const primaryButton = {
  background: "#7A5230",
  color: "white",
  padding: "12px 24px",
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
} as const;

const cancelButton = {
  padding: "12px 24px",
  borderRadius: 8,
  border: "1px solid #ece5dd",
  background: "white",
  cursor: "pointer",
} as const;

const inputStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ece5dd",
  boxSizing: "border-box",
  fontFamily: "inherit",
} as const;

const tableHeader = {
  borderBottom: "1px solid #ece5dd",
  textAlign: "left" as const,
  color: "#6b5744",
  fontSize: 14,
};

const cell = { padding: "16px 8px", color: "#6b5744" } as const;

const iconButton = {
  padding: 8,
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
} as const;

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const modal = {
  background: "white",
  width: "100%",
  maxWidth: 600,
  borderRadius: 16,
  padding: 32,
  maxHeight: "90vh",
  overflowY: "auto" as const,
};

