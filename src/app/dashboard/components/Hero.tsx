"use client";

import styles from "../dashboard.module.css";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className={styles.heroBanner}>
      <div className={styles.heroContent}>
        <span className={styles.heroBadge}>
          ✨ Premium Collection
        </span>

        <h1>
          Temukan Ribuan
          <br />
          Buku Favoritmu
        </h1>

        <p>
          Baca novel, komik, self improvement,
          bisnis hingga teknologi kapan saja
          dengan pengalaman membaca terbaik.
        </p>

        <button className={styles.heroBtn}>
          Mulai Membaca
          <ArrowRight size={18}/>
        </button>
      </div>

      <div className={styles.heroBooks}>
        <Image
          src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"
          alt="Buku 1"
          width={160}
          height={240}
          priority
          style={{ objectFit: "cover", borderRadius: "16px" }}
        />
        <Image
          src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400"
          alt="Buku 2"
          width={160}
          height={240}
          style={{ objectFit: "cover", borderRadius: "16px" }}
        />
        <Image
          src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400"
          alt="Buku 3"
          width={160}
          height={240}
          style={{ objectFit: "cover", borderRadius: "16px" }}
        />
      </div>
    </section>
  );
}