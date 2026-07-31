"use client";

import styles from "../dashboard.module.css";
import BookCard from "./BookCard";
import { useRouter } from "next/navigation";
import { books } from "@/lib/data/books";

export default function BookSection() {
  const router = useRouter();

  const bestSellers = books.filter((b) => b.badge === "Best Seller");
  const newBooks = [...books].sort((a, b) => b.year - a.year).slice(0, 6);
  const recommended = books.filter((b) => b.rating >= 4.9).slice(0, 6);

  return (
    <>
      {/* BEST SELLER */}
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

      {/* BUKU BARU */}
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

      {/* REKOMENDASI */}
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
    </>
  );
}