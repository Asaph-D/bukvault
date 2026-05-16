export interface Book {
  id: string;
  title: string;
  author: string;
  authorId: string;
  description: string;
  price: number;
  coverImage: string;
  category: string;
  rating: number;
  reviewCount: number;
  format: 'digital' | 'physical' | 'both';
  status?: string;
  datePublished: Date;
  sales?: number;
  revenue?: number;
  /** Présents sur le détail catalogue (DTO livre). */
  isbn?: string;
  language?: string;
  viewCount?: number;
}

export interface BookCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  bookCount?: number;
}

export interface Author {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  backgroundColor: string;
  textColor: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userInitials: string;
  rating: number;
  comment: string;
  date: Date;
}

export interface SalesData {
  date: string;
  sales: number;
  revenue: number;
}