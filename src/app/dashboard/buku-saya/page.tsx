"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, ShoppingBag, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "../dashboard.module.css";

type OwnedBook = {
  id: string;
  title: string;
  author: string;
  cover: string;
  cover_url?: string;
  price: string;
  priceNum: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  genre: string;
  pages: number;
  publisher: string;
  year: number;
  description: string;
  chapters: { title: string }[];
  purchasedAt: string;
  progressPercentage: number;
  lastChapter: number;
};

type ActiveTab = "dibeli" | "selesai";

export default function BukuSayaPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [ownedBooks, setOwnedBooks] = useState<OwnedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dibeli");

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetchMyBooks();
    }
  }, [session, authLoading, router]);

  async function fetchMyBooks() {
    setLoading(true);

    // 1. Baca dari tabel library (baru)
    const { data: libraryItems } = await supabase
      .from("library")
      .select("book_id, purchased_at")
      .eq("user_id", session?.user.id);

    // 2. Baca dari tabel owned_books (lama) sebagai fallback
    const { data: ownedBooksData } = await supabase
      .from("owned_books")
      .select("book_id, purchased_at")
      .eq("user_id", session?.user.id);

    // Gabungkan and deduplicate
    const allItems = [...(libraryItems || [])];
    const existingBookIds = new Set(allItems.map((i) => i.book_id));

    for (const ob of ownedBooksData || []) {
      if (!existingBookIds.has(ob.book_id)) {
        allItems.push(ob);
        existingBookIds.add(ob.book_id);
      }
    }

    if (allItems.length === 0) {
      setOwnedBooks([]);
      setLoading(false);
      return;
    }

    // Ambil progress membaca
    const bookIds = allItems.map((o) => o.book_id);
    const { data: progresses } = await supabase
      .from("reading_progress")
      .select("book_id, last_chapter, progress_percentage")
      .eq("user_id", session?.user.id)
      .in("book_id", bookIds);

    const progressMap: Record<string, { lastChapter: number; progressPercentage: number }> = {};
    (progresses || []).forEach((p) => {
      progressMap[p.book_id] = {
        lastChapter: p.last_chapter ?? 0,
        progressPercentage: p.progress_percentage ?? 0,
      };
    });

    let dbBooksMap = new Map<string, any>();
    if (bookIds.length > 0) {
      const { data: dbBooks } = await supabase
        .from("books")
        .select("*")
        .in("id", bookIds);

      (dbBooks || []).forEach((b) => dbBooksMap.set(b.id, b));
    }

    const enriched: OwnedBook[] = allItems
      .map((o) => {
        const b = dbBooksMap.get(o.book_id);
        if (!b) return null;
        const numPrice = b.harga ?? b.price ?? 0;
        return {
          id: b.id,
          title: b.title,
          author: b.author,
          cover: b.cover || b.cover_url || "",
          cover_url: b.cover_url || b.cover || "",
          price: numPrice === 0 ? "Gratis" : `Rp${numPrice.toLocaleString("id-ID")}`,
          priceNum: numPrice,
          rating: b.rating ?? 0,
          reviewCount: b.review_count ?? 0,
          badge: b.badge,
          genre: b.category || b.genre || "Lainnya",
          pages: b.pages ?? 0,
          publisher: b.publisher || "-",
          year: b.publish_year ?? 2024,
          description: b.description || "",
          chapters: [],
          purchasedAt: o.purchased_at,
          lastChapter: progressMap[o.book_id]?.lastChapter ?? 0,
          progressPercentage: progressMap[o.book_id]?.progressPercentage ?? 0,
        };
      })
      .filter(Boolean) as OwnedBook[];

    setOwnedBooks(enriched);
    setLoading(false);
  }

  const finishedBooks = ownedBooks.filter((b) => b.progressPercentage === 100);

  if (authLoading || loading) {
    return (
      <div className={styles.bukuSayaPage}>
        <div className={styles.bukuSayaHeader}>
          <h1>Buku Saya</h1>
          <p>Memuat koleksi buku kamu...</p>
        </div>
        <div className={styles.bukuSayaGrid}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={styles.bukuSayaCard} style={{ opacity: 0.5 }}>
              <div className={styles.bukuSayaCover} style={{ background: "#f0ece4" }} />
              <div className={styles.bukuSayaInfo}>
                <div style={{ height: 14, background: "#ede8e0", borderRadius: 6, marginBottom: 8, width: "80%" }} />
                <div style={{ height: 12, background: "#ede8e0", borderRadius: 6, marginBottom: 12, width: "50%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bukuSayaPage}>
      <div className={styles.bukuSayaHeader}>
        <h1>Buku Saya</h1>
        <p>Kelola koleksi buku dan progres bacaanmu di sini.</p>
      </div>

      <div className={styles.bukuSayaTabs}>
        <button
          className={`${styles.bukuSayaTab} ${activeTab === "dibeli" ? styles.bukuSayaTabActive : ""}`}
          onClick={() => setActiveTab("dibeli")}
        >
          <ShoppingBag size={18} />
          Buku Dibeli
          <span className={styles.tabBadge}>{ownedBooks.length}</span>
        </button>
        <button
          className={`${styles.bukuSayaTab} ${activeTab === "selesai" ? styles.bukuSayaTabActive : ""}`}
          onClick={() => setActiveTab("selesai")}
        >
          <CheckCircle2 size={18} />
          Selesai Dibaca
          <span className={styles.tabBadge}>{finishedBooks.length}</span>
        </button>
        <button
          className={styles.bukuSayaTab}
          onClick={fetchMyBooks}
          style={{ marginLeft: "auto", opacity: 0.7 }}
          title="Muat Ulang"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {activeTab === "dibeli" && (
        <>
          {ownedBooks.length === 0 ? (
            <div className={styles.emptyBukuSaya}>
              <ShoppingBag size={56} color="#c8bcae" />
              <h2>Belum Ada Buku yang Dibeli</h2>
              <p>Jelajahi katalog dan temukan buku favoritmu!</p>
              <button onClick={() => router.push("/dashboard/katalog")}>
                Jelajahi Katalog
              </button>
            </div>
          ) : (
            <div className={styles.bukuSayaGrid}>
              {ownedBooks.map((book) => (
                <div
                  key={book.id}
                  className={styles.bukuSayaCard}
                  onClick={() => router.push(`/baca/${book.id}`)}
                >
                  <div className={styles.bukuSayaCover}>
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="100px"
                      style={{ objectFit: "cover", borderRadius: "10px" }}
                    />
                    {book.progressPercentage === 100 && (
                      <div className={styles.bukuSayaFinishedBadge}>✓ Selesai</div>
                    )}
                  </div>
                  <div className={styles.bukuSayaInfo}>
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <div className={styles.bukuSayaProgressBar}>
                      <div
                        className={styles.bukuSayaProgressFill}
                        style={{ width: `${book.progressPercentage}%` }}
                      />
                    </div>
                    <span className={styles.bukuSayaProgressText}>
                      {book.progressPercentage === 0
                        ? "Belum mulai dibaca"
                        : book.progressPercentage === 100
                        ? "Selesai dibaca"
                        : `${book.progressPercentage}% — Bab ${book.lastChapter + 1}`}
                    </span>
                    <button
                      className={styles.bukuSayaReadBtn}
                      style={
                        book.progressPercentage === 100
                          ? { background: "#f3fef3", color: "#22c55e", border: "1px solid #86efac" }
                          : {}
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/baca/${book.id}`);
                      }}
                    >
                      {book.progressPercentage === 0
                        ? "Mulai Baca"
                        : book.progressPercentage === 100
                        ? "Baca Ulang"
                        : "Lanjut Baca"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "selesai" && (
        <>
          {finishedBooks.length === 0 ? (
            <div className={styles.emptyBukuSaya}>
              <BookOpen size={56} color="#c8bcae" />
              <h2>Belum Ada Buku yang Selesai Dibaca</h2>
              <p>Terus membaca dan selesaikan bukumu untuk melihatnya di sini!</p>
              <button onClick={() => setActiveTab("dibeli")}>
                Lihat Buku Dibeli
              </button>
            </div>
          ) : (
            <div className={styles.bukuSayaGrid}>
              {finishedBooks.map((book) => (
                <div
                  key={book.id}
                  className={styles.bukuSayaCard}
                  onClick={() => router.push(`/buku/${book.id}`)}
                >
                  <div className={styles.bukuSayaCover}>
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="100px"
                      style={{ objectFit: "cover", borderRadius: "10px", filter: "brightness(0.85)" }}
                    />
                    <div className={styles.bukuSayaFinishedBadge}>✓ Selesai</div>
                  </div>
                  <div className={styles.bukuSayaInfo}>
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <div className={styles.bukuSayaProgressBar}>
                      <div className={styles.bukuSayaProgressFill} style={{ width: "100%" }} />
                    </div>
                    <span className={styles.bukuSayaProgressText} style={{ color: "#22c55e" }}>
                      100% — Semua bab selesai dibaca ✓
                    </span>
                    <button
                      className={styles.bukuSayaReadBtn}
                      style={{ background: "#f3fef3", color: "#22c55e", border: "1px solid #86efac" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/baca/${book.id}`);
                      }}
                    >
                      Baca Ulang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
