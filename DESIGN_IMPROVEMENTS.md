# 設計改善提案書

このドキュメントは、DESIGN_REVIEW.mdで特定された課題に対する具体的な改善提案をまとめています。

## 改善の優先順位

### フェーズ1: 安定性とユーザビリティの基盤（1-2週間）

優先度が最も高く、すぐに実装すべき改善です。これらがないと本番環境で問題が発生する可能性があります。

---

## 1. エラーハンドリングの実装

### 1.1 IndexedDB操作のエラー処理

**実装場所**: `lib/db/indexed-db.ts`

```typescript
export interface DBOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: 'QUOTA_EXCEEDED' | 'DB_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
    message: string;
    userMessage: string; // ユーザー向けメッセージ
  };
}

export async function saveToIndexedDB<T extends 'memos' | 'categories'>(
  storeName: T,
  key: string,
  value: T extends 'memos' ? Memo : Category
): Promise<DBOperationResult> {
  try {
    const db = await getDB();
    await db.put(storeName, value as any);
    return { success: true };
  } catch (error: any) {
    console.error('IndexedDB save error:', error);

    // クォータ超過
    if (error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: error.message,
          userMessage: 'ストレージ容量が不足しています。不要なメモを削除してください。',
        },
      };
    }

    // データベースエラー
    if (error.name === 'InvalidStateError' || error.name === 'VersionError') {
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error.message,
          userMessage: 'データベースエラーが発生しました。ページを再読み込みしてください。',
        },
      };
    }

    // その他のエラー
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: error.message,
        userMessage: 'データの保存に失敗しました。もう一度お試しください。',
      },
    };
  }
}

export async function loadFromIndexedDB<T extends 'memos' | 'categories'>(
  storeName: T
): Promise<DBOperationResult<(T extends 'memos' ? Memo : Category)[]>> {
  try {
    const db = await getDB();
    const data = await db.getAll(storeName);
    return { success: true, data };
  } catch (error: any) {
    console.error('IndexedDB load error:', error);
    return {
      success: false,
      data: [],
      error: {
        code: 'DB_ERROR',
        message: error.message,
        userMessage: 'データの読み込みに失敗しました。',
      },
    };
  }
}
```

### 1.2 Zustandストアのエラーハンドリング

**実装場所**: `lib/store/memoStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { saveToIndexedDB, loadFromIndexedDB } from '@/lib/db/indexed-db';
import { toast } from '@/components/ui/Toast';

interface MemoState {
  memos: Map<string, Memo>;

  // エラー状態
  lastError: string | null;
  isSaving: boolean;

  // アクション
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateMemo: (id: string, updates: Partial<Memo>) => Promise<boolean>;
  deleteMemo: (id: string) => Promise<boolean>;

  // エラー処理
  clearError: () => void;
}

export const useMemoStore = create<MemoState>()(
  persist(
    immer((set, get) => ({
      memos: new Map(),
      lastError: null,
      isSaving: false,

      addMemo: async (memoData) => {
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

        // 楽観的更新
        set((state) => {
          state.memos.set(id, memo);
          state.isSaving = true;
        });

        // IndexedDBに保存
        const result = await saveToIndexedDB('memos', id, memo);

        if (!result.success) {
          // 失敗時はロールバック
          set((state) => {
            state.memos.delete(id);
            state.lastError = result.error?.userMessage || null;
            state.isSaving = false;
          });

          // ユーザーに通知
          toast({
            variant: 'destructive',
            title: 'エラー',
            description: result.error?.userMessage,
          });

          return null;
        }

        set((state) => {
          state.isSaving = false;
        });

        return id;
      },

      updateMemo: async (id, updates) => {
        const originalMemo = get().memos.get(id);

        if (!originalMemo) {
          toast({
            variant: 'destructive',
            title: 'エラー',
            description: 'メモが見つかりません',
          });
          return false;
        }

        const updatedMemo = {
          ...originalMemo,
          ...updates,
          updatedAt: Date.now(),
        };

        // 楽観的更新
        set((state) => {
          state.memos.set(id, updatedMemo);
          state.isSaving = true;
        });

        // IndexedDBに保存
        const result = await saveToIndexedDB('memos', id, updatedMemo);

        if (!result.success) {
          // ロールバック
          set((state) => {
            state.memos.set(id, originalMemo);
            state.lastError = result.error?.userMessage || null;
            state.isSaving = false;
          });

          toast({
            variant: 'destructive',
            title: '保存失敗',
            description: result.error?.userMessage,
          });

          return false;
        }

        set((state) => {
          state.isSaving = false;
        });

        return true;
      },

      deleteMemo: async (id) => {
        const memo = get().memos.get(id);

        if (!memo) return false;

        // 楽観的削除
        set((state) => {
          state.memos.delete(id);
        });

        // IndexedDBから削除
        const result = await deleteFromIndexedDB('memos', id);

        if (!result.success) {
          // ロールバック
          set((state) => {
            state.memos.set(id, memo);
            state.lastError = result.error?.userMessage || null;
          });

          toast({
            variant: 'destructive',
            title: '削除失敗',
            description: result.error?.userMessage,
          });

          return false;
        }

        return true;
      },

      clearError: () => set({ lastError: null }),
    })),
    {
      name: 'memo-storage',
      storage: createJSONStorage(() => localStorage),
      // エラーハンドリング
      onRehydrateStorage: () => (state) => {
        if (!state) {
          toast({
            variant: 'destructive',
            title: 'データ読み込みエラー',
            description: 'ローカルストレージからのデータ復元に失敗しました',
          });
        }
      },
      // シリアライゼーション
      serialize: (state) => {
        try {
          return JSON.stringify({
            ...state,
            state: {
              ...state.state,
              memos: Array.from(state.state.memos.entries()),
            },
          });
        } catch (error) {
          console.error('Serialization error:', error);
          return '{}';
        }
      },
      deserialize: (str) => {
        try {
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              memos: new Map(parsed.state.memos || []),
            },
          };
        } catch (error) {
          console.error('Deserialization error:', error);
          return { state: { memos: new Map() } };
        }
      },
    }
  )
);
```

