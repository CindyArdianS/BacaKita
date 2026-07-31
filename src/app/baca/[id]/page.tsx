"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./baca.module.css";

type PdfBook = { id: string; title: string; author: string; pdf_url: string | null };

export default function ReaderPage() {
  const { session, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<PdfBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadReader = async () => {
      if (authLoading) return;
      if (!session) {
        router.replace(`/login?redirect=/baca/${params.id}`);
        return;
      }
      setLoading(true);
      const userId = session.user.id;
      const [profileResult, ownershipResult, bookResult] = await Promise.all([
        supabase.from("users").select("is_subscribed, subscription_expiry").eq("id", userId).maybeSingle(),
        supabase.from("library").select("id").eq("user_id", userId).eq("book_id", params.id as string).maybeSingle(),
        supabase.from("books").select("id, title, author, pdf_url").eq("id", params.id as string).maybeSingle(),
      ]);
      const profile = profileResult.data;
      const isSubscribed = Boolean(profile?.is_subscribed && (!profile.subscription_expiry || new Date(profile.subscription_expiry) > new Date()));
      if (!ownershipResult.data && !isSubscribed) {
        router.replace(`/buku/${params.id}?error=unauthorized`);
        return;
      }
      if (!bookResult.data) setMessage("Buku tidak ditemukan.");
      else if (!bookResult.data.pdf_url) setMessage("File PDF untuk buku ini belum tersedia.");
      else setBook(bookResult.data as PdfBook);
      setLoading(false);
    };
    void loadReader();
  }, [authLoading, params.id, router, session]);

  if (authLoading || loading) return <div style={{ display: "grid", height: "100vh", placeItems: "center", color: "#7a5230" }}>Memuat e-reader...</div>;
  if (!book) return <div style={{ display: "grid", height: "100vh", placeItems: "center", gap: 16 }}><p>{message || "Buku tidak ditemukan."}</p><button onClick={() => router.push(`/buku/${params.id}`)}>Kembali ke detail buku</button></div>;

  return <div className={styles.readerContainer}><header className={styles.readerHeader}><div className={styles.headerLeft}><button className={styles.iconBtn} onClick={() => router.push(`/buku/${book.id}`)}><ArrowLeft size={20} /></button><div className={styles.bookTitleInfo}><h1>{book.title}</h1><span className={styles.authorName}>{book.author}</span></div></div></header><main className={styles.readerMain} style={{ maxWidth: 1200, width: "100%" }}><iframe title={`PDF ${book.title}`} src={`${book.pdf_url}#view=FitH`} style={{ width: "100%", height: "calc(100vh - 88px)", border: "none", background: "white" }} /></main></div>;
}
