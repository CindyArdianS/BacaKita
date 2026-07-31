"use client";

import { useState, useEffect } from "react";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Star, BookOpen, Calendar, Users, FileText, ShoppingCart, BookMarked, ArrowLeft, Crown, Check } from "lucide-react";
import AuthNavbar from "@/components/AuthNavbar";
import { supabase } from "@/lib/supabase";
import { books } from "@/lib/data/books";
import { useAuth } from "@/lib/AuthContext";
import { addToCart, isBookInCart, isBookOwned } from "@/lib/cartUtils";
import styles from "./buku.module.css";

// Simple toast state
let globalToastFn: ((msg: string, type?: "success" | "error" | "info") => void) | null = null;

function Toast({ message, type, visible }: { message: string; type: string; visible: boolean }) {
  const bgColor = type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#3b82f6";
  return (
    <div style={{
      position: "fixed", bottom: "90px", left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      backgroundColor: bgColor, color: "white", padding: "12px 24px", borderRadius: "12px",
      fontWeight: "600", fontSize: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      zIndex: 9999, opacity: visible ? 1 : 0, transition: "all 0.3s ease", whiteSpace: "nowrap"
    }}>
      {message}
    </div>
  );
}

export default function BookDetailPage() {
  const { session, userData } = useAuth();
  const params = useParams();
  const router = useRouter();
  const book = books.find((b) => b.id === params.id);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string; visible: boolean }>({ message: "", type: "success", visible: false });
  const [reviews, setReviews] = useState<any[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myExistingReview, setMyExistingReview] = useState<any>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  useEffect(() => {
    if (book) {
      loadReviews();
    }
    if (session && book) {
      checkStatus();
    }
    
    // Check for error in URL (redirected from reader)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("error") === "unauthorized") {
        showToast("Anda harus berlangganan atau membeli buku ini untuk membaca.", "error");
        window.history.replaceState({}, '', `/buku/${params.id}`);
      }
    }
  }, [session, book]);

  async function loadReviews() {
    if (!book) return;
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user_id, users(nama, email)")
      .eq("book_id", book.id)
      .order("created_at", { ascending: false });
    if (data) {
      setReviews(data);
      // Check if current user already reviewed
      if (session) {
        const mine = data.find((r: any) => r.user_id === session.user.id);
        if (mine) {
          setMyExistingReview(mine);
          setMyRating(mine.rating);
          setMyComment(mine.comment);
        }
      }
    }
  }

  async function checkStatus() {
    if (!session || !book) return;

    const [owned, inCart] = await Promise.all([
      isBookOwned(session.user.id, book.id),
      isBookInCart(session.user.id, book.id)
    ]);
    setIsOwned(owned);
    setIsInCart(inCart);
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { router.push("/login"); return; }
    if (myRating === 0) { showToast("Pilih rating bintang dulu!", "error"); return; }

    setSubmittingReview(true);
    try {
      if (myExistingReview) {
        // Update existing
        const { error } = await supabase
          .from("reviews")
          .update({ rating: myRating, comment: myComment })
          .eq("id", myExistingReview.id);
        if (error) throw error;
        showToast("Ulasan berhasil diperbarui!", "success");
      } else {
        // Insert new
        const { error } = await supabase
          .from("reviews")
          .insert({ book_id: book?.id, user_id: session.user.id, rating: myRating, comment: myComment });
        if (error) throw error;
        showToast("Ulasan berhasil dikirim! Terima kasih 🎉", "success");
      }
      await loadReviews();
    } catch (err: any) {
      showToast(err.message || "Gagal mengirim ulasan.", "error");
    }
    setSubmittingReview(false);
  }

  if (!book) {
    return (
      <div className={styles.page}>
        <AuthNavbar />
        <div className={styles.notFound}>
          <span>📚</span>
          <h2>Buku Tidak Ditemukan</h2>
          <p>Buku yang kamu cari tidak ada di katalog kami.</p>
          <button onClick={() => router.push("/katalog")}>← Kembali ke Katalog</button>
        </div>
      </div>
    );
  }

  const related = books.filter((b) => b.genre === book.genre && b.id !== book.id).slice(0, 4);

  const handleAddToCart = async () => {
    if (!session) {
      router.push(`/login?redirect=/buku/${book.id}`);
      return;
    }
    if (isInCart) {
      router.push("/cart");
      return;
    }
    setLoadingAction(true);
    const result = await addToCart(session.user.id, book.id);
    setLoadingAction(false);
    if (result === "added") {
      setIsInCart(true);
      showToast("Buku berhasil ditambahkan ke keranjang!", "success");
    } else if (result === "exists") {
      setIsInCart(true);
      showToast("Buku sudah ada di keranjang.", "info");
    } else if (result === "db_missing") {
      showToast("Database belum disiapkan. Jalankan shopee_cart.sql di Supabase!", "error");
    } else {
      showToast("Gagal menambahkan. Cek konsol browser untuk detail error.", "error");
    }
  };

  const handleBuyNow = () => {
    if (!session) {
      router.push(`/login?redirect=/buku/${book.id}`);
      return;
    }
    router.push(`/checkout/direct/${book.id}`);
  };

  const handleRead = () => {
    if (!session) {
      router.push(`/login?redirect=/baca/${book.id}`);
      return;
    }
    
    // Check access before routing to reader
    let isSubscribed = false;
    if (userData?.is_subscribed) {
      if (!userData.subscription_expiry || new Date(userData.subscription_expiry) > new Date()) {
        isSubscribed = true;
      }
    }
    
    if (!isOwned && !isSubscribed) {
      showToast("Anda harus berlangganan atau membeli buku ini untuk membaca.", "error");
      return;
    }

    router.push(`/baca/${book.id}`);
  };

  return (
    <div className={styles.page}>
      <AuthNavbar />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      <div className={styles.container}>
        {/* BREADCRUMB */}
        <nav className={styles.breadcrumb}>
          <button onClick={() => router.push("/")}>Beranda</button>
          <span>/</span>
          <button onClick={() => router.push("/katalog")}>Katalog</button>
          <span>/</span>
          <span>{book.title}</span>
        </nav>

        {/* MAIN DETAIL */}
        <div className={styles.detail}>
          {/* LEFT — Cover */}
          <div className={styles.coverSection}>
            <div className={styles.coverWrap}>
              {book.badge && <span className={styles.badge}>{book.badge}</span>}
              {book.isPremium && (
                <span className={styles.premiumBadge}>
                  <Crown size={12} /> Premium
                </span>
              )}
              <Image
                src={book.cover}
                alt={book.title}
                fill
                sizes="(max-width:768px) 100vw, 340px"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>

            {/* RATING BIG */}
            <div className={styles.ratingBox}>
              <div className={styles.ratingScore}>
                <Star size={20} fill="#FDBA12" color="#FDBA12" />
                <strong>{book.rating}</strong>
                <span>/ 5.0</span>
              </div>
              <p>{book.reviewCount.toLocaleString("id-ID")} ulasan</p>
            </div>
          </div>

          {/* RIGHT — Info */}
          <div className={styles.infoSection}>
            <span className={styles.genreTag}>{book.genre}</span>
            <h1 className={styles.title}>{book.title}</h1>
            <p className={styles.author}>oleh <strong>{book.author}</strong></p>

            {/* STATS ROW */}
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <FileText size={16} />
                <span>{book.pages} halaman</span>
              </div>
              <div className={styles.stat}>
                <Calendar size={16} />
                <span>{book.year}</span>
              </div>
              <div className={styles.stat}>
                <Users size={16} />
                <span>{book.publisher}</span>
              </div>
              <div className={styles.stat}>
                <BookOpen size={16} />
                <span>{book.chapters.length} bab</span>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className={styles.desc}>
              <h2>Sinopsis</h2>
              <p>{book.description}</p>
            </div>

            {/* PRICE & CTA */}
            <div className={styles.priceSection}>
              {book.oldPrice && (
                <span className={styles.oldPrice}>{book.oldPrice}</span>
              )}
              <span className={styles.price}>{book.price}</span>
            </div>

            <div className={styles.ctaRow}>
              {isOwned ? (
                <button className={styles.buyBtn} style={{ opacity: 0.8, cursor: "default", backgroundColor: "#22c55e", color: "white", borderColor: "#22c55e" }}>
                  <Check size={18} /> Sudah Dimiliki
                </button>
              ) : (
                <>
                  <button
                    className={`${styles.buyBtn} ${isInCart ? styles.buyBtnInCart : ""}`}
                    disabled={loadingAction}
                    onClick={handleAddToCart}
                    id={`btn-keranjang-${book.id}`}
                  >
                    <ShoppingCart size={18} />
                    {loadingAction ? "Memproses..." : isInCart ? "Lihat Keranjang" : "Tambah Keranjang"}
                  </button>
                  <button
                    className={styles.buyBtn}
                    style={{ backgroundColor: "#1e1e1e", color: "white", border: "1px solid #1e1e1e" }}
                    disabled={loadingAction}
                    onClick={handleBuyNow}
                    id={`btn-beli-${book.id}`}
                  >
                    Beli Langsung
                  </button>
                </>
              )}
              <button
                className={styles.readBtn}
                onClick={handleRead}
                id={`btn-baca-${book.id}`}
              >
                <BookMarked size={18} />
                Baca Sekarang
              </button>
            </div>

            {book.isPremium && (
              <div className={styles.premiumNote}>
                <Crown size={14} />
                <span>Buku ini eksklusif untuk pelanggan Premium. <button onClick={() => router.push("/subscription")}>Mulai berlangganan</button></span>
              </div>
            )}
          </div>
        </div>

        {/* CHAPTERS */}
        <div className={styles.chapters}>
          <h2>Daftar Bab</h2>
          <div className={styles.chapterList}>
            {book.chapters.map((ch, i) => (
              <div key={i} className={styles.chapterItem}>
                <span className={styles.chapterNum}>{i + 1}</span>
                <span className={styles.chapterTitle}>{ch.title}</span>
                <span className={styles.chapterLock}>🔒</span>
              </div>
            ))}
          </div>
        </div>

        {/* RELATED BOOKS */}
        {related.length > 0 && (
          <div className={styles.related}>
            <h2>Buku Serupa</h2>
            <div className={styles.relatedGrid}>
              {related.map((b) => (
                <div
                  key={b.id}
                  className={styles.relatedCard}
                  onClick={() => router.push(`/buku/${b.id}`)}
                >
                  <div className={styles.relatedCover}>
                    <Image
                      src={b.cover}
                      alt={b.title}
                      fill
                      sizes="(max-width:768px) 50vw, 160px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <h3>{b.title}</h3>
                  <p>{b.author}</p>
                  <span>
                    <Star size={11} fill="#FDBA12" color="#FDBA12" />
                    {b.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS SECTION */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1108", marginBottom: 24 }}>
            ⭐ Ulasan Pembaca
          </h2>

          {/* Write Review Form */}
          {session ? (
            <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #ece5dd", marginBottom: 28 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#2d1a08" }}>
                {myExistingReview ? "Perbarui Ulasan Anda" : "Tulis Ulasan"}
              </h3>
              <form onSubmit={handleSubmitReview}>
                {/* Star Rating Picker */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMyRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, transition: "transform 0.1s" }}
                    >
                      <Star
                        size={32}
                        fill={(hoverRating || myRating) >= star ? "#FDBA12" : "none"}
                        color={(hoverRating || myRating) >= star ? "#FDBA12" : "#d1c4b0"}
                        style={{ transition: "all 0.15s" }}
                      />
                    </button>
                  ))}
                  {myRating > 0 && (
                    <span style={{ alignSelf: "center", marginLeft: 8, fontSize: 14, color: "#6b5744", fontWeight: 600 }}>
                      {["", "Buruk", "Kurang", "Cukup", "Bagus", "Luar Biasa!"][myRating]}
                    </span>
                  )}
                </div>

                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="Bagikan pengalaman membaca Anda..."
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5ddd5",
                    fontSize: 14, color: "#2d1a08", background: "#faf8f5", resize: "vertical",
                    fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12
                  }}
                />

                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{
                    background: "#7a5230", color: "white", border: "none", borderRadius: 10,
                    padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer",
                    opacity: submittingReview ? 0.7 : 1, transition: "opacity 0.2s"
                  }}
                >
                  {submittingReview ? "Mengirim..." : myExistingReview ? "Perbarui Ulasan" : "Kirim Ulasan"}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ background: "#fdf8f3", border: "1px dashed #d4b896", borderRadius: 12, padding: 20, marginBottom: 24, textAlign: "center" }}>
              <p style={{ color: "#6b5744", fontSize: 14, margin: 0 }}>
                <button onClick={() => router.push("/login")} style={{ color: "#7a5230", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
                  Masuk
                </button> untuk menulis ulasan
              </p>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9b8b7a" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
              <p>Belum ada ulasan. Jadilah yang pertama!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {reviews.map((review: any) => {
                const displayName = review.users?.nama || review.users?.email?.split("@")[0] || "Anonim";
                const initials = displayName.charAt(0).toUpperCase();
                const dateStr = new Date(review.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                return (
                  <div key={review.id} style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #ece5dd" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#7a5230", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#2d1a08", fontSize: 14 }}>{displayName}</div>
                        <div style={{ fontSize: 12, color: "#9b8b7a" }}>{dateStr}</div>
                      </div>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} fill={review.rating >= s ? "#FDBA12" : "none"} color={review.rating >= s ? "#FDBA12" : "#d1c4b0"} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p style={{ margin: 0, fontSize: 14, color: "#4a3728", lineHeight: 1.6 }}>{review.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BACK */}
        <button className={styles.backBtn} onClick={() => router.push("/katalog")}>
          <ArrowLeft size={16} />
          Kembali ke Katalog
        </button>
      </div>
    </div>
  );
}
