"use client";

import { useRouter } from "next/navigation";
import { Crown, Check, ArrowRight, Zap } from "lucide-react";
import AuthNavbar from "@/components/AuthNavbar";
import { useAuth } from "@/lib/AuthContext";
import styles from "./subscription.module.css";

const PLANS = [
  {
    id: "bulanan",
    name: "Bulanan",
    price: "Rp49.000",
    priceNum: 49000,
    period: "/bulan",
    desc: "Ideal untuk pembaca aktif",
    features: [
      "Akses semua 10.000+ buku",
      "Baca tanpa batas",
      "Akses buku Premium & Eksklusif",
      "Simpan progres membaca",
      "Batalkan kapan saja",
    ],
    popular: false,
    color: "#7a5230",
  },
  {
    id: "tahunan",
    name: "Tahunan",
    price: "Rp399.000",
    priceNum: 399000,
    period: "/tahun",
    desc: "Hemat 32% dibanding bulanan",
    features: [
      "Semua fitur Bulanan",
      "Hemat Rp189.000 per tahun",
      "Akses prioritas konten baru",
      "Rekomendasi personal AI",
      "Dukungan pelanggan prioritas",
    ],
    popular: true,
    color: "#c97d3e",
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { session } = useAuth();

  const handleSubscribe = (planId: string) => {
    if (!session) {
      router.push(`/login?redirect=/subscription&plan=${planId}`);
    } else {
      router.push(`/checkout/subscription/${planId}`);
    }
  };

  return (
    <div className={styles.page}>
      <AuthNavbar />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Crown size={16} />
            <span>BacaKita Premium</span>
          </div>
          <h1>
            Baca Ribuan Buku <br />
            <span className={styles.accent}>Tanpa Batas</span>
          </h1>
          <p>
            Nikmati akses penuh ke 10.000+ judul buku premium, novel bestseller,
            dan konten eksklusif. Mulai membaca hari ini.
          </p>
        </div>
      </section>

      {/* PLANS */}
      <section className={styles.plans}>
        <div className={styles.plansHeader}>
          <h2>Pilih Paket Langganan</h2>
          <p>Fleksibel, tanpa kontrak, batalkan kapan saja</p>
        </div>

        <div className={styles.plansGrid}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${plan.popular ? styles.planCardPopular : ""}`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>
                  <Zap size={14} /> Paling Populer
                </div>
              )}
              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <p>{plan.desc}</p>
                <div className={styles.planPrice}>
                  <span className={styles.planAmount}>{plan.price}</span>
                  <span className={styles.planPeriod}>{plan.period}</span>
                </div>
              </div>

              <ul className={styles.featureList}>
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={16} className={styles.checkIcon} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.subscribeBtn} ${plan.popular ? styles.subscribeBtnPopular : ""}`}
                onClick={() => handleSubscribe(plan.id)}
                id={`btn-langganan-${plan.id}`}
              >
                Mulai Berlangganan
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <h2>Pertanyaan Umum</h2>
        <div className={styles.faqGrid}>
          {FAQS.map((faq) => (
            <div key={faq.q} className={styles.faqCard}>
              <h3>{faq.q}</h3>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BOTTOM */}
      {!session && (
        <section className={styles.ctaBottom}>
          <h2>Sudah punya akun?</h2>
          <p>Login untuk langsung memilih paket langgananmu.</p>
          <button className={styles.loginBtn} onClick={() => router.push("/login")}>
            Login Sekarang
          </button>
        </section>
      )}
    </div>
  );
}

const FAQS = [
  {
    q: "Apakah ada masa percobaan gratis?",
    a: "Ya! Daftar akun baru dan nikmati 7 hari akses gratis ke semua konten premium.",
  },
  {
    q: "Bagaimana cara membatalkan langganan?",
    a: "Kamu bisa membatalkan kapan saja melalui menu Profil > Langganan. Tidak ada biaya pembatalan.",
  },
  {
    q: "Apakah bisa membaca secara offline?",
    a: "Untuk saat ini, membaca membutuhkan koneksi internet. Fitur offline akan hadir segera.",
  },
  {
    q: "Metode pembayaran apa yang diterima?",
    a: "Transfer bank, dompet digital (GoPay, OVO, DANA), dan kartu kredit/debit.",
  },
];
