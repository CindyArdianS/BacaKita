export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
  isNew: boolean;
  isBestSeller: boolean;
}

export interface User {
  name: string;
  isSubscribed: boolean;
  avatar: string;
}