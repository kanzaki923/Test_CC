import { useEffect, useRef } from 'react';
import { useMemoStore } from '@/lib/store/memoStore';
import { useCategoryStore } from '@/lib/store/categoryStore';
import { useTagStore } from '@/lib/store/tagStore';

/**
 * Initialize data from IndexedDB or create default categories and sample memos
 */
export function useInitializeData() {
  const initialized = useRef(false);
  const hydrateMemos = useMemoStore((state) => state.hydrate);
  const hydrateCategories = useCategoryStore((state) => state.hydrate);
  const hydrateTags = useTagStore((state) => state.hydrate);
  const addMemo = useMemoStore((state) => state.addMemo);
  const memos = useMemoStore((state) => state.memos);
  const addCategory = useCategoryStore((state) => state.addCategory);
  const categories = useCategoryStore((state) => state.categories);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load data from IndexedDB first
    const loadData = async () => {
      await Promise.all([hydrateMemos(), hydrateCategories(), hydrateTags()]);

      // Only initialize if no data exists after hydration
      if (categories.size === 0) {
      // Add default categories
      const workId = addCategory({
        name: '仕事',
        color: '#3b82f6',
        icon: '💼',
      });

      const personalId = addCategory({
        name: '個人',
        color: '#10b981',
        icon: '🏠',
      });

      const ideasId = addCategory({
        name: 'アイデア',
        color: '#8b5cf6',
        icon: '💡',
      });

      // Add sample memos if no memos exist
      if (memos.size === 0) {
        const now = Date.now();

        addMemo({
          title: 'プロジェクト会議メモ',
          content: '次回のプロジェクト会議で議論する内容：\n- 新機能の仕様確認\n- スケジュール調整\n- リソース配分',
          categoryId: workId,
          tags: [],
        });

        addMemo({
          title: '買い物リスト',
          content: '- 牛乳\n- 卵\n- パン\n- トマト\n- チーズ',
          categoryId: personalId,
          tags: [],
        });

        addMemo({
          title: 'アプリのアイデア',
          content: 'メモアプリの機能改善案：\n- ダークモード対応\n- タグ機能\n- クラウド同期\n- Markdown対応',
          categoryId: ideasId,
          tags: [],
        });

        addMemo({
          title: 'TypeScriptの学習メモ',
          content: '型定義の基本：\ninterface vs type\nジェネリクスの使い方\nユーティリティタイプ',
          categoryId: workId,
          tags: [],
        });

        addMemo({
          title: '週末の予定',
          content: '土曜日：友達とランチ\n日曜日：部屋の掃除、読書',
          categoryId: personalId,
          tags: [],
        });
      }
    }
    };

    loadData();
  }, [hydrateMemos, hydrateCategories, hydrateTags, addMemo, addCategory, memos.size, categories.size]);
}
