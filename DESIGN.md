# メモアプリ設計ドキュメント

## 1. プロジェクト概要

高速で応答性の高い、スマホ対応のメモアプリケーション。Next.jsの最新機能を活用し、ユーザー操作を一切妨げない最高のUXを提供する。

## 2. 技術スタック

### コアフレームワーク
- **Next.js 15** (App Router)
  - React Server Components (RSC) でページ構造を最適化
  - Client Components で動的な操作を実装
  - Partial Prerendering で初期表示を高速化
- **React 19**
  - useOptimistic で楽観的UI更新
  - useTransition でノンブロッキング更新
  - Suspense でローディング状態を管理
- **TypeScript** - 型安全性の確保

### 状態管理・データ永続化
- **Zustand** - 軽量で高速な状態管理
  - メモ一覧の管理
  - カテゴリ管理
  - フィルタ・ソート状態
  - ミドルウェアでLocalStorageと自動同期
- **IndexedDB (idb-keyval)** - 大量データの永続化
  - メモ本文の保存（LocalStorageの容量制限を回避）
  - 添付ファイル対応の将来拡張性

### UI・スタイリング
- **Tailwind CSS** - ユーティリティファーストのスタイリング
  - モバイルファーストのレスポンシブデザイン
  - ダークモード対応
  - カスタムアニメーション
- **Framer Motion** - 滑らかなアニメーション
  - ページ遷移
  - リスト項目の追加/削除アニメーション
  - スワイプジェスチャー
- **Radix UI** - アクセシブルなヘッドレスコンポーネント
  - ドロップダウンメニュー
  - ダイアログ
  - セレクトボックス

### パフォーマンス最適化
- **React Virtual (TanStack Virtual)** - 仮想スクロール
  - 1000件以上のメモでも高速表示
  - メモリ効率の最大化
- **use-debounce** - 検索とオートセーブのデバウンス
- **Web Workers** - 重い処理のオフロード
  - 全文検索
  - データのソート・フィルタリング

## 3. データモデル

```typescript
interface Memo {
  id: string;                    // UUID v4
  title: string;                 // タイトル（空の場合は本文の最初の行）
  content: string;               // メモ本文（Markdown対応）
  categoryId: string | null;     // カテゴリID
  createdAt: number;             // Unix timestamp (ms)
  updatedAt: number;             // Unix timestamp (ms)
  isPinned: boolean;             // ピン留め
  tags: string[];                // タグ（将来拡張）
}

interface Category {
  id: string;                    // UUID v4
  name: string;                  // カテゴリ名
  color: string;                 // カラーコード（#hex）
  icon?: string;                 // アイコン名（将来拡張）
  order: number;                 // 表示順序
  createdAt: number;
}

interface AppState {
  memos: Map<string, Memo>;      // メモの Map（高速検索）
  categories: Map<string, Category>;

  // UI状態
  selectedMemoId: string | null;
  selectedCategoryId: string | null; // null = すべて
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  viewMode: 'list' | 'grid' | 'compact';
}
```

## 4. アーキテクチャ設計

### 4.1 ディレクトリ構造

```
app/
├── layout.tsx                 # ルートレイアウト（RSC）
├── page.tsx                   # ホームページ（RSC）
├── globals.css                # グローバルスタイル
└── memo/
    └── [id]/
        └── page.tsx           # メモ詳細ページ（RSC）

components/
├── ui/                        # 再利用可能なUIコンポーネント
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Dropdown.tsx
│   └── Dialog.tsx
├── memo/
│   ├── MemoList.tsx           # メモリスト（仮想化）
│   ├── MemoCard.tsx           # メモカード
│   ├── MemoEditor.tsx         # メモエディタ
│   └── MemoSearch.tsx         # 検索バー
├── category/
│   ├── CategorySidebar.tsx    # カテゴリサイドバー
│   └── CategoryManager.tsx    # カテゴリ管理
└── layout/
    ├── Header.tsx             # ヘッダー
    ├── Sidebar.tsx            # サイドバー（PC）
    └── MobileNav.tsx          # モバイルナビゲーション

lib/
├── store/
│   ├── memoStore.ts           # Zustand メモストア
│   ├── categoryStore.ts       # Zustand カテゴリストア
│   └── uiStore.ts             # Zustand UI状態ストア
├── db/
│   └── indexed-db.ts          # IndexedDB操作
├── hooks/
│   ├── useMemos.ts            # メモ操作フック
│   ├── useCategories.ts       # カテゴリ操作フック
│   ├── useSearch.ts           # 検索フック
│   └── useAutoSave.ts         # オートセーブフック
├── utils/
│   ├── memo-utils.ts          # メモ関連ユーティリティ
│   ├── date-utils.ts          # 日付フォーマット
│   └── search-utils.ts        # 検索ロジック
└── workers/
    └── search-worker.ts       # 検索用 Web Worker

public/
└── icons/                     # カスタムアイコン
```

