// Tipe ini tetap ada untuk kompatibilitas dengan file-file yang masih menggunakannya
export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  cover_url?: string;
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

export const books: Book[] = [];

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
