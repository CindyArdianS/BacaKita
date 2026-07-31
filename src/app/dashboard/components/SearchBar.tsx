"use client";

import styles from "../dashboard.module.css";
import { Search, Bell } from "lucide-react";

export default function SearchBar() {
  return (
    <section className={styles.searchSection}>
      <div className={styles.searchBox}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Cari buku, penulis, atau kategori..."
        />
      </div>

      <button className={styles.notificationBtn}>
        <Bell size={20} />
        <span className={styles.notificationDot}></span>
      </button>
    </section>
  );
}