### 1.3 オフライン対応

**新規ファイル**: `lib/hooks/useOnlineStatus.ts`

```typescript
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

**新規コンポーネント**: `components/layout/OfflineIndicator.tsx`

```typescript
'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-up">
      <WifiOff className="h-5 w-5" />
      <div>
        <p className="font-semibold">オフラインモード</p>
        <p className="text-xs">メモはローカルに保存されます</p>
      </div>
    </div>
  );
}
```

---

## 2. ゴミ箱機能の実装

### 2.1 データモデルの拡張

**更新**: `lib/types.ts`

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

  // ゴミ箱関連
  isDeleted: boolean;
  deletedAt: number | null;
}
```

### 2.2 ゴミ箱ストアの実装

**更新**: `lib/store/memoStore.ts`

```typescript
interface MemoState {
  // ... 既存のフィールド

  // ゴミ箱操作
  moveToTrash: (id: string) => Promise<boolean>;
  restoreFromTrash: (id: string) => Promise<boolean>;
  permanentlyDelete: (id: string) => Promise<boolean>;
  emptyTrash: () => Promise<boolean>;
  getTrashMemos: () => Memo[];
  cleanupOldTrash: () => Promise<void>;
}

export const useMemoStore = create<MemoState>()(
  // ...
  moveToTrash: async (id) => {
    const memo = get().memos.get(id);
    if (!memo) return false;

    const trashedMemo = {
      ...memo,
      isDeleted: true,
      deletedAt: Date.now(),
    };

    set((state) => {
      state.memos.set(id, trashedMemo);
    });

    const result = await saveToIndexedDB('memos', id, trashedMemo);

    if (!result.success) {
      set((state) => {
        state.memos.set(id, memo);
      });
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'ゴミ箱への移動に失敗しました',
      });
      return false;
    }

    toast({
      title: 'ゴミ箱に移動しました',
      description: memo.title || 'メモ',
      action: (
        <Button size="sm" onClick={() => get().restoreFromTrash(id)}>
          元に戻す
        </Button>
      ),
      duration: 5000,
    });

    return true;
  },

  restoreFromTrash: async (id) => {
    const memo = get().memos.get(id);
    if (!memo) return false;

    const restoredMemo = {
      ...memo,
      isDeleted: false,
      deletedAt: null,
    };

    set((state) => {
      state.memos.set(id, restoredMemo);
    });

    const result = await saveToIndexedDB('memos', id, restoredMemo);

    if (!result.success) {
      set((state) => {
        state.memos.set(id, memo);
      });
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '復元に失敗しました',
      });
      return false;
    }

    toast({
      title: '復元しました',
      description: restoredMemo.title || 'メモ',
    });

    return true;
  },

  permanentlyDelete: async (id) => {
    const memo = get().memos.get(id);
    if (!memo) return false;

    set((state) => {
      state.memos.delete(id);
    });

    const result = await deleteFromIndexedDB('memos', id);

    if (!result.success) {
      set((state) => {
        state.memos.set(id, memo);
      });
      return false;
    }

    return true;
  },

  emptyTrash: async () => {
    const trashMemos = get().getTrashMemos();
    const ids = trashMemos.map(m => m.id);

    for (const id of ids) {
      await get().permanentlyDelete(id);
    }

    toast({
      title: 'ゴミ箱を空にしました',
      description: `${ids.length}件のメモを完全に削除しました`,
    });

    return true;
  },

  getTrashMemos: () => {
    return Array.from(get().memos.values()).filter(m => m.isDeleted);
  },

  cleanupOldTrash: async () => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const trashMemos = get().getTrashMemos();
    const oldMemos = trashMemos.filter(
      m => m.deletedAt && m.deletedAt < thirtyDaysAgo
    );

    for (const memo of oldMemos) {
      await get().permanentlyDelete(memo.id);
    }

    if (oldMemos.length > 0) {
      console.log(`Cleaned up ${oldMemos.length} old trash items`);
    }
  },
  // ...
);
```