### 4.2 データフロー

```
┌─────────────────────────────────────────────────┐
│                  UI Component                    │
│  (MemoEditor, MemoList, CategorySidebar, etc.)  │
└─────────────────┬───────────────────────────────┘
                  │
                  │ hooks (useMemos, useCategories)
                  │
┌─────────────────▼───────────────────────────────┐
│              Zustand Store                       │
│  ┌─────────────┬────────────┬─────────────┐    │
│  │ memoStore   │ catStore   │  uiStore    │    │
│  └─────────────┴────────────┴─────────────┘    │
└─────────────────┬───────────────────────────────┘
                  │
                  │ middleware (persist)
                  │
┌─────────────────▼───────────────────────────────┐
│          Data Persistence Layer                  │
│  ┌──────────────────┬──────────────────────┐   │
│  │  LocalStorage    │    IndexedDB         │   │
│  │  (metadata)      │    (content)         │   │
│  └──────────────────┴──────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### 4.3 レンダリング戦略

1. **Server Components (RSC)**
   - ページレイアウト（layout.tsx）
   - 静的なヘッダー・フッター
   - SEO最適化が必要な部分

2. **Client Components**
   - メモエディタ（インタラクティブ）
   - メモリスト（仮想スクロール）
   - カテゴリサイドバー（ドラッグ&ドロップ）
   - 検索バー（リアルタイム検索）

3. **動的インポート**
   - メモエディタの重いライブラリ（Markdown解析など）
   - カテゴリ管理モーダル
   - 設定画面

## 5. UX/UIデザイン方針

### 5.1 ユーザー操作を妨げない設計

#### 楽観的UI更新
```typescript
// メモ保存時、即座にUIを更新し、バックグラウンドで永続化
const saveMemo = async (memo: Memo) => {
  // 1. 即座にUIを更新（楽観的更新）
  setMemos((prev) => new Map(prev).set(memo.id, memo));

  // 2. バックグラウンドで永続化（ノンブロッキング）
  await persistToIndexedDB(memo);
};
```

#### デバウンスによる自動保存
```typescript
// 入力中は頻繁に保存せず、300msの待機後に保存
const debouncedSave = useDebouncedCallback(
  (content: string) => saveMemo({ ...currentMemo, content }),
  300
);
```

#### キーボードショートカット
- `Cmd/Ctrl + N`: 新規メモ
- `Cmd/Ctrl + K`: 検索
- `Cmd/Ctrl + S`: 手動保存（視覚的フィードバック）
- `Esc`: モーダルを閉じる

### 5.2 モバイル最適化

#### タッチジェスチャー
- **スワイプ操作**: メモを左スワイプで削除、右スワイプでピン留め
- **プルトゥリフレッシュ**: 下にスワイプで更新
- **長押し**: メモの詳細メニュー表示

#### レスポンシブレイアウト
```
Mobile (< 768px):
┌────────────────────┐
│     Header         │
├────────────────────┤
│                    │
│    Memo List       │
│   (Full Width)     │
│                    │
└────────────────────┘

Tablet (768px - 1024px):
┌──────┬─────────────┐
│ Cat  │   Memo      │
│ Side │   List      │
│ bar  │             │
└──────┴─────────────┘

