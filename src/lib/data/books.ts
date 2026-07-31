export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  price: string;
  priceNum: number;
  oldPrice?: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  genre: string;
  pages: number;
  publisher: string;
  year: number;
  description: string;
  chapters: { title: string }[];
  isPremium?: boolean;
};

export const books: Book[] = [
  {
    id: "1",
    title: "Atomic Habits",
    author: "James Clear",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
    price: "Rp79.000",
    priceNum: 79000,
    oldPrice: "Rp99.000",
    rating: 4.9,
    reviewCount: 1284,
    badge: "Best Seller",
    genre: "Self Improvement",
    pages: 320,
    publisher: "Gramedia",
    year: 2020,
    description:
      "Atomic Habits menawarkan kerangka kerja yang telah terbukti untuk memperbaiki setiap hari. James Clear, salah satu penulis terkemuka di dunia dalam hal pembentukan kebiasaan, mengungkapkan strategi-strategi praktis yang akan mengajarkan Anda cara membentuk kebiasaan baik, menghilangkan yang buruk, dan menguasai perilaku-perilaku kecil yang menghasilkan hasil luar biasa.",
    chapters: [
      { title: "Bab 1 — Kekuatan Kebiasaan Kecil" },
      { title: "Bab 2 — Identitas & Kebiasaan" },
      { title: "Bab 3 — Cara Membangun Kebiasaan Baru" },
      { title: "Bab 4 — Hukum Pertama: Buat Tampak Jelas" },
      { title: "Bab 5 — Hukum Kedua: Buat Menarik" },
    ],
  },
  {
    id: "2",
    title: "Filosofi Teras",
    author: "Henry Manampiring",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500",
    price: "Rp85.000",
    priceNum: 85000,
    rating: 4.8,
    reviewCount: 987,
    badge: "Populer",
    genre: "Self Improvement",
    pages: 288,
    publisher: "Kompas",
    year: 2019,
    description:
      "Filosofi Teras membahas filsafat Stoa dari sudut pandang yang relevan dengan kehidupan modern Indonesia. Buku ini mengajak pembaca untuk menemukan ketenangan dan kebahagiaan sejati di tengah dunia yang penuh tekanan.",
    chapters: [
      { title: "Bab 1 — Apa Itu Stoisisme?" },
      { title: "Bab 2 — Dikotomi Kendali" },
      { title: "Bab 3 — Emosi Negatif" },
      { title: "Bab 4 — Membangun Resiliensi" },
    ],
  },
  {
    id: "3",
    title: "Deep Work",
    author: "Cal Newport",
    cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500",
    price: "Rp72.000",
    priceNum: 72000,
    rating: 4.9,
    reviewCount: 756,
    badge: undefined,
    genre: "Bisnis",
    pages: 304,
    publisher: "Grand Central Publishing",
    year: 2016,
    description:
      "Deep Work adalah kemampuan untuk fokus tanpa gangguan pada tugas yang menuntut kognitif. Buku ini menunjukkan mengapa kemampuan ini semakin langka dan semakin berharga di dunia saat ini.",
    chapters: [
      { title: "Bab 1 — Deep Work Bernilai" },
      { title: "Bab 2 — Deep Work Langka" },
      { title: "Bab 3 — Deep Work Bermakna" },
      { title: "Bab 4 — Aturan 1: Bekerja Dalam-Dalam" },
    ],
  },
  {
    id: "4",
    title: "Psychology of Money",
    author: "Morgan Housel",
    cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500",
    price: "Rp91.000",
    priceNum: 91000,
    rating: 5.0,
    reviewCount: 1102,
    badge: "Editor's Pick",
    genre: "Bisnis",
    pages: 268,
    publisher: "Harriman House",
    year: 2020,
    description:
      "Buku ini mengungkapkan cara orang berpikir tentang uang dan cara mengubah pola pikir itu untuk membuat keputusan keuangan yang lebih baik.",
    chapters: [
      { title: "Bab 1 — Tidak Ada yang Gila" },
      { title: "Bab 2 — Keberuntungan & Risiko" },
      { title: "Bab 3 — Tidak Pernah Cukup" },
      { title: "Bab 4 — Membungakan Waktu" },
    ],
  },
  {
    id: "5",
    title: "Ikigai",
    author: "Hector Garcia",
    cover: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=500",
    price: "Rp82.000",
    priceNum: 82000,
    rating: 4.8,
    reviewCount: 843,
    badge: undefined,
    genre: "Self Improvement",
    pages: 208,
    publisher: "Penguin Books",
    year: 2017,
    description:
      "Ikigai adalah kata Jepang yang berarti alasan untuk hidup. Buku ini menjelajahi rahasia kebahagiaan dan umur panjang orang-orang di Okinawa, Jepang.",
    chapters: [
      { title: "Bab 1 — Ikigai, Seni Tetap Muda" },
      { title: "Bab 2 — Anti-Penuaan" },
      { title: "Bab 3 — Flow" },
    ],
  },
  {
    id: "6",
    title: "Bumi",
    author: "Tere Liye",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
    price: "Rp69.000",
    priceNum: 69000,
    rating: 4.7,
    reviewCount: 654,
    badge: undefined,
    genre: "Fantasi",
    pages: 440,
    publisher: "Gramedia",
    year: 2014,
    description:
      "Raib, gadis 15 tahun yang bisa menghilang, suatu hari menemukan pintu menuju dunia lain dengan peradaban yang jauh lebih maju.",
    chapters: [
      { title: "Bab 1 — Raib yang Bisa Menghilang" },
      { title: "Bab 2 — Pintu Rahasia" },
      { title: "Bab 3 — Dunia Bawah Tanah" },
    ],
  },
  {
    id: "7",
    title: "Laut Bercerita",
    author: "Leila S. Chudori",
    cover: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500",
    price: "Rp91.000",
    priceNum: 91000,
    rating: 5.0,
    reviewCount: 921,
    badge: "Editor's Pick",
    genre: "Novel",
    pages: 384,
    publisher: "KPG",
    year: 2017,
    description:
      "Novel tentang mahasiswa aktivis yang hilang di era Orde Baru, diceritakan dari dua sudut pandang: Biru Laut yang hilang, dan adiknya Asmara Jati yang terus mencari.",
    chapters: [
      { title: "Bab 1 — Biru Laut" },
      { title: "Bab 2 — Asmara Jati" },
      { title: "Bab 3 — 1998" },
    ],
  },
  {
    id: "8",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
    price: "Rp105.000",
    priceNum: 105000,
    rating: 5.0,
    reviewCount: 1589,
    badge: "Best Seller",
    genre: "Sejarah",
    pages: 512,
    publisher: "Harper",
    year: 2011,
    description:
      "Dari manusia purba hingga era teknologi modern, Sapiens mengajak kita menelusuri perjalanan luar biasa umat manusia.",
    chapters: [
      { title: "Bab 1 — Binatang yang Tidak Penting" },
      { title: "Bab 2 — Pohon Pengetahuan" },
    ],
    isPremium: true,
  },
  {
    id: "9",
    title: "The Mountain Is You",
    author: "Brianna Wiest",
    cover: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500",
    price: "Rp95.000",
    priceNum: 95000,
    rating: 5.0,
    reviewCount: 778,
    badge: "New",
    genre: "Self Improvement",
    pages: 248,
    publisher: "Thought Catalog Books",
    year: 2020,
    description:
      "Buku transformatif tentang cara mengatasi hambatan diri sendiri.",
    chapters: [
      { title: "Bab 1 — Mengapa Kita Menyabotase Diri" },
      { title: "Bab 2 — Kebiasaan Merusak" },
      { title: "Bab 3 — Membangun Diri Baru" },
    ],
  },
  {
    id: "10",
    title: "Start With Why",
    author: "Simon Sinek",
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
    price: "Rp89.000",
    priceNum: 89000,
    rating: 4.8,
    reviewCount: 1034,
    badge: undefined,
    genre: "Bisnis",
    pages: 256,
    publisher: "Portfolio",
    year: 2009,
    description:
      "Simon Sinek mengungkap pola pikir yang membedakan pemimpin dan organisasi yang menginspirasi dari yang lainnya.",
    chapters: [
      { title: "Bab 1 — Asumsikan Anda Tahu" },
      { title: "Bab 2 — Golden Circle" },
      { title: "Bab 3 — Pemimpin yang Menginspirasi" },
    ],
  },
  {
    id: "11",
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    cover: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=500",
    price: "Rp74.000",
    priceNum: 74000,
    rating: 4.8,
    reviewCount: 2001,
    badge: "Best Seller",
    genre: "Bisnis",
    pages: 336,
    publisher: "Warner Books",
    year: 1997,
    description:
      "Robert Kiyosaki berbagi pelajaran keuangan yang ia pelajari dari dua ayah.",
    chapters: [
      { title: "Bab 1 — Rich Dad, Poor Dad" },
      { title: "Bab 2 — Orang Kaya Tidak Bekerja untuk Uang" },
      { title: "Bab 3 — Melek Finansial" },
    ],
  },
  {
    id: "12",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500",
    price: "Rp99.000",
    priceNum: 99000,
    rating: 4.9,
    reviewCount: 1356,
    badge: undefined,
    genre: "Teknologi",
    pages: 499,
    publisher: "Farrar, Straus and Giroux",
    year: 2011,
    description:
      "Daniel Kahneman mengungkapkan dua sistem berpikir manusia dan bagaimana keduanya mempengaruhi setiap keputusan kita.",
    chapters: [
      { title: "Bab 1 — Karakter Cerita" },
      { title: "Bab 2 — Perhatian dan Usaha" },
      { title: "Bab 3 — Mesin Lompatan Kesimpulan" },
    ],
    isPremium: true,
  },
];

export const genres = [
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
