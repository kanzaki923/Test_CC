# アーキテクチャ詳細ドキュメント

## 1. 状態管理アーキテクチャ

### 1.1 Zustand ストア設計

#### メモストア (memoStore.ts)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { saveToIndexedDB, loadFromIndexedDB } from '@/lib/db/indexed-db';

interface MemoState {
  // データ
  memos: Map<string, Memo>;

  // アクション
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMemo: (id: string, updates: Partial<Memo>) => void;
  deleteMemo: (id: string) => void;
  pinMemo: (id: string, isPinned: boolean) => void;

  // 一括操作
  batchDeleteMemos: (ids: string[]) => void;

  // データ同期
  hydrate: () => Promise<void>;
}

export const useMemoStore = create<MemoState>()(
  persist(
    immer((set, get) => ({
      memos: new Map(),

      addMemo: (memoData) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const memo: Memo = {
          ...memoData,
          id,
          createdAt: now,
          updatedAt: now,
          isPinned: false,
          tags: [],
        };

        set((state) => {
          state.memos.set(id, memo);
        });

        // 非同期でIndexedDBに保存（UIはブロックしない）
        saveToIndexedDB('memos', id, memo);

        return id;
      },

      updateMemo: (id, updates) => {
        set((state) => {
          const memo = state.memos.get(id);
          if (memo) {
            const updated = {
              ...memo,
              ...updates,
              updatedAt: Date.now(),
            };
            state.memos.set(id, updated);

            // 非同期保存
            saveToIndexedDB('memos', id, updated);
          }
        });
      },

      deleteMemo: (id) => {
        set((state) => {
          state.memos.delete(id);
        });

        // IndexedDBからも削除
        deleteFromIndexedDB('memos', id);
      },

      pinMemo: (id, isPinned) => {
        get().updateMemo(id, { isPinned });
      },

      batchDeleteMemos: (ids) => {
        set((state) => {
          ids.forEach((id) => {
            state.memos.delete(id);
          });
        });

        // 一括削除
        Promise.all(ids.map((id) => deleteFromIndexedDB('memos', id)));
      },

      hydrate: async () => {
        // 初期化時にIndexedDBからデータを読み込む
        const memos = await loadFromIndexedDB('memos');
        set({ memos: new Map(memos.map((m) => [m.id, m])) });
      },
    })),
    {
      name: 'memo-storage',
      storage: createJSONStorage(() => localStorage),
      // Map を JSON にシリアライズ
      serialize: (state) => JSON.stringify({
        ...state,
        state: {
          ...state.state,
          memos: Array.from(state.state.memos.entries()),
        },
      }),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          state: {
            ...parsed.state,
            memos: new Map(parsed.state.memos),
          },
        };
      },
    }
  )
);
```

#### UIストア (uiStore.ts)

```typescript
import { create } from 'zustand';

interface UIState {
  // 選択状態
  selectedMemoId: string | null;
  selectedCategoryId: string | null;

  // 表示設定
  viewMode: 'list' | 'grid' | 'compact';
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';

  // 検索
  searchQuery: string;

  // モーダル・サイドバー
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  isCategoryManagerOpen: boolean;

  // アクション
  setSelectedMemo: (id: string | null) => void;
  setSelectedCategory: (id: string | null) => void;
  setViewMode: (mode: 'list' | 'grid' | 'compact') => void;
  setSortBy: (sortBy: UIState['sortBy']) => void;
  toggleSortOrder: () => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  toggleSearch: () => void;
  toggleCategoryManager: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedMemoId: null,
  selectedCategoryId: null,
  viewMode: 'list',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  searchQuery: '',
  isSidebarOpen: true,
  isSearchOpen: false,
  isCategoryManagerOpen: false,

  setSelectedMemo: (id) => set({ selectedMemoId: id }),
  setSelectedCategory: (id) => set({ selectedCategoryId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sortBy) => set({ sortBy }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  toggleCategoryManager: () =>
    set((state) => ({ isCategoryManagerOpen: !state.isCategoryManagerOpen })),
}));
```

### 1.2 カスタムフック

#### useMemos.ts - メモ操作の統合フック

```typescript
import { useMemo } from 'react';
import { useMemoStore } from '@/lib/store/memoStore';
import { useUIStore } from '@/lib/store/uiStore';

