import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Memo, Category, Tag } from '@/lib/types';

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
  tags: {
    key: string;
    value: Tag;
  };
}

let dbPromise: Promise<IDBPDatabase<MemoAppDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MemoAppDB>('memo-app-db', 2, {
      upgrade(db) {
        // メモストア
        if (!db.objectStoreNames.contains('memos')) {
          const memoStore = db.createObjectStore('memos', { keyPath: 'id' });
          memoStore.createIndex('by-updated', 'updatedAt');
          memoStore.createIndex('by-category', 'categoryId');
        }

        // カテゴリストア
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // タグストア
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * データをIndexedDBに保存
 * @param storeName ストア名 ('memos' | 'categories' | 'tags')
 * @param key データのキー
 * @param value 保存するデータ
 */
export async function saveToIndexedDB<T extends 'memos' | 'categories' | 'tags'>(
  storeName: T,
  key: string,
  value: T extends 'memos' ? Memo : T extends 'categories' ? Category : Tag
): Promise<void> {
  try {
    const db = await getDB();
    await db.put(storeName, value as any);
  } catch (error) {
    console.error(`Failed to save to IndexedDB (${storeName}):`, error);
    throw error;
  }
}

/**
 * IndexedDBからすべてのデータを読み込み
 * @param storeName ストア名 ('memos' | 'categories' | 'tags')
 * @returns データの配列
 */
export async function loadFromIndexedDB<T extends 'memos' | 'categories' | 'tags'>(
  storeName: T
): Promise<{ success: boolean; data?: (T extends 'memos' ? Memo : T extends 'categories' ? Category : Tag)[] }> {
  try {
    const db = await getDB();
    const data = (await db.getAll(storeName)) as (T extends 'memos' ? Memo : T extends 'categories' ? Category : Tag)[];
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to load from IndexedDB (${storeName}):`, error);
    return { success: false };
  }
}

/**
 * IndexedDBからデータを削除
 * @param storeName ストア名 ('memos' | 'categories' | 'tags')
 * @param key 削除するデータのキー
 */
export async function deleteFromIndexedDB(
  storeName: 'memos' | 'categories' | 'tags',
  key: string
): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(storeName, key);
  } catch (error) {
    console.error(`Failed to delete from IndexedDB (${storeName}):`, error);
    throw error;
  }
}

/**
 * メモを検索（タイトルと本文から）
 * @param query 検索クエリ
 * @returns マッチしたメモの配列
 */
export async function searchMemosIndexedDB(query: string): Promise<Memo[]> {
  try {
    const db = await getDB();
    const allMemos = await db.getAll('memos');

    // 空のクエリの場合は全メモを返す
    if (!query.trim()) {
      return allMemos;
    }

    const lowerQuery = query.toLowerCase();
    return allMemos.filter(
      (memo) =>
        memo.title.toLowerCase().includes(lowerQuery) ||
        memo.content.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Failed to search memos in IndexedDB:', error);
    return [];
  }
}

/**
 * データベースをクリア（テスト用）
 */
export async function clearDatabase(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(['memos', 'categories', 'tags'], 'readwrite');
    await Promise.all([
      tx.objectStore('memos').clear(),
      tx.objectStore('categories').clear(),
      tx.objectStore('tags').clear(),
      tx.done,
    ]);
  } catch (error) {
    console.error('Failed to clear database:', error);
  }
}

/**
 * データベース接続をリセット（テスト用）
 */
export function resetDBConnection(): void {
  dbPromise = null;
}