### 2.3 ゴミ箱UI

**新規コンポーネント**: `components/memo/TrashView.tsx`

```typescript
'use client';

import { useMemoStore } from '@/lib/store/memoStore';
import { Button } from '@/components/ui/Button';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils/date-utils';

export function TrashView() {
  const trashMemos = useMemoStore((state) => state.getTrashMemos());
  const restoreFromTrash = useMemoStore((state) => state.restoreFromTrash);
  const permanentlyDelete = useMemoStore((state) => state.permanentlyDelete);
  const emptyTrash = useMemoStore((state) => state.emptyTrash);

  if (trashMemos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Trash2 className="h-16 w-16 mb-4 opacity-50" />
        <p>ゴミ箱は空です</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          <h2 className="font-semibold">ゴミ箱 ({trashMemos.length})</h2>
        </div>

        {trashMemos.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('ゴミ箱を完全に空にしますか？この操作は元に戻せません。')) {
                emptyTrash();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ゴミ箱を空にする
          </Button>
        )}
      </div>

      {/* 警告 */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-yellow-900 dark:text-yellow-100">
            30日後に自動削除されます
          </p>
          <p className="text-yellow-700 dark:text-yellow-300">
            ゴミ箱内のメモは30日後に自動的に完全削除されます
          </p>
        </div>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto">
        {trashMemos.map((memo) => (
          <div
            key={memo.id}
            className="p-4 border-b hover:bg-accent transition-colors"
          >
            <h3 className="font-semibold mb-1">{memo.title || '無題のメモ'}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {memo.content || 'メモが空です'}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                削除日時: {memo.deletedAt && formatDate(memo.deletedAt)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreFromTrash(memo.id)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  復元
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('このメモを完全に削除しますか？この操作は元に戻せません。')) {
                      permanentlyDelete(memo.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  完全削除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.4 自動クリーンアップ

**新規フック**: `lib/hooks/useTrashCleanup.ts`

```typescript
import { useEffect } from 'react';
import { useMemoStore } from '@/lib/store/memoStore';

