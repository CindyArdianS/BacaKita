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
  cover: string;
  price: string;
  oldPrice?: string;
  rating: number;
  badge?: string;
};

export default function BookCard({
  id,
  title,
  author,
  cover,
  price,
  oldPrice,
  rating,
  badge,
}: Props) {
  const { session } = useAuth();
  const router = useRouter();

  const handleBuy = () => {
    if (!session) {
      router.push("/login");
    } else {
      router.push(`/buku/${id}`);
    }
  };

  return (
    <div className={styles.bookCard} onClick={() => router.push(`/buku/${id}`)} style={{ cursor: "pointer" }}>

      <div className={styles.coverWrapper}>

        {badge && (
          <span className={styles.badge}>
            {badge}
          </span>
        )}

        <button className={styles.favoriteBtn}>
          <Heart size={18} />
        </button>

        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 220px"
          className={styles.bookCover}
          style={{ objectFit: "cover" }}
        />

      </div>

      <div className={styles.bookContent}>

        <h3>{title}</h3>

        <p>{author}</p>

        <div className={styles.ratingRow}>

          <span>
            <Star
              size={15}
              fill="#FDBA12"
              color="#FDBA12"
            />

            {rating}
          </span>

        </div>

        <div className={styles.priceRow}>

          {oldPrice && (
            <small>{oldPrice}</small>
          )}

          <strong>{price}</strong>

        </div>

        <button 
          className={styles.buyButton} 
          onClick={(e) => {
            e.stopPropagation();
            handleBuy();
          }}
        >
          <ShoppingCart size={18} />
          Beli Buku
        </button>

      </div>
    </div>
  );
}