"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, X, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { books } from "@/lib/data/books";
import { useToast } from "@/lib/useToast";
import Toast from "@/components/Toast";
import styles from "./baca.module.css";

export default function ReaderPage() {
  const { session, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();

  const book = books.find((b) => b.id === params.id);

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    if (!authLoading && !session) {
      router.push(`/login?redirect=/baca/${params.id}`);
      return;
    }

    if (session) {
      checkAccessAndProgress();
    }
  }, [session, authLoading, router, params.id]);

  async function checkAccessAndProgress() {
    setLoading(true);
    
    // 1. Cek apakah user sedang berlangganan aktif
    let isSubscribed = false;
    
    // Ambil data user dari database untuk memastikan status langganan terbaru
    const { data: userProfile } = await supabase
      .from("users")
      .select("is_subscribed, subscription_expiry")
      .eq("id", session?.user.id)
      .single();
      
    if (userProfile?.is_subscribed) {
      // Pastikan belum expired
      if (!userProfile.subscription_expiry || new Date(userProfile.subscription_expiry) > new Date()) {
        isSubscribed = true;
      }
    }

    // 2. Check if user owns the book in library
    const { data: ownedBook } = await supabase
      .from("library")
      .select("id")
      .eq("user_id", session?.user.id)
      .eq("book_id", params.id)
      .single();

    // User punya akses JIKA mereka beli buku ini ATAU mereka langganan aktif
    if (ownedBook || isSubscribed) {
      setHasAccess(true);
    } else {
      setHasAccess(false);
      router.push(`/buku/${params.id}?error=unauthorized`);
      return;
    }

    // Load progress
    const { data: progressData } = await supabase
      .from("reading_progress")
      .select("last_chapter")
      .eq("user_id", session?.user.id)
      .eq("book_id", params.id)
      .single();

    if (progressData) {
      setCurrentChapterIndex(progressData.last_chapter || 0);
    }

    setLoading(false);
  };

  const saveProgress = async (newIndex: number) => {
    if (!session) return;
    
    // Calculate percentage
    const totalChapters = book?.chapters?.length || 1;
    const percentage = Math.round(((newIndex + 1) / totalChapters) * 100);

    const { data: existing } = await supabase
      .from("reading_progress")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("book_id", params.id)
      .single();

    if (existing) {
      await supabase
        .from("reading_progress")
        .update({ last_chapter: newIndex, progress_percentage: percentage })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("reading_progress")
        .insert({
          user_id: session.user.id,
          book_id: params.id,
          last_chapter: newIndex,
          progress_percentage: percentage
        });
    }
  };

  const handleNextChapter = () => {
    if (!book || !book.chapters) return;
    if (currentChapterIndex < book.chapters.length - 1) {
      const nextIndex = currentChapterIndex + 1;
      
      setCurrentChapterIndex(nextIndex);
      saveProgress(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      const prevIndex = currentChapterIndex - 1;
      setCurrentChapterIndex(prevIndex);
      saveProgress(prevIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (authLoading || loading) {
    return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Memuat e-reader...</div>;
  }

  if (!book) {
    return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Buku tidak ditemukan.</div>;
  }

  const currentChapter = book.chapters?.[currentChapterIndex];

  return (
    <div className={styles.readerContainer}>
      <Toast toasts={toasts} onRemove={removeToast} />
      {/* Top Navbar */}
      <header className={styles.readerHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.iconBtn} onClick={() => router.push(`/buku/${book.id}`)}>
            <ArrowLeft size={20} />
          </button>
          <div className={styles.bookTitleInfo}>
            <h1>{book.title}</h1>
            <span className={styles.authorName}>{book.author}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={20} /> Daftar Isi
          </button>
        </div>
      </header>

      {/* Sidebar Daftar Isi */}
      <div className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarActive : ""}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarActive : ""}`}>
        <div className={styles.sidebarHeader}>
          <h2>Daftar Isi</h2>
          <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className={styles.chapterList}>
          {book.chapters?.map((ch, idx) => (
            <button 
              key={idx} 
              className={`${styles.chapterBtn} ${idx === currentChapterIndex ? styles.chapterActive : ""}`}
              onClick={() => {
                setCurrentChapterIndex(idx);
                saveProgress(idx);
                setSidebarOpen(false);
              }}
            >
              {ch.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Reader Content */}
      <main className={styles.readerMain}>
        <div className={styles.readerPaper}>
          <h2 className={styles.chapterTitle}>{currentChapter?.title}</h2>
          
          <div className={styles.textContent}>
            <p>
              Ini adalah teks percobaan untuk mensimulasikan konten dari <strong>{currentChapter?.title}</strong> pada buku <strong>{book.title}</strong>. 
              Dalam implementasi nyata, konten ini akan dimuat dari database atau media penyimpanan (Storage) yang berisi naskah asli buku berformat HTML, Markdown, atau ePub.
            </p>
            <p>
              Membaca buku secara digital memberikan banyak keuntungan. Pengguna dapat mengubah ukuran teks, mengubah warna latar belakang untuk kenyamanan mata, serta membaca di mana saja melalui perangkat seluler mereka.
            </p>
            <p>
              Fitur E-Reader pada BacaKita ini dirancang agar ringan dan bersih dari gangguan (distraction-free). Saat membaca, fokus pembaca murni tertuju pada teks cerita atau materi yang sedang dibahas oleh penulis.
            </p>
            <p>
              (Teks berlanjut... Bayangkan ini adalah halaman-halaman panjang yang menceritakan esensi luar biasa dari bab ini secara utuh dan memikat, menahan perhatian pembaca hingga kalimat terakhir.)
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className={styles.navigationControls}>
          <button 
            className={styles.navBtn} 
            disabled={currentChapterIndex === 0}
            onClick={handlePrevChapter}
          >
            <ChevronLeft size={20} /> Bab Sebelumnya
          </button>
          
          <span className={styles.progressText}>
            Bab {currentChapterIndex + 1} dari {book.chapters?.length}
          </span>
          
          <button 
            className={styles.navBtn}
            disabled={currentChapterIndex === (book.chapters?.length || 1) - 1}
            onClick={handleNextChapter}
          >
            Bab Selanjutnya <ChevronRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}