export function useMemos() {
  const memos = useMemoStore((state) => state.memos);
  const { selectedCategoryId, sortBy, sortOrder, searchQuery } = useUIStore();

  // フィルタリング・ソート・検索を適用
  const filteredMemos = useMemo(() => {
    let result = Array.from(memos.values());

    // カテゴリフィルタ
    if (selectedCategoryId) {
      result = result.filter((m) => m.categoryId === selectedCategoryId);
    }

    // 検索フィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.content.toLowerCase().includes(query)
      );
    }

    // ソート
    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'updatedAt') {
        comparison = a.updatedAt - b.updatedAt;
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt - b.createdAt;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title, 'ja');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // ピン留めメモを最上位に
    const pinned = result.filter((m) => m.isPinned);
    const unpinned = result.filter((m) => !m.isPinned);

    return [...pinned, ...unpinned];
  }, [memos, selectedCategoryId, sortBy, sortOrder, searchQuery]);

  return {
    memos: filteredMemos,
    totalCount: memos.size,
    filteredCount: filteredMemos.length,
  };
}
```

#### useAutoSave.ts - 自動保存フック

```typescript
import { useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useMemoStore } from '@/lib/store/memoStore';

export function useAutoSave(
  memoId: string | null,
  content: string,
  delay = 300
) {
  const updateMemo = useMemoStore((state) => state.updateMemo);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const initialContentRef = useRef(content);

  // デバウンス付き保存関数
  const debouncedSave = useDebouncedCallback(
    (id: string, newContent: string) => {
      setSaveStatus('saving');
      updateMemo(id, { content: newContent });

      // 保存完了後、短時間「保存済み」を表示
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1000);
      }, 100);
    },
    delay
  );

  useEffect(() => {
    if (
      memoId &&
      content !== initialContentRef.current
    ) {
      debouncedSave(memoId, content);
    }
  }, [content, memoId, debouncedSave]);

  // クリーンアップ時に即座に保存
  useEffect(() => {
    return () => {
      if (memoId && content !== initialContentRef.current) {
        updateMemo(memoId, { content });
      }
    };
  }, [memoId, content, updateMemo]);

  return { saveStatus };
}
```

## 2. データ永続化レイヤー

### 2.1 IndexedDB ラッパー (indexed-db.ts)

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MemoAppDB extends DBSchema {
  memos: {
    key: string;
    value: Memo;
    indexes: {
      'by-updated': number;
      'by-category': string;
    };
  };
  categories: {
    key: string;
    value: Category;
  };
}

let dbPromise: Promise<IDBPDatabase<MemoAppDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MemoAppDB>('memo-app-db', 1, {
      upgrade(db) {
        // メモストア
        const memoStore = db.createObjectStore('memos', { keyPath: 'id' });
        memoStore.createIndex('by-updated', 'updatedAt');
        memoStore.createIndex('by-category', 'categoryId');

        // カテゴリストア
        db.createObjectStore('categories', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function saveToIndexedDB<T extends 'memos' | 'categories'>(
  storeName: T,
  key: string,
  value: T extends 'memos' ? Memo : Category
) {
  const db = await getDB();
  await db.put(storeName, value as any);
}

export async function loadFromIndexedDB<T extends 'memos' | 'categories'>(
  storeName: T
): Promise<(T extends 'memos' ? Memo : Category)[]> {
  const db = await getDB();
  return await db.getAll(storeName);
}

export async function deleteFromIndexedDB(
  storeName: 'memos' | 'categories',
  key: string
) {
  const db = await getDB();
  await db.delete(storeName, key);
}

export async function searchMemosIndexedDB(
  query: string
): Promise<Memo[]> {
  const db = await getDB();
  const allMemos = await db.getAll('memos');

  const lowerQuery = query.toLowerCase();
  return allMemos.filter(
    (memo) =>
      memo.title.toLowerCase().includes(lowerQuery) ||
      memo.content.toLowerCase().includes(lowerQuery)
  );
}
```

## 3. UI コンポーネント設計

### 3.1 仮想スクロール実装

#### MemoList.tsx

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
    estimateSize: () => 120, // メモカードの推定高さ
    overscan: 5, // 画面外の要素も5個分レンダリング（スムーズなスクロール）
  });

  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
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
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
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

### 3.2 楽観的UI更新

#### MemoEditor.tsx

