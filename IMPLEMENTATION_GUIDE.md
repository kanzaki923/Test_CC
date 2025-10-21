# 実装ガイド

## 概要

このドキュメントは、メモアプリの実装を段階的に進めるためのガイドです。各フェーズごとにチェックリスト、コマンド、ベストプラクティスを記載しています。

## Phase 1: プロジェクトセットアップ

### 1.1 Next.jsプロジェクトの初期化

```bash
# Next.js 15 プロジェクトを作成
npx create-next-app@latest memo-app --typescript --tailwind --app --use-npm

cd memo-app

# 必要な依存関係をインストール
npm install zustand immer idb
npm install @tanstack/react-virtual use-debounce
npm install framer-motion
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react  # アイコンライブラリ

# 開発用依存関係
npm install -D @types/node @types/react @types/react-dom
npm install -D prettier prettier-plugin-tailwindcss
npm install -D @tailwindcss/typography
```

### 1.2 ディレクトリ構造の作成

```bash
# ディレクトリを作成
mkdir -p app/memo/[id]
mkdir -p components/{ui,memo,category,layout}
mkdir -p lib/{store,db,hooks,utils,workers}
mkdir -p public/icons
```

### 1.3 TypeScript型定義

**lib/types.ts**

```typescript
export interface Memo {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
  createdAt: number;
}

export type SortBy = 'updatedAt' | 'createdAt' | 'title';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid' | 'compact';
```

### チェックリスト

- [ ] Next.js 15 プロジェクトが作成されている
- [ ] すべての依存関係がインストールされている
- [ ] ディレクトリ構造が作成されている
- [ ] TypeScript型定義が完了している
- [ ] `npm run dev` でプロジェクトが起動する

---

## Phase 2: データレイヤー実装

### 2.1 IndexedDB ラッパー

**lib/db/indexed-db.ts** (ARCHITECTURE.mdの実装を使用)

### 2.2 Zustand ストア

#### メモストア

**lib/store/memoStore.ts** (ARCHITECTURE.mdの実装を使用)

#### カテゴリストア

**lib/store/categoryStore.ts**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Category } from '@/lib/types';

interface CategoryState {
  categories: Map<string, Category>;

  addCategory: (name: string, color: string) => string;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categoryIds: string[]) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    immer((set) => ({
      categories: new Map(),

      addCategory: (name, color) => {
        const id = crypto.randomUUID();
        const category: Category = {
          id,
          name,
          color,
          order: Date.now(),
          createdAt: Date.now(),
        };

        set((state) => {
          state.categories.set(id, category);
        });

        return id;
      },

      updateCategory: (id, updates) => {
        set((state) => {
          const category = state.categories.get(id);
          if (category) {
            state.categories.set(id, { ...category, ...updates });
          }
        });
      },

      deleteCategory: (id) => {
        set((state) => {
          state.categories.delete(id);
        });
      },

      reorderCategories: (categoryIds) => {
        set((state) => {
          categoryIds.forEach((id, index) => {
            const category = state.categories.get(id);
            if (category) {
              category.order = index;
            }
          });
        });
      },
    })),
    {
      name: 'category-storage',
      storage: createJSONStorage(() => localStorage),
      serialize: (state) =>
        JSON.stringify({
          ...state,
          state: {
            ...state.state,
            categories: Array.from(state.state.categories.entries()),
          },
        }),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          state: {
            ...parsed.state,
            categories: new Map(parsed.state.categories),
          },
        };
      },
    }
  )
);
```

#### UIストア

**lib/store/uiStore.ts** (ARCHITECTURE.mdの実装を使用)

### チェックリスト

- [ ] IndexedDB ラッパーが実装されている
- [ ] メモストアが実装されている
- [ ] カテゴリストアが実装されている
- [ ] UIストアが実装されている
- [ ] ブラウザの開発者ツールでLocalStorageとIndexedDBが確認できる

---

## Phase 3: UIコンポーネント基盤

### 3.1 Tailwind CSS設定

**tailwind.config.ts** (ARCHITECTURE.mdの実装を使用)

**app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;
    --secondary: 222 47% 11%;
    --secondary-foreground: 210 40% 98%;
    --accent: 216 34% 17%;
    --accent-foreground: 210 40% 98%;
    --muted: 223 47% 11%;
    --muted-foreground: 215 16% 65%;
    --border: 216 34% 17%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* スクロールバーのスタイリング */
@layer utilities {
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    @apply bg-secondary;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/30 rounded-full;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }
}
```

### 3.2 基本UIコンポーネント

