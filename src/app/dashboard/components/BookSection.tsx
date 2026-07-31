"use client";

import styles from "../dashboard.module.css";
import BookCard from "./BookCard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DbBook = {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  price: number;
  old_price?: number;
  rating: number;
  review_count: number;
  badge?: string;
  genre: string;
  is_premium: boolean;
  publish_year: number;
  created_at: string;
  cover?: string | null;
  category?: string | null;
  harga?: number | null;
};

function normalizeBook(book: DbBook) {
  return {
    ...book,
    cover_url: book.cover || book.cover_url || "",
    genre: book.category || book.genre || "Lainnya",
    price: book.harga ?? book.price ?? 0,
    rating: book.rating ?? 0,
  };
}

export default function BookSection() {
  const router = useRouter();
  const [bestSellers, setBestSellers] = useState<DbBook[]>([]);
  const [newBooks, setNewBooks] = useState<DbBook[]>([]);
  const [recommended, setRecommended] = useState<DbBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      console.log("START Dashboard User fetch books");
      try {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .not("pdf_url", "is", null)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const adminUploadedBooks = (data || []).filter((b: any) => b.pdf_url && b.pdf_url.trim() !== "");
        const books = adminUploadedBooks.map((book) => normalizeBook(book as DbBook));
        console.log("SUCCESS Dashboard User fetch books", { count: books.length, books });
        setBestSellers(books.filter((book) => book.badge === "Best Seller").slice(0, 6));
        // created_at adalah sumber kebenaran untuk buku baru. publish_year
        // adalah metadata lama dan tidak diisi oleh form upload PDF.
        setNewBooks(books.slice(0, 6));
        setRecommended(books.filter((book) => book.rating >= 4.9).slice(0, 6));
      } catch (fetchError) {
        const supabaseError = fetchError as { code?: string; message?: string; details?: string; hint?: string };
        console.error("FAILED Dashboard User fetch books", {
          code: supabaseError?.code ?? "UNKNOWN",
          message: supabaseError?.message ?? String(fetchError),
          details: supabaseError?.details ?? null,
          hint: supabaseError?.hint ?? null,
        });
        setBestSellers([]);
        setNewBooks([]);
        setRecommended([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "#9e8268" }}>
        <p>Memuat buku...</p>
      </div>
    );
  }

  return (
    <>
      {/* BEST SELLER */}
      {bestSellers.length > 0 && (
        <section className={styles.bookSection}>
          <div className={styles.sectionHeader}>
            <h2>🏆 Best Seller</h2>
            <button onClick={() => router.push("/dashboard/katalog")}>Lihat Semua</button>
          </div>
          <div className={styles.horizontalScroll}>
            {bestSellers.map((book) => (
              <div key={book.id} className={styles.scrollCardWrapper}>
                <BookCard {...book} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BUKU BARU */}
      {newBooks.length > 0 && (
        <section className={styles.bookSection}>
          <div className={styles.sectionHeader}>
            <h2>✨ Buku Baru</h2>
            <button onClick={() => router.push("/dashboard/katalog")}>Lihat Semua</button>
          </div>
          <div className={styles.horizontalScroll}>
            {newBooks.map((book) => (
              <div key={book.id} className={styles.scrollCardWrapper}>
                <BookCard {...book} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* REKOMENDASI */}
      {recommended.length > 0 && (
        <section className={styles.bookSection}>
          <div className={styles.sectionHeader}>
            <h2>⭐ Rekomendasi Untukmu</h2>
            <button onClick={() => router.push("/dashboard/katalog")}>Lihat Semua</button>
          </div>
          <div className={styles.bookGrid}>
            {recommended.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