```typescript
'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { useMemoStore } from '@/lib/store/memoStore';
import { useAutoSave } from '@/lib/hooks/useAutoSave';

export function MemoEditor({ memoId }: { memoId: string }) {
  const memo = useMemoStore((state) => state.memos.get(memoId));
  const updateMemo = useMemoStore((state) => state.updateMemo);

  const [isPending, startTransition] = useTransition();
  const [optimisticContent, setOptimisticContent] = useOptimistic(
    memo?.content ?? ''
  );

  const [content, setContent] = useState(memo?.content ?? '');
  const { saveStatus } = useAutoSave(memoId, content);

  const handleChange = (newContent: string) => {
    setContent(newContent);

    // 楽観的UI更新: UIは即座に更新
    setOptimisticContent(newContent);

    // 実際の保存は非同期（自動保存フックが処理）
    startTransition(() => {
      // この中で状態更新が行われても、UIはブロックされない
    });
  };

  return (
    <div className="relative">
      <textarea
        value={optimisticContent}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-full resize-none p-4 focus:outline-none"
        placeholder="メモを入力..."
      />

      {/* 保存状態インジケーター */}
      <div className="absolute top-2 right-2 text-xs text-muted-foreground">
        {saveStatus === 'saving' && '保存中...'}
        {saveStatus === 'saved' && '✓ 保存済み'}
      </div>
    </div>
  );
}
```

### 3.3 スワイプジェスチャー (モバイル)

#### SwipeableMemoCard.tsx

```typescript
'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useMemoStore } from '@/lib/store/memoStore';
import { MemoCard } from './MemoCard';

export function SwipeableMemoCard({ memo }: { memo: Memo }) {
  const deleteMemo = useMemoStore((state) => state.deleteMemo);
  const pinMemo = useMemoStore((state) => state.pinMemo);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x < -threshold) {
      // 左スワイプ: 削除
      deleteMemo(memo.id);
    } else if (info.offset.x > threshold) {
      // 右スワイプ: ピン留めトグル
      pinMemo(memo.id, !memo.isPinned);
    }

    // 位置をリセット
    x.set(0);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      style={{ x, opacity }}
      className="relative"
    >
      {/* 背景に削除/ピンのアイコンを表示 */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className="text-blue-500">📌</div>
        <div className="text-red-500">🗑️</div>
      </div>

      <MemoCard memo={memo} />
    </motion.div>
  );
}
```

## 4. パフォーマンス最適化戦略

### 4.1 コード分割

#### app/page.tsx (RSC)

```typescript
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 重いコンポーネントを動的インポート
const MemoEditor = dynamic(() => import('@/components/memo/MemoEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false, // クライアントサイドのみでレンダリング
});

const CategoryManager = dynamic(
  () => import('@/components/category/CategoryManager'),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1">
        <Suspense fallback={<MemoListSkeleton />}>
          <MemoList />
        </Suspense>
      </main>

      <aside className="w-1/3 border-l">
        <Suspense fallback={<EditorSkeleton />}>
          <MemoEditor />
        </Suspense>
      </aside>
    </div>
  );
}
```

### 4.2 画像最適化

```typescript
import Image from 'next/image';

// Next.js Image コンポーネントで自動最適化
<Image
  src="/icons/category.svg"
  alt="Category"
  width={24}
  height={24}
  loading="lazy"
  placeholder="blur"
/>
```

### 4.3 Web Worker による検索

#### search-worker.ts

```typescript
// Web Worker で検索処理を実行
self.addEventListener('message', (e) => {
  const { type, query, memos } = e.data;

  if (type === 'SEARCH') {
    const results = memos.filter((memo: Memo) => {
      const lowerQuery = query.toLowerCase();
      return (
        memo.title.toLowerCase().includes(lowerQuery) ||
        memo.content.toLowerCase().includes(lowerQuery)
      );
    });

    self.postMessage({ type: 'SEARCH_RESULTS', results });
  }
});
```

#### useSearch.ts

```typescript
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function useSearch(memos: Memo[], query: string) {
  const [results, setResults] = useState<Memo[]>([]);
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    // Web Worker を初期化
    const searchWorker = new Worker(
      new URL('@/lib/workers/search-worker.ts', import.meta.url)
    );

    searchWorker.addEventListener('message', (e) => {
      if (e.data.type === 'SEARCH_RESULTS') {
        setResults(e.data.results);
      }
    });

    setWorker(searchWorker);

    return () => {
      searchWorker.terminate();
    };
  }, []);

  const debouncedSearch = useDebouncedCallback((q: string) => {
    if (worker) {
      worker.postMessage({ type: 'SEARCH', query: q, memos });
    }
  }, 300);

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setResults(memos);
    }
  }, [query, memos, debouncedSearch]);

  return results;
}
```

## 5. レスポンシブデザイン

### 5.1 Tailwind 設定

#### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
```

### 5.2 レスポンシブレイアウト

```typescript
export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* モバイル: 非表示、タブレット以上: サイドバー表示 */}
      <aside className="hidden md:block md:w-64 lg:w-72 border-r">
        <CategorySidebar />
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* デスクトップのみ: 詳細パネル */}
      <aside className="hidden lg:block lg:w-96 border-l">
        <MemoDetailPanel />
      </aside>

      {/* モバイルのみ: ボトムナビゲーション */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
        <MobileNav />
      </nav>
    </div>
  );
}
```

## 6. アクセシビリティ

### 6.1 キーボードナビゲーション

```typescript
export function KeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: 新規メモ
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNewMemo();
      }

      // Cmd/Ctrl + K: 検索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }

      // Esc: モーダルを閉じる
      if (e.key === 'Escape') {
        closeModals();
      }

      // ↑/↓: メモリストをナビゲート
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        navigateMemoList(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
```

### 6.2 ARIA属性

```typescript
export function MemoCard({ memo }: { memo: Memo }) {
  return (
    <article
      role="article"
      aria-labelledby={`memo-title-${memo.id}`}
      aria-describedby={`memo-preview-${memo.id}`}
      tabIndex={0}
      className="p-4 border rounded hover:bg-accent transition-colors"
    >
      <h3 id={`memo-title-${memo.id}`} className="font-semibold">
        {memo.title || '無題のメモ'}
      </h3>

      <p
        id={`memo-preview-${memo.id}`}
        className="text-sm text-muted-foreground line-clamp-2"
      >
        {memo.content}
      </p>

      <time
        dateTime={new Date(memo.updatedAt).toISOString()}
        className="text-xs text-muted-foreground"
      >
        {formatDate(memo.updatedAt)}
      </time>
    </article>
  );
}
```

## 7. テスト戦略

### 7.1 ユニットテスト (Jest)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMemoStore } from '@/lib/store/memoStore';

describe('useMemoStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useMemoStore.setState({ memos: new Map() });
  });

  it('should add a new memo', () => {
    const { result } = renderHook(() => useMemoStore());

    act(() => {
      const id = result.current.addMemo({
        title: 'Test Memo',
        content: 'Test Content',
        categoryId: null,
      });

      expect(result.current.memos.get(id)).toMatchObject({
        title: 'Test Memo',
        content: 'Test Content',
      });
    });
  });

  it('should update a memo', () => {
    const { result } = renderHook(() => useMemoStore());

    let memoId: string;

    act(() => {
      memoId = result.current.addMemo({
        title: 'Original',
        content: 'Content',
        categoryId: null,
      });
    });

    act(() => {
      result.current.updateMemo(memoId, { title: 'Updated' });
    });

    expect(result.current.memos.get(memoId)?.title).toBe('Updated');
  });
});
```

### 7.2 E2Eテスト (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Memo App', () => {
  test('should create a new memo', async ({ page }) => {
    await page.goto('/');

    // 新規メモボタンをクリック
    await page.click('[aria-label="新規メモ"]');

    // タイトルと本文を入力
    await page.fill('[placeholder="タイトル"]', 'Test Memo');
    await page.fill('[placeholder="メモを入力..."]', 'Test Content');

    // 自動保存を待つ
    await page.waitForSelector('text=保存済み');

    // メモが表示されることを確認
    await expect(page.locator('text=Test Memo')).toBeVisible();
  });

  test('should search memos', async ({ page }) => {
    await page.goto('/');

    // 検索を開く
    await page.keyboard.press('Meta+K');

    // 検索クエリを入力
    await page.fill('[placeholder="検索..."]', 'test');

    // 検索結果が表示されることを確認
    await expect(page.locator('[role="article"]')).toHaveCount(1);
  });
});
```

## 8. デプロイ設定

### 8.1 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 実験的機能
  experimental: {
    // Partial Prerendering
    ppr: true,
  },

  // 画像最適化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // バンドル最適化
  webpack: (config, { isServer }) => {
    // クライアントサイドのバンドルサイズを削減
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      };
    }

    return config;
  },

  // PWA設定（将来拡張）
  // ...
};

module.exports = nextConfig;
```

### 8.2 環境変数 (.env.local)

```bash
# アプリケーション設定
NEXT_PUBLIC_APP_NAME=Memo App
NEXT_PUBLIC_APP_VERSION=1.0.0

# IndexedDB設定
NEXT_PUBLIC_DB_NAME=memo-app-db
NEXT_PUBLIC_DB_VERSION=1

# 機能フラグ
NEXT_PUBLIC_ENABLE_CLOUD_SYNC=false
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=false
```

---

このアーキテクチャドキュメントは、実装フェーズでの指針となります。各セクションのコード例は、実際の実装時に調整・拡張してください。