#### Button コンポーネント

**components/ui/Button.tsx**

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-border bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

#### Input コンポーネント

**components/ui/Input.tsx**

```typescript
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
```

#### ユーティリティ関数

**lib/utils/cn.ts**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### チェックリスト

- [ ] Tailwind CSS が正しく設定されている
- [ ] ダークモードが動作する
- [ ] Button コンポーネントが実装されている
- [ ] Input コンポーネントが実装されている
- [ ] ユーティリティ関数 cn() が実装されている

---

## Phase 4: メモ機能の実装

### 4.1 メモリストコンポーネント

**components/memo/MemoList.tsx**

```typescript
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { useMemos } from '@/lib/hooks/useMemos';
import { MemoCard } from './MemoCard';

export function MemoList() {
  const { memos } = useMemos();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: memos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  if (memos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>メモがありません。新規作成してください。</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto scrollbar-thin"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const memo = memos[virtualItem.index];
          return (
            <div
              key={memo.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MemoCard memo={memo} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 4.2 メモカードコンポーネント

**components/memo/MemoCard.tsx**

```typescript
'use client';

import { Memo } from '@/lib/types';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/date-utils';
import { Pin, Trash2 } from 'lucide-react';
import { useMemoStore } from '@/lib/store/memoStore';
import { cn } from '@/lib/utils/cn';

interface MemoCardProps {
  memo: Memo;
}

export function MemoCard({ memo }: MemoCardProps) {
  const selectedMemoId = useUIStore((state) => state.selectedMemoId);
  const setSelectedMemo = useUIStore((state) => state.setSelectedMemo);
  const deleteMemo = useMemoStore((state) => state.deleteMemo);
  const pinMemo = useMemoStore((state) => state.pinMemo);

  const isSelected = selectedMemoId === memo.id;

  return (
    <article
      role="article"
      aria-labelledby={`memo-title-${memo.id}`}
      tabIndex={0}
      onClick={() => setSelectedMemo(memo.id)}
      className={cn(
        'group relative p-4 border-b cursor-pointer transition-colors',
        'hover:bg-accent',
        isSelected && 'bg-accent'
      )}
    >
      {/* ピン留めアイコン */}
      {memo.isPinned && (
        <Pin className="absolute top-2 right-2 h-4 w-4 text-primary" />
      )}

      {/* タイトル */}
      <h3
        id={`memo-title-${memo.id}`}
        className="font-semibold text-foreground mb-1 pr-8"
      >
        {memo.title || '無題のメモ'}
      </h3>

      {/* プレビュー */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
        {memo.content || 'メモが空です'}
      </p>

      {/* メタ情報 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <time dateTime={new Date(memo.updatedAt).toISOString()}>
          {formatDate(memo.updatedAt)}
        </time>

        {/* アクションボタン（ホバー時に表示） */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              pinMemo(memo.id, !memo.isPinned);
            }}
            className="p-1 hover:bg-background rounded"
            aria-label={memo.isPinned ? 'ピン留めを解除' : 'ピン留め'}
          >
            <Pin className={cn('h-3 w-3', memo.isPinned && 'fill-current')} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('このメモを削除しますか?')) {
                deleteMemo(memo.id);
              }
            }}
            className="p-1 hover:bg-background rounded text-red-500"
            aria-label="削除"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
}
```

### 4.3 日付フォーマット

**lib/utils/date-utils.ts**

```typescript
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // 1分未満
  if (diffMins < 1) {
    return 'たった今';
  }

  // 1時間未満
  if (diffMins < 60) {
    return `${diffMins}分前`;
  }

  // 24時間未満
  if (diffHours < 24) {
    return `${diffHours}時間前`;
  }

  // 7日未満
  if (diffDays < 7) {
    return `${diffDays}日前`;
  }

  // それ以降
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
```

### 4.4 メモエディタ

**components/memo/MemoEditor.tsx**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { useMemoStore } from '@/lib/store/memoStore';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { Input } from '@/components/ui/Input';

export function MemoEditor() {
  const selectedMemoId = useUIStore((state) => state.selectedMemoId);
  const memo = useMemoStore((state) =>
    selectedMemoId ? state.memos.get(selectedMemoId) : null
  );
  const updateMemo = useMemoStore((state) => state.updateMemo);

  const [title, setTitle] = useState(memo?.title || '');
  const [content, setContent] = useState(memo?.content || '');

  const { saveStatus } = useAutoSave(selectedMemoId, { title, content });

  useEffect(() => {
    setTitle(memo?.title || '');
    setContent(memo?.content || '');
  }, [memo]);

  if (!selectedMemoId || !memo) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>メモを選択してください</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル"
          className="text-lg font-semibold border-none focus-visible:ring-0"
        />

        <div className="text-xs text-muted-foreground">
          {saveStatus === 'saving' && '保存中...'}
          {saveStatus === 'saved' && '✓ 保存済み'}
        </div>
      </div>

      {/* エディタ */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="メモを入力..."
        className="flex-1 resize-none p-4 focus:outline-none bg-background text-foreground font-mono"
      />
    </div>
  );
}
```