Desktop (> 1024px):
┌──────┬─────────┬───────┐
│ Cat  │  Memo   │ Memo  │
│ Side │  List   │ Detail│
│ bar  │         │ Panel │
└──────┴─────────┴───────┘
```

#### パフォーマンス最適化
- **画像の遅延読み込み**: Next.js Image コンポーネント
- **仮想スクロール**: 1000件のメモでも60fps維持
- **コード分割**: ルートベースの自動分割
- **プリフェッチ**: Next.js Link による自動プリフェッチ

### 5.3 ビジュアルデザイン

#### カラーパレット
```css
/* ライトモード */
--background: 0 0% 100%;
--foreground: 222 47% 11%;
--primary: 221 83% 53%;
--secondary: 210 40% 96%;
--accent: 210 40% 96%;
--muted: 210 40% 96%;

/* ダークモード */
--background: 224 71% 4%;
--foreground: 213 31% 91%;
--primary: 217 91% 60%;
--secondary: 222 47% 11%;
--accent: 216 34% 17%;
--muted: 223 47% 11%;
```

#### タイポグラフィ
- **見出し**: Inter (700)
- **本文**: Inter (400)
- **メモ内容**: Fira Code / Source Code Pro（等幅フォント、Markdown表示に最適）

#### アニメーション
- **ページ遷移**: 150ms のフェードイン
- **リスト項目**: 200ms のスライドイン
- **ホバー効果**: 100ms のスケール変化
- **削除**: 300ms のスライドアウト + フェードアウト

## 6. 機能要件詳細

### 6.1 メモ管理

#### 作成
- ワンクリックで新規メモ作成
- タイトルは任意（未入力時は本文の最初の行を使用）
- Markdown記法対応（見出し、リスト、コードブロック）

#### 編集
- リアルタイムプレビュー（サイドバイサイド or 切り替え）
- 自動保存（300msデバウンス）
- 保存状態の視覚的フィードバック（"保存中...", "保存済み"）

#### 削除
- ゴミ箱機能（30日間保持）
- 完全削除の確認ダイアログ
- 一括削除機能

#### ピン留め
- 重要なメモを上部に固定
- ピン留めメモは別セクションで表示

### 6.2 カテゴリ管理

- カテゴリの作成・編集・削除
- カラーコード設定（視覚的識別）
- ドラッグ&ドロップで並び替え
- カテゴリごとのメモ件数表示
- "未分類" カテゴリは自動で存在

### 6.3 ソート機能

3つのソート基準 × 2つの順序 = 6パターン
- **更新日時**: 最近更新したメモを表示（デフォルト）
- **作成日時**: 古いメモから順に表示
- **タイトル**: アルファベット順・あいうえお順

### 6.4 検索機能

#### リアルタイム検索
- タイトル・本文を全文検索
- 300msデバウンス（サーバー負荷軽減）
- 検索結果のハイライト表示

#### 高度な検索（将来拡張）
- タグ検索: `#tag`
- カテゴリ検索: `category:work`
- 日付範囲検索: `created:2024-01-01..2024-12-31`

#### Web Worker による高速検索
```typescript
// メインスレッドをブロックせず、バックグラウンドで検索
postMessage({ type: 'SEARCH', query, memos });
```

### 6.5 表示モード

- **リストビュー**: タイトル + プレビュー（デフォルト）
- **グリッドビュー**: カード形式（タブレット・PC向け）
- **コンパクトビュー**: タイトルのみ（大量メモの一覧性）

## 7. パフォーマンス目標

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 1.0s
- **FID (First Input Delay)**: < 50ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### カスタムメトリクス
- **初回ペイント**: < 500ms
- **メモリスト表示**: < 100ms
- **検索結果表示**: < 200ms（1000件のメモ）
- **メモ保存**: < 50ms（楽観的更新）
- **スクロールFPS**: 60fps以上

### バンドルサイズ
- **初期JS**: < 150KB (gzip)
- **初期CSS**: < 20KB (gzip)
- **TTI (Time to Interactive)**: < 2.0s

## 8. アクセシビリティ

