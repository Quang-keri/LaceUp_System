export interface NewsImage {
  isCover?: boolean;
  imageUrl?: string;
  id?: string | number;
  imageId?: string | number;
}

export interface NewsItem {
  id: string | number;
  title: string;
  content: string;
  visibility?: "PUBLIC" | "MEMBER" | "PRIVATE";
  createdAt: string | Date | number;
  createdBy?: string;
  sourceUrl?: string;
  imageUrl?: string;
  images?: NewsImage[];
}