### 4.5 自動保存フック

**lib/hooks/useAutoSave.ts**

```typescript
import { useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useMemoStore } from '@/lib/store/memoStore';
import { useState } from 'react';

export function useAutoSave(
  memoId: string | null,
  data: { title: string; content: string },
  delay = 300
) {
  const updateMemo = useMemoStore((state) => state.updateMemo);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  const initialDataRef = useRef(data);

  const debouncedSave = useDebouncedCallback(() => {
    if (!memoId) return;

    setSaveStatus('saving');
    updateMemo(memoId, data);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1000);
    }, 100);
  }, delay);

  useEffect(() => {
    if (
      memoId &&
      (data.title !== initialDataRef.current.title ||
        data.content !== initialDataRef.current.content)
    ) {
      debouncedSave();
    }
  }, [data, memoId, debouncedSave]);

  return { saveStatus };
}
```

### チェックリスト

- [ ] メモリストが表示される
- [ ] 仮想スクロールが動作する
- [ ] メモカードがクリック可能
- [ ] メモエディタでタイトルと本文が編集できる
- [ ] 自動保存が動作する（300msデバウンス）
- [ ] 保存状態が表示される

---

## Phase 5: カテゴリ機能

### 5.1 カテゴリサイドバー

**components/category/CategorySidebar.tsx**

```typescript
'use client';

import { useCategoryStore } from '@/lib/store/categoryStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useMemoStore } from '@/lib/store/memoStore';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export function CategorySidebar() {
  const categories = useCategoryStore((state) =>
    Array.from(state.categories.values()).sort((a, b) => a.order - b.order)
  );
  const selectedCategoryId = useUIStore((state) => state.selectedCategoryId);
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory);
  const memos = useMemoStore((state) => state.memos);

  const getCategoryMemoCount = (categoryId: string | null) => {
    return Array.from(memos.values()).filter(
      (m) => m.categoryId === categoryId
    ).length;
  };

  const totalMemos = memos.size;
  const uncategorizedCount = getCategoryMemoCount(null);

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* ヘッダー */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">カテゴリ</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              const name = prompt('カテゴリ名を入力してください');
              if (name) {
                useCategoryStore
                  .getState()
                  .addCategory(name, '#' + Math.floor(Math.random() * 16777215).toString(16));
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カテゴリリスト */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {/* すべてのメモ */}
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors',
            selectedCategoryId === null && 'bg-accent'
          )}
        >
          <span className="font-medium">すべてのメモ</span>
          <span className="text-xs text-muted-foreground">{totalMemos}</span>
        </button>

        {/* 未分類 */}
        {uncategorizedCount > 0 && (
          <button
            onClick={() => setSelectedCategory('uncategorized')}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors',
              selectedCategoryId === 'uncategorized' && 'bg-accent'
            )}
          >
            <span>未分類</span>
            <span className="text-xs text-muted-foreground">
              {uncategorizedCount}
            </span>
          </button>
        )}

        <div className="border-t my-2" />

        {/* カテゴリ */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors',
              selectedCategoryId === category.id && 'bg-accent'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span>{category.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {getCategoryMemoCount(category.id)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### チェックリスト

- [ ] カテゴリサイドバーが表示される
- [ ] カテゴリ追加が動作する
- [ ] カテゴリ選択でメモがフィルタリングされる
- [ ] 各カテゴリのメモ数が表示される

---

## Phase 6: 検索とソート

### 6.1 検索バー

**components/memo/MemoSearch.tsx**

```typescript
'use client';

