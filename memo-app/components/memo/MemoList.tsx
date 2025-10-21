"use client";

import { MemoCard } from "./MemoCard";
import type { Memo } from "@/lib/types";

// ダミーデータ
const dummyMemos: Memo[] = [
  {
    id: "1",
    title: "プロジェクト会議メモ",
    content: "次回のプロジェクト会議で議論する内容：\n- 新機能の仕様確認\n- スケジュール調整\n- リソース配分",
    categoryId: "1",
    createdAt: Date.now() - 1000 * 60 * 30, // 30分前
    updatedAt: Date.now() - 1000 * 60 * 10, // 10分前
    isPinned: true,
    tags: [],
  },
  {
    id: "2",
    title: "買い物リスト",
    content: "- 牛乳\n- 卵\n- パン\n- トマト\n- チーズ",
    categoryId: "2",
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2時間前
    updatedAt: Date.now() - 1000 * 60 * 60, // 1時間前
    isPinned: false,
    tags: [],
  },
  {
    id: "3",
    title: "アプリのアイデア",
    content: "メモアプリの機能改善案：\n- ダークモード対応\n- タグ機能\n- クラウド同期\n- Markdown対応",
    categoryId: "3",
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1日前
    updatedAt: Date.now() - 1000 * 60 * 60 * 5, // 5時間前
    isPinned: false,
    tags: [],
  },
  {
    id: "4",
    title: "TypeScriptの学習メモ",
    content: "型定義の基本：\ninterface vs type\nジェネリクスの使い方\nユーティリティタイプ",
    categoryId: "1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2日前
    updatedAt: Date.now() - 1000 * 60 * 60 * 24, // 1日前
    isPinned: false,
    tags: [],
  },
  {
    id: "5",
    title: "週末の予定",
    content: "土曜日：友達とランチ\n日曜日：部屋の掃除、読書",
    categoryId: "2",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3日前
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2日前
    isPinned: false,
    tags: [],
  },
];

interface MemoListProps {
  selectedMemoId: string | null;
  onSelectMemo: (id: string) => void;
}

export function MemoList({ selectedMemoId, onSelectMemo }: MemoListProps) {
  return (
    <div className="h-full overflow-auto scrollbar-thin bg-background">
      {dummyMemos.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>メモがありません。新規作成してください。</p>
        </div>
      ) : (
        <div>
          {dummyMemos.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              isSelected={selectedMemoId === memo.id}
              onClick={() => onSelectMemo(memo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
