"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Calendar, Users, FileText, ShoppingCart, BookMarked, ArrowLeft, Crown, Edit, Check } from "lucide-react";
import AuthNavbar from "@/components/AuthNavbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { addToCart, isBookInCart, isBookOwned } from "@/lib/cartUtils";
import styles from "./buku.module.css";

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

type DbBook = {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  price: number;
  old_price?: number;
  rating: number;
  review_count: number;
  badge?: string;
  genre: string;
  pages: number;
  publisher: string;
  publish_year: number;
  description: string;
  is_premium: boolean;
  cover?: string | null;
  pdf_url?: string | null;
  category?: string | null;
  harga?: number | null;
};

export default function BookDetailPage() {
  const { session, userData } = useAuth();
  const params = useParams();
  const router = useRouter();

  const [book, setBook] = useState<DbBook | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<DbBook[]>([]);
  const [loadingBook, setLoadingBook] = useState(true);
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

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  // Fetch book from Supabase
  useEffect(() => {
    const fetchBook = async () => {
      setLoadingBook(true);
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", params.id as string)
        .single();

      if (error || !data) {
        setBook(null);
        setLoadingBook(false);
        return;
      }
      setBook(data);

      // Fetch related books (same genre)
      const { data: relData } = await supabase
        .from("books")
        .select("*")
        .eq("genre", data.genre)
        .eq("is_active", true)
        .neq("id", data.id)
        .limit(4);
      setRelatedBooks(relData || []);

      setLoadingBook(false);
    };

    fetchBook();
  }, [params.id]);

  useEffect(() => {
    if (book) {
      loadReviews();
    }
    if (session && book) {
      checkStatus();
    }

    // Check for error in URL
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
      .select("id, rating, comment, created_at, user_id, users(nama, email, avatar_url)")
      .eq("book_id", book.id)
      .order("created_at", { ascending: false });
    if (data) {
      setReviews(data);
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
        const { error } = await supabase
          .from("reviews")
          .update({ rating: myRating, comment: myComment })
          .eq("id", myExistingReview.id);
        if (error) throw error;
        showToast("Ulasan berhasil diperbarui!", "success");
      } else {
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

  const handleAddToCart = async () => {
    if (!session) { router.push(`/login?redirect=/buku/${book?.id}`); return; }
    if (isInCart) { router.push("/cart"); return; }
    setLoadingAction(true);
    const result = await addToCart(session.user.id, book!.id);
    setLoadingAction(false);
    if (result === "added") { setIsInCart(true); showToast("Buku berhasil ditambahkan ke keranjang!", "success"); }
    else if (result === "exists") { setIsInCart(true); showToast("Buku sudah ada di keranjang.", "info"); }
    else { showToast("Gagal menambahkan ke keranjang.", "error"); }
  };

  const handleBuyNow = () => {
    if (!session) { router.push(`/login?redirect=/buku/${book?.id}`); return; }
    router.push(`/checkout/direct/${book!.id}`);
  };

  const handleRead = () => {
    if (!session) { router.push(`/login?redirect=/baca/${book?.id}`); return; }
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
    router.push(`/baca/${book!.id}`);
  };

  const coverUrl = book?.cover || book?.cover_url;
  const category = book?.category || book?.genre;
  const price = book?.harga ?? book?.price ?? 0;
  const formatPrice = (amount: number) => amount === 0 ? "Gratis" : `Rp${amount.toLocaleString("id-ID")}`;

  // Loading state
  if (loadingBook) {
    return (
      <div className={styles.page}>
        <AuthNavbar />
        <div style={{ textAlign: "center", padding: "120px 0", color: "#9e8268" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <p>Memuat detail buku...</p>
        </div>
      </div>
    );
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
              {book.is_premium && (
                <span className={styles.premiumBadge}>
                  <Crown size={12} /> Premium
                </span>
              )}
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={book.title}
                  fill
                  sizes="(max-width:768px) 100vw, 340px"
                  style={{ objectFit: "cover" }}
                  priority
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "#f0ece4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>📖</div>
              )}
            </div>

            {/* RATING BIG */}
            <div className={styles.ratingBox}>
              <div className={styles.ratingScore}>
                <Star size={20} fill="#FDBA12" color="#FDBA12" />
                <strong>{book.rating}</strong>
                <span>/ 5.0</span>
              </div>
              <p>{book.review_count.toLocaleString("id-ID")} ulasan</p>
            </div>

            {userData?.role === 'admin' && (
              <button
                onClick={() => router.push(`/admin/buku?edit=${book.id}`)}
                style={{
                  width: "100%", marginTop: 12, padding: "12px", background: "#fef3c7",
                  color: "#b45309", border: "1px dashed #f59e0b", borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontWeight: 700, cursor: "pointer", fontSize: 14
                }}
              >
                <Edit size={16} /> Edit Buku (Admin)
              </button>
            )}
          </div>

          {/* RIGHT — Info */}
          <div className={styles.infoSection}>
            <span className={styles.genreTag}>{category}</span>
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
                <span>{book.publish_year}</span>
              </div>
              <div className={styles.stat}>
                <Users size={16} />
                <span>{book.publisher}</span>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className={styles.desc}>
              <h2>Sinopsis</h2>
              <p>{book.description}</p>
            </div>

            {/* PRICE & CTA */}
            <div className={styles.priceSection}>
              {book.old_price && (
                <span className={styles.oldPrice}>{formatPrice(book.old_price)}</span>
              )}
              <span className={styles.price}>{formatPrice(price)}</span>
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
                  >
                    <ShoppingCart size={18} />
                    {loadingAction ? "Memproses..." : isInCart ? "Lihat Keranjang" : "Tambah Keranjang"}
                  </button>
                  <button
                    className={styles.buyBtn}
                    style={{ backgroundColor: "#1e1e1e", color: "white", border: "1px solid #1e1e1e" }}
                    disabled={loadingAction}
                    onClick={handleBuyNow}
                  >
                    Beli Langsung
                  </button>
                </>
              )}
              <button className={styles.readBtn} onClick={handleRead}>
                <BookMarked size={18} />
                Baca Sekarang
              </button>
            </div>

            {book.is_premium && (
              <div className={styles.premiumNote}>
                <Crown size={14} />
                <span>Buku ini eksklusif untuk pelanggan Premium. <button onClick={() => router.push("/subscription")}>Mulai berlangganan</button></span>
              </div>
            )}
          </div>
        </div>

        {/* RELATED BOOKS */}
        {relatedBooks.length > 0 && (
          <div className={styles.related}>
            <h2>Buku Serupa</h2>
            <div className={styles.relatedGrid}>
              {relatedBooks.map((b) => (
                <div
                  key={b.id}
                  className={styles.relatedCard}
                  onClick={() => router.push(`/buku/${b.id}`)}
                >
                  <div className={styles.relatedCover}>
                    {b.cover_url ? (
                      <Image
                        src={b.cover_url}
                        alt={b.title}
                        fill
                        sizes="(max-width:768px) 50vw, 160px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#f0ece4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📖</div>
                    )}
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

          {session ? (
            <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #ece5dd", marginBottom: 28 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#2d1a08" }}>
                {myExistingReview ? "Perbarui Ulasan Anda" : "Tulis Ulasan"}
              </h3>
              <form onSubmit={handleSubmitReview}>
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMyRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                    >
                      <Star
                        size={32}
                        fill={(hoverRating || myRating) >= star ? "#FDBA12" : "none"}
                        color={(hoverRating || myRating) >= star ? "#FDBA12" : "#d1c4b0"}
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
                    opacity: submittingReview ? 0.7 : 1
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
                const avatarUrl = review.users?.avatar_url;
                return (
                  <div key={review.id} style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #ece5dd" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#7a5230", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt={displayName} fill style={{ objectFit: "cover" }} />
                        ) : initials}
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
