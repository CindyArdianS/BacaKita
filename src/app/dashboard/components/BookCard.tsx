"use client";

import { Heart, Star, ShoppingCart } from "lucide-react";
import styles from "../dashboard.module.css";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Props = {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  price: number;
  old_price?: number;
  rating: number;
  badge?: string;
};

export default function BookCard({ id, title, author, cover_url, price, old_price, rating, badge }: Props) {
  const { session } = useAuth();
  const router = useRouter();

  const formatPrice = (p: number) => p === 0 ? "Gratis" : `Rp${p.toLocaleString("id-ID")}`;

  return (
    <div className={styles.bookCard} onClick={() => router.push(`/buku/${id}`)} style={{ cursor: "pointer" }}>
      <div className={styles.coverWrapper}>
        {badge && <span className={styles.badge}>{badge}</span>}
        <button className={styles.favoriteBtn}>
          <Heart size={18} />
        </button>
        {cover_url ? (
          <Image
            src={cover_url}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className={styles.bookCover}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#f0ece4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📖</div>
        )}
      </div>

      <div className={styles.bookContent}>
        <h3>{title}</h3>
        <p>{author}</p>
        <div className={styles.ratingRow}>
          <span>
            <Star size={15} fill="#FDBA12" color="#FDBA12" />
            {rating}
          </span>
        </div>
        <div className={styles.priceRow}>
          {old_price && <small>{formatPrice(old_price)}</small>}
          <strong>{formatPrice(price)}</strong>
        </div>
        <button
          className={styles.buyButton}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/buku/${id}`);
          }}
        >
          <ShoppingCart size={18} />
          Beli Buku
        </button>
      </div>
    </div>
  );
}