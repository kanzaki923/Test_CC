import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Memo, Category } from '@/lib/types';

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
        if (!db.objectStoreNames.contains('memos')) {
          const memoStore = db.createObjectStore('memos', { keyPath: 'id' });
          memoStore.createIndex('by-updated', 'updatedAt');
          memoStore.createIndex('by-category', 'categoryId');
        }

        // カテゴリストア
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * データをIndexedDBに保存
 * @param storeName ストア名 ('memos' or 'categories')
 * @param key データのキー
 * @param value 保存するデータ
 */
export async function saveToIndexedDB<T extends 'memos' | 'categories'>(
  storeName: T,
  key: string,
  value: T extends 'memos' ? Memo : Category
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
 * @param storeName ストア名 ('memos' or 'categories')
 * @returns データの配列
 */
export async function loadFromIndexedDB<T extends 'memos' | 'categories'>(
  storeName: T
): Promise<(T extends 'memos' ? Memo : Category)[]> {
  try {
    const db = await getDB();
    return (await db.getAll(storeName)) as (T extends 'memos' ? Memo : Category)[];
  } catch (error) {
    console.error(`Failed to load from IndexedDB (${storeName}):`, error);
    return [];
  }
}

/**
 * IndexedDBからデータを削除
 * @param storeName ストア名 ('memos' or 'categories')
 * @param key 削除するデータのキー
 */
export async function deleteFromIndexedDB(
  storeName: 'memos' | 'categories',
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
    const tx = db.transaction(['memos', 'categories'], 'readwrite');
    await Promise.all([
      tx.objectStore('memos').clear(),
      tx.objectStore('categories').clear(),
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
