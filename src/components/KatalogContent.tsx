"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import { books, genres, Book } from "@/lib/data/books";
import styles from "@/app/katalog/katalog.module.css";

const BADGES = ["Semua", "Best Seller", "Editor's Pick", "Populer", "New"];
const SORTS = [
  { label: "Relevansi", value: "default" },
  { label: "Rating Tertinggi", value: "rating" },
  { label: "Harga Termurah", value: "price_asc" },
  { label: "Harga Termahal", value: "price_desc" },
  { label: "Terbaru", value: "newest" },
];
const BOOKS_PER_PAGE = 8;

export default function KatalogContent({ hideNavbar = false }: { hideNavbar?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [inputVal, setInputVal] = useState(searchParams.get("q") ?? "");
  const [genre, setGenre] = useState("Semua");
  const [badge, setBadge] = useState(searchParams.get("badge") ?? "Semua");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  // Sync URL params
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const b = searchParams.get("badge") ?? "Semua";
    // eslint-disable-next-line
    setQuery(q);
    // eslint-disable-next-line
    setInputVal(q);
    // eslint-disable-next-line
    setBadge(b);
    // eslint-disable-next-line
    setPage(1);
  }, [searchParams]);

  const filtered = useMemo<Book[]>(() => {
    let result = [...books];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    if (genre !== "Semua") {
      result = result.filter((b) => b.genre === genre);
    }

    if (badge !== "Semua") {
      result = result.filter((b) => b.badge === badge);
    }

    switch (sort) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "price_asc":
        result.sort((a, b) => a.priceNum - b.priceNum);
        break;
      case "price_desc":
        result.sort((a, b) => b.priceNum - a.priceNum);
        break;
      case "newest":
        result.sort((a, b) => b.year - a.year);
        break;
    }

    return result;
  }, [query, genre, badge, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / BOOKS_PER_PAGE));
  const pageBooks = filtered.slice((page - 1) * BOOKS_PER_PAGE, page * BOOKS_PER_PAGE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputVal);
    setPage(1);
  };

  const handleReset = () => {
    setQuery("");
    setInputVal("");
    setGenre("Semua");
    setBadge("Semua");
    setSort("default");
    setPage(1);
    router.push("/katalog");
  };

  const hasFilters = query || genre !== "Semua" || badge !== "Semua" || sort !== "default";

  return (
    <div className={styles.page}>
      {!hideNavbar && <PublicNavbar />}

      {/* PAGE HEADER */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Katalog Buku</h1>
          <p>Temukan buku favoritmu dari {books.length}+ judul pilihan</p>
        </div>

        {/* SEARCH BAR */}
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari judul atau penulis..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          {inputVal && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => { setInputVal(""); setQuery(""); setPage(1); }}
            >
              <X size={16} />
            </button>
          )}
          <button type="submit" className={styles.searchBtn}>Cari</button>
        </form>
      </section>

      <div className={styles.body}>
        {/* SIDEBAR FILTER */}
        <aside className={`${styles.sidebar} ${filterOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarHeader}>
            <h3><SlidersHorizontal size={16} /> Filter</h3>
            {hasFilters && (
              <button className={styles.resetBtn} onClick={handleReset}>Reset</button>
            )}
          </div>

          <div className={styles.filterSection}>
            <h4>Genre</h4>
            <div className={styles.filterChips}>
              {genres.map((g) => (
                <button
                  key={g}
                  className={`${styles.chip} ${genre === g ? styles.chipActive : ""}`}
                  onClick={() => { setGenre(g); setPage(1); }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Badge</h4>
            <div className={styles.filterChips}>
              {BADGES.map((b) => (
                <button
                  key={b}
                  className={`${styles.chip} ${badge === b ? styles.chipActive : ""}`}
                  onClick={() => { setBadge(b); setPage(1); }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Urutkan</h4>
            <div className={styles.sortList}>
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  className={`${styles.sortItem} ${sort === s.value ? styles.sortActive : ""}`}
                  onClick={() => { setSort(s.value); setPage(1); }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* OVERLAY */}
        {filterOpen && (
          <div className={styles.overlay} onClick={() => setFilterOpen(false)} />
        )}

        {/* MAIN */}
        <main className={styles.main}>
          {/* TOOLBAR */}
          <div className={styles.toolbar}>
            <span className={styles.resultCount}>
              <strong>{filtered.length}</strong> buku ditemukan
              {query && <> untuk &ldquo;<em>{query}</em>&rdquo;</>}
            </span>
            <button className={styles.filterToggle} onClick={() => setFilterOpen(true)}>
              <Filter size={16} /> Filter
            </button>
          </div>

          {/* GRID */}
          {pageBooks.length > 0 ? (
            <div className={styles.bookGrid}>
              {pageBooks.map((book) => (
                <div
                  key={book.id}
                  className={styles.bookCard}
                  onClick={() => router.push(`/buku/${book.id}`)}
                >
                  <div className={styles.coverWrap}>
                    {book.badge && <span className={styles.badge}>{book.badge}</span>}
                    {book.isPremium && <span className={styles.premiumBadge}>👑 Premium</span>}
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      sizes="(max-width:768px) 50vw, 220px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.bookInfo}>
                    <h3>{book.title}</h3>
                    <p className={styles.author}>{book.author}</p>
                    <div className={styles.metaRow}>
                      <span className={styles.rating}>
                        <Star size={12} fill="#FDBA12" color="#FDBA12" />
                        {book.rating}
                        <span className={styles.reviews}>({book.reviewCount})</span>
                      </span>
                      <span className={styles.genreTag}>{book.genre}</span>
                    </div>
                    <div className={styles.priceRow}>
                      {book.oldPrice && <span className={styles.oldPrice}>{book.oldPrice}</span>}
                      <strong className={styles.price}>{book.price}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📚</div>
              <h3>Buku Tidak Ditemukan</h3>
              <p>Coba ubah kata kunci atau filter pencarianmu.</p>
              <button className={styles.emptyReset} onClick={handleReset}>
                Hapus Filter
              </button>
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