import { useUIStore } from '@/lib/store/uiStore';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export function MemoSearch() {
  const searchQuery = useUIStore((state) => state.searchQuery);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="メモを検索... (Cmd+K)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
```

### 6.2 ソート機能

**components/memo/MemoSort.tsx**

```typescript
'use client';

import { useUIStore } from '@/lib/store/uiStore';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function MemoSort() {
  const { sortBy, sortOrder, setSortBy, toggleSortOrder } = useUIStore();

  return (
    <div className="flex items-center gap-2">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-3 py-2 text-sm border border-border rounded-md bg-background"
      >
        <option value="updatedAt">更新日時</option>
        <option value="createdAt">作成日時</option>
        <option value="title">タイトル</option>
      </select>

      <Button
        size="icon"
        variant="outline"
        onClick={toggleSortOrder}
        aria-label="ソート順を切り替え"
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>

      <span className="text-xs text-muted-foreground">
        {sortOrder === 'asc' ? '昇順' : '降順'}
      </span>
    </div>
  );
}
```

### 6.3 useMemos フック

**lib/hooks/useMemos.ts** (ARCHITECTURE.mdの実装を使用)

### チェックリスト

- [ ] 検索バーが表示される
- [ ] 検索クエリでメモがフィルタリングされる
- [ ] ソート機能が動作する
- [ ] ソート順の切り替えが動作する

---

## Phase 7: レイアウトとナビゲーション

### 7.1 ルートレイアウト

**app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Memo App - 高速メモアプリ',
  description: 'Next.jsで作られた高速で使いやすいメモアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### 7.2 ホームページ

**app/page.tsx**

```typescript
'use client';

import { useEffect } from 'react';
import { CategorySidebar } from '@/components/category/CategorySidebar';
import { MemoList } from '@/components/memo/MemoList';
import { MemoEditor } from '@/components/memo/MemoEditor';
import { MemoSearch } from '@/components/memo/MemoSearch';
import { MemoSort } from '@/components/memo/MemoSort';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useMemoStore } from '@/lib/store/memoStore';
import { useUIStore } from '@/lib/store/uiStore';

export default function Home() {
  const addMemo = useMemoStore((state) => state.addMemo);
  const setSelectedMemo = useUIStore((state) => state.setSelectedMemo);

  const handleNewMemo = () => {
    const id = addMemo({
      title: '',
      content: '',
      categoryId: null,
    });
    setSelectedMemo(id);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* カテゴリサイドバー */}
      <aside className="w-64 hidden md:block">
        <CategorySidebar />
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col">
        {/* ツールバー */}
        <div className="p-4 border-b flex items-center gap-4">
          <Button onClick={handleNewMemo} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新規メモ
          </Button>

          <div className="flex-1">
            <MemoSearch />
          </div>

          <MemoSort />
        </div>

        {/* メモリスト */}
        <div className="flex-1 overflow-hidden">
          <MemoList />
        </div>
      </main>

      {/* エディタパネル（デスクトップのみ） */}
      <aside className="w-1/2 hidden lg:block border-l">
        <MemoEditor />
      </aside>
    </div>
  );
}
```

### チェックリスト

- [ ] レイアウトが正しく表示される
- [ ] モバイル/タブレット/デスクトップでレスポンシブに動作する
- [ ] 新規メモボタンが動作する
- [ ] すべてのコンポーネントが統合されている

---

## Phase 8: パフォーマンス最適化

### 8.1 最適化チェックリスト

- [ ] 仮想スクロールが実装されている
- [ ] 検索がデバウンスされている（300ms）
- [ ] 自動保存がデバウンスされている（300ms）
- [ ] LocalStorageとIndexedDBに正しくデータが保存される
- [ ] React DevTools Profiler でレンダリングを確認
- [ ] Lighthouse スコア 90+ を達成

### 8.2 Lighthouse 実行

```bash
npm run build
npm start

# 別ターミナルで
npx lighthouse http://localhost:3000 --view
```

---

## よくある問題と解決策

### 問題1: LocalStorageが保存されない

**原因**: Map オブジェクトが JSON にシリアライズされていない

**解決策**: persist ミドルウェアの serialize/deserialize を正しく実装する (memoStore.ts参照)

### 問題2: 仮想スクロールが動作しない

**原因**: 親要素の高さが指定されていない

**解決策**: 親要素に h-full または固定の高さを指定する

### 問題3: デバウンスが効かない

**原因**: useDebouncedCallback が再生成されている

**解決策**: 依存配列を正しく指定する

---

## 次のステップ

このガイドに従って実装を進めてください。各フェーズのチェックリストを確認しながら、段階的に機能を追加していきます。

実装が完了したら、以下を実行してください:

1. **テスト**: ユニットテストとE2Eテストを実装
2. **デプロイ**: Vercelにデプロイ
3. **ドキュメント**: README.mdを更新
4. **フィードバック**: ユーザーテストを実施

頑張ってください!
