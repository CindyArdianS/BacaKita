"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Image from "next/image";
import { ArrowRight, Star, Crown, BookOpen, Users, Award, Search } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import { supabase } from "@/lib/supabase";
import styles from "./home.module.css";

type DbBook = {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  cover?: string | null;
  price?: number | null;
  harga?: number | null;
  rating?: number | null;
  badge?: string | null;
  genre?: string | null;
  category?: string | null;
  created_at: string;
};

export default function HomePage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dbBooks, setDbBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    if (!authLoading && session) {
      router.push("/dashboard");
    }
  }, [session, authLoading, router]);

  useEffect(() => {
    async function fetchPublicBooks() {
      setLoadingBooks(true);
      try {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .not("pdf_url", "is", null)
          .order("created_at", { ascending: false });

        if (!error && data) {
          const adminUploadedBooks = data.filter((b: DbBook) => b.pdf_url && b.pdf_url.trim() !== "");
          const normalized = adminUploadedBooks.map((b: DbBook) => {
            const numPrice = b.harga ?? b.price ?? 0;
            return {
              id: b.id,
              title: b.title,
              author: b.author,
              cover: b.cover || b.cover_url || "",
              badge: b.badge || undefined,
              genre: b.category || b.genre || "Lainnya",
              rating: b.rating ?? 0,
              price: numPrice === 0 ? "Gratis" : `Rp${numPrice.toLocaleString("id-ID")}`,
            };
          });
          setDbBooks(normalized);
        }
      } catch (err) {
        console.error("Error fetching books for homepage:", err);
      } finally {
        setLoadingBooks(false);
      }
    }
    fetchPublicBooks();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/katalog?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/katalog");
    }
  };

  const featuredBooks = dbBooks.slice(0, 4);
  const bestSellers = dbBooks.filter((b) => b.badge === "Best Seller");
  const displayBestSellers = bestSellers.length > 0 ? bestSellers.slice(0, 4) : dbBooks.slice(0, 4);
  const heroBooks = dbBooks.slice(0, 3);

  return (
    <div className={styles.page}>
      <PublicNavbar />

      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>✨ Platform Buku Digital #1 Indonesia</span>
          <h1 className={styles.heroTitle}>
            Temukan Ribuan
            <br />
            <span className={styles.heroAccent}>Buku Favoritmu</span>
          </h1>
          <p className={styles.heroDesc}>
            Baca novel, komik, self improvement, bisnis hingga teknologi
            kapan saja dan di mana saja. Lebih dari 10.000 judul tersedia.
          </p>

          <form className={styles.heroSearch} onSubmit={handleSearch}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Cari judul buku, penulis, atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Cari</button>
          </form>

          <div className={styles.heroActions}>
            <button className={styles.heroCta} onClick={() => router.push("/katalog")}>
              Jelajahi Katalog
              <ArrowRight size={18} />
            </button>
            {!session && (
              <button className={styles.heroSecondary} onClick={() => router.push("/register")}>
                Daftar Gratis
              </button>
            )}
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroBooks}>
            {heroBooks.map((book, i) => (
              <div
                key={book.id}
                className={styles.heroBookCard}
                style={{ transform: i === 1 ? "translateY(-20px)" : "translateY(0)" }}
                onClick={() => router.push(`/buku/${book.id}`)}
              >
                {book.cover ? (
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    sizes="120px"
                    style={{ objectFit: "cover" }}
                    priority={i === 0}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#f0ece4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📖</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className={styles.stats}>
        <div className={styles.statItem}>
          <BookOpen size={28} className={styles.statIcon} />
          <strong>10.000+</strong>
          <span>Judul Buku</span>
        </div>
        <div className={styles.statItem}>
          <Users size={28} className={styles.statIcon} />
          <strong>500.000+</strong>
          <span>Pembaca Aktif</span>
        </div>
        <div className={styles.statItem}>
          <Award size={28} className={styles.statIcon} />
          <strong>100+</strong>
          <span>Genre Tersedia</span>
        </div>
        <div className={styles.statItem}>
          <Crown size={28} className={styles.statIcon} />
          <strong>Premium</strong>
          <span>Konten Eksklusif</span>
        </div>
      </section>

      {/* ===== BUKU POPULER ===== */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Buku Populer</h2>
            <p>Pilihan terbaik yang paling banyak dibaca</p>
          </div>
          <button className={styles.seeAll} onClick={() => router.push("/katalog")}>
            Lihat Semua <ArrowRight size={16} />
          </button>
        </div>
        {loadingBooks ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#9e8268" }}>Memuat buku...</div>
        ) : featuredBooks.length > 0 ? (
          <div className={styles.bookGrid}>
            {featuredBooks.map((book) => (
              <div
                key={book.id}
                className={styles.bookCard}
                onClick={() => router.push(`/buku/${book.id}`)}
              >
                <div className={styles.bookCoverWrap}>
                  {book.badge && <span className={styles.bookBadge}>{book.badge}</span>}
                  {book.cover ? (
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="(max-width:768px) 50vw, 220px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#f0ece4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📖</div>
                  )}
                </div>
                <div className={styles.bookInfo}>
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  <div className={styles.bookMeta}>
                    <span className={styles.rating}>
                      <Star size={13} fill="#FDBA12" color="#FDBA12" />
                      {book.rating}
                    </span>
                    <span className={styles.genre}>{book.genre}</span>
                  </div>
                  <strong>{book.price}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#9e8268" }}>Belum ada buku yang diunggah.</div>
        )}
      </section>

      {/* ===== BEST SELLER ===== */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Best Seller 🔥</h2>
            <p>Buku-buku paling laris minggu ini</p>
          </div>
          <button className={styles.seeAll} onClick={() => router.push("/katalog?badge=Best+Seller")}>
            Lihat Semua <ArrowRight size={16} />
          </button>
        </div>
        {loadingBooks ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#9e8268" }}>Memuat buku...</div>
        ) : displayBestSellers.length > 0 ? (
          <div className={styles.bookGrid}>
            {displayBestSellers.map((book) => (
              <div
                key={book.id}
                className={styles.bookCard}
                onClick={() => router.push(`/buku/${book.id}`)}
              >
                <div className={styles.bookCoverWrap}>
                  {book.badge && <span className={styles.bookBadge}>{book.badge}</span>}
                  {book.cover ? (
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="(max-width:768px) 50vw, 220px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#f0ece4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📖</div>
                  )}
                </div>
                <div className={styles.bookInfo}>
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  <div className={styles.bookMeta}>
                    <span className={styles.rating}>
                      <Star size={13} fill="#FDBA12" color="#FDBA12" />
                      {book.rating}
                    </span>
                    <span className={styles.genre}>{book.genre}</span>
                  </div>
                  <strong>{book.price}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#9e8268" }}>Belum ada buku yang diunggah.</div>
        )}
      </section>

      {/* ===== CTA PREMIUM ===== */}
      <section className={styles.premiumCta}>
        <div className={styles.premiumCtaContent}>
          <Crown size={40} className={styles.premiumIcon} />
          <h2>Nikmati Akses Premium Tanpa Batas</h2>
          <p>
            Baca semua buku premium, download untuk dibaca offline, dan dapatkan
            rekomendasi personal. Mulai hanya Rp49.000/bulan.
          </p>
          <button
            className={styles.premiumBtn}
            onClick={() => router.push(session ? "/subscription" : "/login?redirect=/subscription")}
          >
            {session ? "Mulai Berlangganan" : "Coba Gratis 7 Hari"} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <h3>BacaKita</h3>
            <p>Platform buku digital terlengkap di Indonesia. Baca kapan saja, di mana saja.</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <h4>Navigasi</h4>
              <button onClick={() => router.push("/")}>Beranda</button>
              <button onClick={() => router.push("/katalog")}>Katalog</button>
              <button onClick={() => router.push("/tentang")}>Tentang Kami</button>
            </div>
            <div>
              <h4>Akun</h4>
              <button onClick={() => router.push("/login")}>Login</button>
              <button onClick={() => router.push("/register")}>Daftar</button>
              <button onClick={() => router.push(session ? "/subscription" : "/login?redirect=/subscription")}>Langganan</button>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2025 BacaKita. Semua hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}