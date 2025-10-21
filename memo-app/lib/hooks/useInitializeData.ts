import { useEffect, useRef } from 'react';
import { useMemoStore } from '@/lib/store/memoStore';
import { useCategoryStore } from '@/lib/store/categoryStore';
import { useTagStore } from '@/lib/store/tagStore';

/**
 * Initialize data from IndexedDB or create default categories and sample memos
 */
export function useInitializeData() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load data from IndexedDB first
    const loadData = async () => {
      const memoStore = useMemoStore.getState();
      const categoryStore = useCategoryStore.getState();
      const tagStore = useTagStore.getState();

      await Promise.all([
        memoStore.hydrate(),
        categoryStore.hydrate(),
        tagStore.hydrate()
      ]);

      // Get fresh state after hydration
      const categoriesAfterHydration = useCategoryStore.getState().categories;
      const memosAfterHydration = useMemoStore.getState().memos;

      // Only initialize if no data exists after hydration
      if (categoriesAfterHydration.size === 0) {
      const addCategory = categoryStore.addCategory;
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
      if (memosAfterHydration.size === 0) {
        const now = Date.now();
        const addMemo = memoStore.addMemo;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount
}
