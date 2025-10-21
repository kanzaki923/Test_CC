"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategorySidebar } from "@/components/category/CategorySidebar";
import { MemoList } from "@/components/memo/MemoList";
import { MemoEditor } from "@/components/memo/MemoEditor";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>("1");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* カテゴリサイドバー（デスクトップのみ） */}
      <aside className="hidden md:block w-64 border-r border-border">
        <CategorySidebar />
      </aside>

      {/* メインコンテンツエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ツールバー */}
        <div className="p-4 border-b border-border flex items-center gap-4 bg-background">
          <Button size="sm" data-tour="new-memo">
            <Plus className="h-4 w-4 mr-2" />
            新規メモ
          </Button>

          <div className="flex-1 relative" data-tour="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="メモを検索... (Cmd+K)"
              className="pl-10"
            />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <select className="h-9 px-3 rounded-md border border-input bg-background text-sm">
              <option value="updatedAt">更新日時</option>
              <option value="createdAt">作成日時</option>
              <option value="title">タイトル</option>
            </select>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 flex overflow-hidden">
          {/* メモリスト */}
          <div className="w-full lg:w-1/2 border-r border-border overflow-hidden" data-tour="memo-list">
            <MemoList
              selectedMemoId={selectedMemoId}
              onSelectMemo={setSelectedMemoId}
            />
          </div>

          {/* メモエディタ（デスクトップのみ） */}
          <div className="hidden lg:block flex-1 overflow-hidden">
            <MemoEditor memoId={selectedMemoId} />
          </div>
        </div>
      </main>
    </div>
  );
}