- **WCAG 2.1 AA準拠**
- **キーボードナビゲーション**: すべての機能をキーボードで操作可能
- **スクリーンリーダー対応**: ARIA属性の適切な使用
- **フォーカス管理**: 視覚的なフォーカスインジケーター
- **カラーコントラスト**: 4.5:1以上（本文）、3:1以上（UI）

## 9. セキュリティ・プライバシー

- **クライアントサイド完結**: データはすべてユーザーのブラウザに保存
- **サーバーへの送信なし**: プライバシー保護
- **XSS対策**: React の自動エスケープ + DOMPurify（Markdown表示）
- **将来拡張**:
  - エンドツーエンド暗号化（E2EE）
  - クラウド同期（オプトイン）

## 10. 開発フェーズ

### Phase 1: 基盤構築（Week 1）
- [x] Next.js プロジェクトセットアップ
- [x] Tailwind CSS + Radix UI 導入
- [ ] Zustand ストア設計・実装
- [ ] IndexedDB 永続化レイヤー

### Phase 2: コアUI実装（Week 2）
- [ ] レスポンシブレイアウト
- [ ] メモリスト（仮想スクロール）
- [ ] メモエディタ（Markdown対応）
- [ ] カテゴリサイドバー

### Phase 3: 機能実装（Week 3）
- [ ] CRUD操作（作成・読取・更新・削除）
- [ ] カテゴリ管理
- [ ] ソート機能
- [ ] 検索機能（Web Worker）

### Phase 4: UX最適化（Week 4）
- [ ] 楽観的UI更新
- [ ] 自動保存（デバウンス）
- [ ] キーボードショートカット
- [ ] タッチジェスチャー（モバイル）

### Phase 5: パフォーマンス最適化（Week 5）
- [ ] コード分割・遅延読み込み
- [ ] 画像最適化
- [ ] バンドルサイズ削減
- [ ] Lighthouse スコア 95+達成

### Phase 6: テスト・デプロイ（Week 6）
- [ ] ユニットテスト（Jest + React Testing Library）
- [ ] E2Eテスト（Playwright）
- [ ] パフォーマンステスト
- [ ] Vercel デプロイ

## 11. 技術的な課題と解決策

### 課題1: 大量メモの表示パフォーマンス
**解決策**: React Virtual による仮想スクロール
- DOM要素を表示領域のみに限定
- 1万件のメモでも高速表示

### 課題2: 検索の高速化
**解決策**: Web Worker + インデックス化
- メインスレッドをブロックしない
- 前方一致検索のためのトライ木構造

### 課題3: データの永続化
**解決策**: IndexedDB + LocalStorage のハイブリッド
- メタデータはLocalStorage（高速アクセス）
- メモ本文はIndexedDB（大容量）

### 課題4: モバイルでのタッチ操作
**解決策**: Framer Motion + カスタムジェスチャー
- スワイプ削除: `drag` + `dragConstraints`
- スムーズなアニメーション

### 課題5: オフライン対応
**解決策**: Service Worker (PWA)
- オフラインファースト設計
- バックグラウンド同期（将来拡張）

## 12. 成功指標

### ユーザビリティ
- メモ作成から保存まで **3秒以内**
- 検索結果表示 **0.2秒以内**（1000件）
- ページ遷移 **0.1秒以内**

### パフォーマンス
- Lighthouse Performance スコア **95+**
- Mobile スコア **90+**
- バンドルサイズ **200KB以下** (gzip)

### アクセシビリティ
- Lighthouse Accessibility スコア **100**
- キーボード操作 **100%対応**

## 13. 将来の拡張機能

- [ ] Markdown の高度な記法（テーブル、絵文字、数式）
- [ ] ファイル添付（画像、PDF）
- [ ] メモのエクスポート（Markdown, JSON, PDF）
- [ ] クラウド同期（Google Drive, Dropbox）
- [ ] コラボレーション機能（共有メモ）
- [ ] AIアシスタント（要約、翻訳、提案）
- [ ] オフライン編集 + 自動同期
- [ ] ダークモード自動切り替え（時刻ベース）
- [ ] メモのバージョン履歴
- [ ] カスタムテーマ

---

**最終更新**: 2025-10-21
**バージョン**: 1.0.0
