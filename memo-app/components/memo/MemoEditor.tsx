"use client";

import { Input } from "@/components/ui/Input";
import { useState } from "react";

interface MemoEditorProps {
  memoId: string | null;
}

export function MemoEditor({ memoId }: MemoEditorProps) {
  const [title, setTitle] = useState("プロジェクト会議メモ");
  const [content, setContent] = useState(
    "次回のプロジェクト会議で議論する内容：\n- 新機能の仕様確認\n- スケジュール調整\n- リソース配分"
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  if (!memoId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground bg-background">
        <p>メモを選択してください</p>
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
        <span>最終更新: 10分前</span>
      </div>
    </div>
  );
}
