"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Phone, MapPin, BookOpen, Users, Star, Heart } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import styles from "./tentang.module.css";

export default function TentangPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && session) {
      router.push("/dashboard");
    }
  }, [session, authLoading, router]);

  return (
    <div className={styles.page}>
      <PublicNavbar />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>🇮🇩 Made in Indonesia</span>
          <h1>Tentang <span className={styles.accent}>BacaKita</span></h1>
          <p>
            Platform buku digital terlengkap yang menghadirkan pengalaman membaca
            berkualitas tinggi untuk seluruh masyarakat Indonesia.
          </p>
        </div>
      </section>

      {/* MISI & VISI */}
      <section className={styles.section}>
        <div className={styles.misiVisi}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎯</div>
            <h2>Misi Kami</h2>
            <p>
              Mendemokratisasi akses terhadap pengetahuan dengan menyediakan
              ribuan buku digital berkualitas dengan harga yang terjangkau,
              sehingga siapa pun bisa terus belajar dan berkembang.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🔭</div>
            <h2>Visi Kami</h2>
            <p>
              Menjadi platform literasi digital terkemuka di Asia Tenggara
              yang menginspirasi jutaan pembaca untuk mencintai buku dan
              membangun kebiasaan membaca seumur hidup.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>💡</div>
            <h2>Nilai Kami</h2>
            <p>
              Kami percaya bahwa setiap orang berhak mendapatkan pendidikan
              berkualitas. Dengan teknologi, kami membuat buku dapat diakses
              kapan saja, di mana saja, oleh siapa saja.
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <BookOpen size={32} className={styles.statIcon} />
            <strong>10.000+</strong>
            <span>Judul Buku</span>
          </div>
          <div className={styles.stat}>
            <Users size={32} className={styles.statIcon} />
            <strong>500.000+</strong>
            <span>Pembaca Aktif</span>
          </div>
          <div className={styles.stat}>
            <Star size={32} className={styles.statIcon} />
            <strong>4.8 / 5.0</strong>
            <span>Rating Aplikasi</span>
          </div>
          <div className={styles.stat}>
            <Heart size={32} className={styles.statIcon} />
            <strong>100+</strong>
            <span>Genre Tersedia</span>
          </div>
        </div>
      </section>

      {/* CERITA */}
      <section className={styles.section}>
        <div className={styles.story}>
          <div className={styles.storyContent}>
            <span className={styles.storyLabel}>Cerita Kami</span>
            <h2>Dari Kecintaan pada Buku, Lahirlah BacaKita</h2>
            <p>
              BacaKita lahir pada tahun 2024 dari mimpi sederhana — membuat buku
              dapat dijangkau oleh semua orang Indonesia, tak terbatas oleh jarak
              atau harga.
            </p>
            <p>
              Kami memulai dengan koleksi 500 buku, dan kini telah berkembang
              menjadi lebih dari 10.000 judul dari berbagai genre. Dari novel
              bestseller hingga buku ilmiah, dari penulis lokal hingga penulis
              internasional — semua ada di BacaKita.
            </p>
            <p>
              Dengan dukungan komunitas pembaca yang terus tumbuh, kami berkomitmen
              untuk terus menghadirkan pengalaman membaca terbaik yang mudah,
              nyaman, dan menyenangkan.
            </p>
          </div>
          <div className={styles.storyVisual}>
            <div className={styles.storyCard}>
              <span>📖</span>
              <h3>Mudah Digunakan</h3>
              <p>Antarmuka yang intuitif untuk semua usia</p>
            </div>
            <div className={styles.storyCard}>
              <span>⚡</span>
              <h3>Akses Instan</h3>
              <p>Baca langsung tanpa download lama</p>
            </div>
            <div className={styles.storyCard}>
              <span>🔒</span>
              <h3>Aman & Terpercaya</h3>
              <p>Data dan privasi Anda terlindungi</p>
            </div>
            <div className={styles.storyCard}>
              <span>💰</span>
              <h3>Harga Terjangkau</h3>
              <p>Berlangganan mulai Rp49.000/bulan</p>
            </div>
          </div>
        </div>
      </section>

      {/* TIM */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Tim Kami</h2>
          <p>Orang-orang berdedikasi di balik BacaKita</p>
        </div>
        <div className={styles.teamGrid}>
          {TEAM.map((member) => (
            <div key={member.name} className={styles.teamCard}>
              <div className={styles.teamAvatar}>{member.avatar}</div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KONTAK */}
      <section className={styles.kontakSection}>
        <div className={styles.sectionTitle}>
          <h2>Hubungi Kami</h2>
          <p>Kami senang mendengar dari Anda</p>
        </div>
        <div className={styles.kontakGrid}>
          <div className={styles.kontakCard}>
            <div className={styles.kontakIcon}><Mail size={24} /></div>
            <h3>Email</h3>
            <p>hello@bacakita.id</p>
            <span>Balasan dalam 24 jam</span>
          </div>
          <div className={styles.kontakCard}>
            <div className={styles.kontakIcon}><Phone size={24} /></div>
            <h3>WhatsApp</h3>
            <p>+62 812-3456-7890</p>
            <span>Sen–Jum, 09.00–18.00</span>
          </div>
          <div className={styles.kontakCard}>
            <div className={styles.kontakIcon}><MapPin size={24} /></div>
            <h3>Kantor</h3>
            <p>Jakarta Selatan, DKI Jakarta</p>
            <span>Indonesia</span>
          </div>
        </div>
      </section>
    </div>
  );
}

const TEAM = [
  { name: "Arief Rahmat", role: "CEO & Co-Founder", avatar: "👨‍💼" },
  { name: "Siti Nurhaliza", role: "CTO & Co-Founder", avatar: "👩‍💻" },
  { name: "Budi Santoso", role: "Head of Content", avatar: "👨‍📚" },
  { name: "Dewi Anggraini", role: "Lead Designer", avatar: "👩‍🎨" },
];