export function useTrashCleanup() {
  useEffect(() => {
    // 初回実行
    useMemoStore.getState().cleanupOldTrash();

    // 1日に1回実行
    const interval = setInterval(() => {
      useMemoStore.getState().cleanupOldTrash();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
```

**使用場所**: `app/layout.tsx`

```typescript
'use client';

import { useTrashCleanup } from '@/lib/hooks/useTrashCleanup';

export default function RootLayout({ children }) {
  useTrashCleanup(); // ゴミ箱の自動クリーンアップ

  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

---

## 3. フィードバックシステムの実装

### 3.1 トースト通知コンポーネント

**新規ファイル**: `components/ui/Toast.tsx`

```typescript
'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-red-500 bg-red-500 text-white',
        success: 'border-green-500 bg-green-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
```

### 3.2 トーストフック

**新規ファイル**: `lib/hooks/useToast.ts`

```typescript
import * as React from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/Toast';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, 'id'>;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

export { useToast, toast };
```

---

## 4. オンボーディング機能

### 4.1 チュートリアルコンポーネント

**新規ファイル**: `components/onboarding/OnboardingTour.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface TourStep {
  target: string; // data-tour属性のセレクタ
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="new-memo"]',
    title: '新しいメモを作成',
    description: 'ここをクリックして新しいメモを作成できます。Cmd+Nでも作成できます。',
    position: 'bottom',
  },
  {
    target: '[data-tour="search"]',
    title: 'メモを検索',
    description: 'タイトルや本文から素早くメモを検索できます。Cmd+Kでも開けます。',
    position: 'bottom',
  },
  {
    target: '[data-tour="categories"]',
    title: 'カテゴリで整理',
    description: 'メモをカテゴリ分けして整理しましょう。カテゴリは自由に追加できます。',
    position: 'right',
  },
  {
    target: '[data-tour="memo-list"]',
    title: 'メモ一覧',
    description: 'すべてのメモがここに表示されます。メモをクリックして編集できます。',
    position: 'right',
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('onboarding-completed');

    if (!hasCompletedTour) {
      // 少し遅延させて表示
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const step = tourSteps[currentStep];
    const target = document.querySelector(step.target);

    if (target) {
      const rect = target.getBoundingClientRect();
      const tooltipWidth = 300;
      const tooltipHeight = 150;

      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'top':
          top = rect.top - tooltipHeight - 10;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 10;
          break;
      }

      setPosition({ top, left });

      // ハイライト
      target.classList.add('tour-highlight');

      return () => {
        target.classList.remove('tour-highlight');
      };
    }
  }, [currentStep, isVisible]);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding-completed', 'true');
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding-completed', 'true');
  };

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-[999]" onClick={handleSkip} />

      {/* ツールチップ */}
      <div
        className="fixed z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-[300px]"
        style={{ top: position.top, left: position.left }}
      >
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {tourSteps.length}
          </span>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSkip}>
              スキップ
            </Button>
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? '完了' : '次へ'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
```

### 4.2 ツールチップの追加

既存のボタンに `data-tour` 属性を追加:

```typescript
// app/page.tsx
<Button data-tour="new-memo" onClick={handleNewMemo}>
  新規メモ
</Button>

<div data-tour="search">
  <MemoSearch />
</div>

<div data-tour="categories">
  <CategorySidebar />
</div>

<div data-tour="memo-list">
  <MemoList />
</div>
```

---

## 5. 実装スケジュール

### Week 1: エラーハンドリング
- Day 1-2: IndexedDB操作のエラー処理
- Day 3-4: Zustandストアのエラーハンドリング
- Day 5: オフライン対応

### Week 2: ゴミ箱機能
- Day 1-2: データモデル拡張とストア実装
- Day 3-4: ゴミ箱UI実装
- Day 5: 自動クリーンアップ

### Week 3: フィードバックとオンボーディング
- Day 1-2: トースト通知システム
- Day 3-4: オンボーディングチュートリアル
- Day 5: 統合テスト

---

## 6. テスト計画

### 6.1 エラーハンドリングのテスト

```typescript
describe('Error Handling', () => {
  it('should handle IndexedDB quota exceeded error', async () => {
    // クォータ超過をシミュレート
    jest.spyOn(IDBDatabase.prototype, 'put').mockRejectedValue(
      new DOMException('QuotaExceededError', 'QuotaExceededError')
    );

    const result = await saveToIndexedDB('memos', 'test-id', mockMemo);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('QUOTA_EXCEEDED');
  });

  it('should rollback on save failure', async () => {
    const { result } = renderHook(() => useMemoStore());

    jest.spyOn(window, 'indexedDB').mockImplementation(() => {
      throw new Error('DB Error');
    });

    await act(async () => {
      const success = await result.current.updateMemo('id', { title: 'New' });
      expect(success).toBe(false);
    });

    // ロールバックされていることを確認
    expect(result.current.memos.get('id')?.title).toBe('Original');
  });
});
```

### 6.2 ゴミ箱機能のテスト

```typescript
describe('Trash Functionality', () => {
  it('should move memo to trash', async () => {
    const { result } = renderHook(() => useMemoStore());

    await act(async () => {
      await result.current.moveToTrash('memo-id');
    });

    const memo = result.current.memos.get('memo-id');
    expect(memo?.isDeleted).toBe(true);
    expect(memo?.deletedAt).toBeTruthy();
  });

  it('should restore memo from trash', async () => {
    const { result } = renderHook(() => useMemoStore());

    await act(async () => {
      await result.current.moveToTrash('memo-id');
      await result.current.restoreFromTrash('memo-id');
    });

    const memo = result.current.memos.get('memo-id');
    expect(memo?.isDeleted).toBe(false);
    expect(memo?.deletedAt).toBeNull();
  });

  it('should cleanup old trash items', async () => {
    const { result } = renderHook(() => useMemoStore());

    const oldMemo = {
      ...mockMemo,
      isDeleted: true,
      deletedAt: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31日前
    };

    result.current.memos.set('old-memo', oldMemo);

    await act(async () => {
      await result.current.cleanupOldTrash();
    });

    expect(result.current.memos.has('old-memo')).toBe(false);
  });
});
```

---

このフェーズ1の改善を実装することで、アプリの安定性とユーザビリティが大幅に向上します。
