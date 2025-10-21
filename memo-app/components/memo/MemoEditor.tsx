"use client";

import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import { useMemoStore } from "@/lib/store/memoStore";

interface MemoEditorProps {
  memoId: string | null;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;

  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MemoEditor({ memoId }: MemoEditorProps) {
  const memos = useMemoStore((state) => state.memos);
  const updateMemo = useMemoStore((state) => state.updateMemo);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load memo data when memoId changes
  useEffect(() => {
    if (memoId) {
      const memo = memos.get(memoId);
      if (memo) {
        setTitle(memo.title);
        setContent(memo.content);
      }
    } else {
      setTitle("");
      setContent("");
    }
  }, [memoId, memos]);

  // Auto-save with debounce
  useEffect(() => {
    if (!memoId) return;

    const memo = memos.get(memoId);
    if (!memo) return;

    // Check if content has changed
    if (memo.title === title && memo.content === content) {
      return;
    }

    setSaveStatus("saving");

    const timeoutId = setTimeout(() => {
      updateMemo(memoId, { title, content });
      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [memoId, title, content, memos, updateMemo]);

  if (!memoId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground bg-background">
        <p>メモを選択してください</p>
      </div>
    );
  }

  const memo = memos.get(memoId);
  if (!memo) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground bg-background">
        <p>メモが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル"
          className="text-lg font-semibold border-none focus-visible:ring-0 shadow-none px-0"
        />

        <div className="text-xs text-muted-foreground ml-4">
          {saveStatus === "saving" && "保存中..."}
          {saveStatus === "saved" && "✓ 保存済み"}
        </div>
      </div>

      {/* エディタ */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="メモを入力..."
        className="flex-1 resize-none p-4 focus:outline-none bg-background text-foreground font-mono text-sm"
      />

      {/* ステータスバー */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-background">
        <span>{content.length} 文字</span>
        <span>最終更新: {formatDate(memo.updatedAt)}</span>
      </div>
    </div>
  );
}
