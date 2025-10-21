export interface Memo {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  tags: string[];
  isDeleted: boolean;
  deletedAt: number | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
  createdAt: number;
}

export type SortBy = "updatedAt" | "createdAt" | "title";
export type SortOrder = "asc" | "desc";
export type ViewMode = "list" | "grid" | "compact";
