"use client";

import { Memo } from "@/lib/types";
import { Pin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MemoCardProps {
  memo: Memo;
  isSelected: boolean;
  onClick: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MemoCard({ memo, isSelected, onClick }: MemoCardProps) {
  return (
    <article
      role="article"
      aria-labelledby={`memo-title-${memo.id}`}
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "group relative p-4 border-b border-border cursor-pointer transition-colors",
        "hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      {/* ピン留めアイコン */}
      {memo.isPinned && (
        <Pin className="absolute top-2 right-2 h-4 w-4 text-primary fill-primary" />
      )}

      {/* タイトル */}
      <h3
        id={`memo-title-${memo.id}`}
        className="font-semibold text-foreground mb-1 pr-8"
      >
        {memo.title || "無題のメモ"}
      </h3>

      {/* プレビュー */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
        {memo.content || "メモが空です"}
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
              // ピン留めトグル処理
            }}
            className="p-1 hover:bg-background rounded"
            aria-label={memo.isPinned ? "ピン留めを解除" : "ピン留め"}
          >
            <Pin
              className={cn(
                "h-3 w-3",
                memo.isPinned && "fill-current text-primary"
              )}
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // 削除処理
            }}
            className="p-1 hover:bg-background rounded text-destructive"
            aria-label="削除"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
}
