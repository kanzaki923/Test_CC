"use client";

import { Input } from "@/components/ui/Input";
import { useEffect, useState, useRef } from "react";
import { useMemoStore } from "@/lib/store/memoStore";
import { useTagStore } from "@/lib/store/tagStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { TagInput } from "@/components/tag/TagInput";

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
  const allTags = useTagStore((state) => state.getAllTags());
  const addTag = useTagStore((state) => state.addTag);
  const addToast = useToastStore((state) => state.addToast);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const isFirstSave = useRef(true);

  // Manual save function (triggered by Cmd+S)
  const handleManualSave = () => {
    if (!memoId) return;

    const memo = memos.get(memoId);
    if (!memo) return;

    // Only save if there are changes
    const tagsChanged = JSON.stringify(memo.tags) !== JSON.stringify(tags);
    if (memo.title !== title || memo.content !== content || tagsChanged) {
      updateMemo(memoId, { title, content, tags });
      addToast({
        message: "メモを保存しました",
        type: "success",
        duration: 2000,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  // Register Cmd+S shortcut for manual save
  useKeyboardShortcuts({
    'mod+s': handleManualSave,
  });

  // Tag handlers
  const handleAddTag = (tagName: string) => {
    // Create tag in store if it doesn't exist (with default color)
    const existingTag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (!existingTag) {
      const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      addTag(tagName, randomColor);
    }

    setTags(prev => [...prev, tagName]);
  };

  const handleRemoveTag = (tagName: string) => {
    setTags(prev => prev.filter(t => t !== tagName));
  };

  // Load memo data when memoId changes
  useEffect(() => {
    if (memoId) {
      const memo = memos.get(memoId);
      if (memo) {
        setTitle(memo.title);
        setContent(memo.content);
        setTags(memo.tags || []);
      }
    } else {
      setTitle("");
      setContent("");
      setTags([]);
    }
    isFirstSave.current = true;
  }, [memoId, memos]);

  // Auto-save with debounce (silent, no toast notification)
  useEffect(() => {
    if (!memoId) return;

    const memo = memos.get(memoId);
    if (!memo) return;

    // Check if content has changed
    const tagsChanged = JSON.stringify(memo.tags) !== JSON.stringify(tags);
    if (memo.title === title && memo.content === content && !tagsChanged) {
      return;
    }

    setSaveStatus("saving");

    const timeoutId = setTimeout(() => {
      updateMemo(memoId, { title, content, tags });
      setSaveStatus("saved");

      // Auto-save is silent (no toast notification)
      // Toast only shown on manual save (Cmd+S)

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [memoId, title, content, tags, memos, updateMemo]);

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

        <div className="text-xs text-muted-foreground ml-4 flex items-center gap-2">
          {saveStatus === "saving" && <span>保存中...</span>}
          {saveStatus === "saved" && <span>✓ 保存済み</span>}
          {saveStatus === "idle" && <span className="text-muted-foreground/60">Cmd+S で保存</span>}
        </div>
      </div>

      {/* エディタ */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="メモを入力..."
        className="flex-1 resize-none p-4 focus:outline-none bg-background text-foreground font-mono text-sm"
      />

      {/* タグエリア */}
      <div className="px-4 py-3 border-t border-border bg-background">
        <TagInput
          tags={tags}
          suggestions={allTags.map(t => t.name)}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          placeholder="タグを追加..."
        />
      </div>

      {/* ステータスバー */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-background">
        <span>{content.length} 文字</span>
        <span>最終更新: {formatDate(memo.updatedAt)}</span>
      </div>
    </div>
  );
}
