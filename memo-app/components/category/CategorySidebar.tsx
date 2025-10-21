"use client";

import { Button } from "@/components/ui/Button";
import { Plus, FolderOpen, Trash2 } from "lucide-react";

// ダミーデータ
const dummyCategories = [
  { id: "1", name: "仕事", color: "#3B82F6", count: 12 },
  { id: "2", name: "プライベート", color: "#10B981", count: 8 },
  { id: "3", name: "アイデア", color: "#F59E0B", count: 15 },
];

export function CategorySidebar() {
  return (
    <div className="flex flex-col h-full bg-background" data-tour="categories">
      {/* ヘッダー */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">カテゴリ</h2>
          <Button size="icon" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カテゴリリスト */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {/* すべてのメモ */}
        <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors bg-accent">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">すべてのメモ</span>
          </div>
          <span className="text-xs text-muted-foreground">35</span>
        </button>

        <div className="border-t border-border my-2" />

        {/* カテゴリ */}
        {dummyCategories.map((category) => (
          <button
            key={category.id}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span>{category.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {category.count}
            </span>
          </button>
        ))}

        <div className="border-t border-border my-2" />

        {/* ゴミ箱 */}
        <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span>ゴミ箱</span>
          </div>
          <span className="text-xs text-muted-foreground">3</span>
        </button>
      </div>
    </div>
  );
}
