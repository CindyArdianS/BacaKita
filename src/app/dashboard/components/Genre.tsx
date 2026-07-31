"use client";

import { useState } from "react";
import styles from "../dashboard.module.css";

const genres = [
  "Semua",
  "Novel",
  "Romance",
  "Fantasi",
  "Horor",
  "Komik",
  "Teknologi",
  "Bisnis",
  "Self Improvement",
  "Sejarah",
  "Agama",
];

export default function Genre() {
  const [active, setActive] = useState("Semua");

  return (
    <section className={styles.genreSection}>
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => setActive(genre)}
          className={
            active === genre
              ? styles.genreActive
              : styles.genreItem
          }
        >
          {genre}
        </button>
      ))}
    </section>
  );
}