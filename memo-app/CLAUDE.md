# CLAUDE.md - メモアプリ開発ガイドライン

このドキュメントは、Claude Codeおよび開発者がメモアプリを開発する際の包括的なガイドラインです。

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [開発哲学](#開発哲学)
3. [セットアップ](#セットアップ)
4. [プロジェクト構造](#プロジェクト構造)
5. [開発ワークフロー（TDD）](#開発ワークフロー-tdd)
6. [コンポーネント設計原則](#コンポーネント設計原則)
7. [テスト戦略](#テスト戦略)
8. [状態管理](#状態管理)
9. [コーディング規約](#コーディング規約)
10. [次のステップ](#次のステップ)

---

## プロジェクト概要

高速・高ユーザビリティのメモアプリケーション。Next.js 15のApp Routerを使用し、完全にクライアントサイドで動作します。

### 主要な特徴

- ⚡ **高速**: 仮想スクロール、楽観的UI更新
- 📱 **レスポンシブ**: モバイル・タブレット・デスクトップ対応
- 💾 **オフライン**: IndexedDBによるローカルストレージ
- 🎨 **モダンUI**: Tailwind CSS v4、ダークモード対応
- ♿ **アクセシブル**: WCAG 2.1 AA準拠

### 技術スタック

- **フレームワーク**: Next.js 15.5 (App Router)
- **言語**: TypeScript 5.9
- **スタイリング**: Tailwind CSS v4
- **状態管理**: Zustand (予定)
- **データ永続化**: IndexedDB + LocalStorage
- **テスト**: Jest + React Testing Library + Playwright
- **アイコン**: Lucide React

---

## 開発哲学

### 1. テスト駆動開発（TDD）

このプロジェクトは**テストファースト**のアプローチを採用します。

#### TDDの原則

1. **Red**: まずテストを書く（失敗させる）
2. **Green**: テストをパスする最小限のコードを書く
3. **Refactor**: コードをリファクタリングする

#### なぜTDDか？

- ✅ バグの早期発見
- ✅ リファクタリングの安全性
- ✅ ドキュメントとしての役割
- ✅ 設計の改善

### 2. プレゼンテーショナルコンポーネント設計

コンポーネントは**表示ロジック**と**ビジネスロジック**を明確に分離します。

#### プレゼンテーショナルコンポーネント

- **責務**: UIの描画のみ
- **特徴**: propsを受け取り、コールバックを呼ぶ
- **状態**: ローカルUI状態のみ（開閉状態など）
- **場所**: `components/`ディレクトリ

#### コンテナコンポーネント

- **責務**: データ取得、状態管理、ビジネスロジック
- **特徴**: Zustandストアと連携
- **場所**: `app/`ディレクトリ（Next.js App Router）

### 3. 仕様書駆動開発

すべての機能は以下のドキュメントに基づいて実装します：

- **DESIGN.md**: 全体設計、データモデル、UX方針
- **ARCHITECTURE.md**: アーキテクチャ詳細、実装パターン
- **DESIGN_REVIEW.md**: ユーザビリティレビュー、ペルソナ分析
- **DESIGN_IMPROVEMENTS.md**: 優先度付き改善提案

#### 開発前の確認事項

1. 該当する仕様書のセクションを読む
2. テストケースを考える
3. プレゼンテーショナルコンポーネントを設計する
4. TDDサイクルで実装する

---

## セットアップ

### 初期化（/init）

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd Test_CC/memo-app

# 2. 依存関係をインストール
npm install

# 3. 開発サーバーを起動
npm run dev

# 4. テストを実行
npm test

# 5. ブラウザで確認
# http://localhost:3000
```

### 開発環境の要件

- Node.js 18.17+
- npm 9.0+
- Git
- エディタ（VS Code推奨）

### VS Code 推奨拡張機能

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright"
  ]
}
```

---

## プロジェクト構造

### ディレクトリ構成

```
memo-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ルートレイアウト（RSC）
│   ├── page.tsx                  # ホームページ（Container）
│   └── globals.css               # グローバルスタイル
│
├── components/                   # プレゼンテーショナルコンポーネント
│   ├── ui/                       # 基本UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx       # ← テストファイル
│   │   ├── Input.tsx
│   │   └── Input.test.tsx
│   │
│   ├── memo/                     # メモ関連コンポーネント
│   │   ├── MemoList.tsx          # プレゼンテーショナル
│   │   ├── MemoList.test.tsx
│   │   ├── MemoCard.tsx
│   │   ├── MemoCard.test.tsx
│   │   ├── MemoEditor.tsx
│   │   └── MemoEditor.test.tsx
│   │
│   └── category/                 # カテゴリ関連コンポーネント
│       ├── CategorySidebar.tsx
│       └── CategorySidebar.test.tsx
│
├── lib/                          # ライブラリ・ユーティリティ
│   ├── store/                    # Zustand ストア
│   │   ├── memoStore.ts
│   │   ├── memoStore.test.ts
│   │   ├── categoryStore.ts
│   │   └── uiStore.ts
│   │
│   ├── db/                       # データベース
│   │   ├── indexed-db.ts
│   │   └── indexed-db.test.ts
│   │
│   ├── hooks/                    # カスタムフック
│   │   ├── useMemos.ts
│   │   ├── useMemos.test.ts
│   │   ├── useAutoSave.ts
│   │   └── useSearch.ts
│   │
│   ├── utils/                    # ユーティリティ関数
│   │   ├── cn.ts
│   │   ├── date-utils.ts
│   │   └── date-utils.test.ts
│   │
│   └── types/                    # 型定義
│       └── index.ts
│
├── __tests__/                    # E2Eテスト
│   ├── e2e/
│   │   ├── memo-crud.spec.ts
│   │   ├── category.spec.ts
│   │   └── search.spec.ts
│   └── integration/
│       └── memo-flow.test.ts
│
├── public/                       # 静的ファイル
├── package.json
├── tsconfig.json
├── jest.config.js                # Jestの設定
├── playwright.config.ts          # Playwrightの設定
└── CLAUDE.md                     # このファイル
```

### ファイル命名規則

- **コンポーネント**: PascalCase (`MemoCard.tsx`)
- **テスト**: `*.test.tsx` または `*.spec.tsx`
- **フック**: camelCase、`use`プレフィックス (`useMemos.ts`)
- **ユーティリティ**: kebab-case (`date-utils.ts`)
- **型**: PascalCase (`Memo`, `Category`)

---

## 開発ワークフロー（TDD）

### 新機能の追加手順

#### ステップ1: 仕様の確認

```bash
# 該当する仕様書を確認
# 例: メモの削除機能を追加する場合
cat DESIGN.md | grep -A 10 "削除"
```

#### ステップ2: テストを書く（Red）

```typescript
// components/memo/MemoCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoCard } from './MemoCard';

describe('MemoCard', () => {
  it('should call onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    const memo = {
      id: '1',
      title: 'Test Memo',
      content: 'Content',
      // ...
    };

    render(<MemoCard memo={memo} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByLabelText('削除');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });
});
```

#### ステップ3: テストを実行（失敗を確認）

```bash
npm test MemoCard.test.tsx
# ❌ FAIL: onDelete prop が存在しない
```

#### ステップ4: 最小限のコードを書く（Green）

```typescript
// components/memo/MemoCard.tsx
interface MemoCardProps {
  memo: Memo;
  onDelete?: (id: string) => void; // ← 追加
  // ...
}

export function MemoCard({ memo, onDelete }: MemoCardProps) {
  return (
    <article>
      {/* ... */}
      <button
        onClick={() => onDelete?.(memo.id)}
        aria-label="削除"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </article>
  );
}
```

#### ステップ5: テストを再実行（成功を確認）

```bash
npm test MemoCard.test.tsx
# ✅ PASS: 1 test passed
```

#### ステップ6: リファクタリング（Refactor）

```typescript
// より読みやすく、保守しやすいコードに改善
const handleDelete = useCallback(() => {
  if (onDelete) {
    onDelete(memo.id);
  }
}, [memo.id, onDelete]);
```

#### ステップ7: 統合テストを追加

```typescript
// __tests__/integration/memo-delete.test.ts
describe('Memo deletion flow', () => {
  it('should remove memo from list when deleted', () => {
    // Zustand + コンポーネントの統合テスト
  });
});
```

### 継続的なテスト実行

```bash
# ウォッチモード（開発中）
npm test -- --watch

# カバレッジを確認
npm test -- --coverage
```

---

## コンポーネント設計原則

### プレゼンテーショナルコンポーネントの例

#### ✅ 良い例

```typescript
// components/memo/MemoCard.tsx
interface MemoCardProps {
  memo: Memo;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
}

export function MemoCard({
  memo,
  isSelected,
  onSelect,
  onDelete,
  onPin,
}: MemoCardProps) {
  // ✅ UIロジックのみ
  // ✅ データはpropsから受け取る
  // ✅ 副作用はコールバックで通知

  return (
    <article onClick={() => onSelect(memo.id)}>
      <h3>{memo.title}</h3>
      <p>{memo.content}</p>
      <button onClick={() => onDelete(memo.id)}>削除</button>
      <button onClick={() => onPin(memo.id, !memo.isPinned)}>
        ピン留め
      </button>
    </article>
  );
}
```

#### ❌ 悪い例

```typescript
// ❌ Zustandストアに直接アクセスしている
export function MemoCard({ memo }: { memo: Memo }) {
  const deleteMemo = useMemoStore((state) => state.deleteMemo);
  const pinMemo = useMemoStore((state) => state.pinMemo);

  // ❌ ビジネスロジックがコンポーネント内にある
  const handleDelete = () => {
    if (confirm('本当に削除しますか？')) {
      deleteMemo(memo.id);
      toast({ title: '削除しました' });
    }
  };

  return <article>...</article>;
}
```

### コンテナコンポーネントの例

```typescript
// app/page.tsx (Container Component)
'use client';

import { MemoCard } from '@/components/memo/MemoCard';
import { useMemoStore } from '@/lib/store/memoStore';

export default function HomePage() {
  // ✅ ストアから状態を取得
  const memos = useMemoStore((state) => state.memos);
  const deleteMemo = useMemoStore((state) => state.deleteMemo);
  const pinMemo = useMemoStore((state) => state.pinMemo);

  // ✅ ビジネスロジック
  const handleDelete = (id: string) => {
    if (confirm('本当に削除しますか？')) {
      deleteMemo(id);
      toast({ title: '削除しました' });
    }
  };

  return (
    <div>
      {Array.from(memos.values()).map((memo) => (
        <MemoCard
          key={memo.id}
          memo={memo}
          onDelete={handleDelete}
          onPin={pinMemo}
        />
      ))}
    </div>
  );
}
```

### コンポーネント設計のチェックリスト

プレゼンテーショナルコンポーネントを作成する前に確認：

- [ ] このコンポーネントはpropsのみで動作するか？
- [ ] Zustandストアに直接アクセスしていないか？
- [ ] 副作用（API呼び出し、toast等）がないか？
- [ ] ビジネスロジックがないか？
- [ ] テストしやすいか？
- [ ] Storybookで表示できるか？（将来）

---

## テスト戦略

### テストの種類

#### 1. ユニットテスト（Jest + React Testing Library）

**対象**: 個別のコンポーネント、関数、フック

```typescript
// components/ui/Button.test.tsx
describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### 2. 統合テスト（Jest）

**対象**: 複数のコンポーネント、ストア、フックの組み合わせ

```typescript
// __tests__/integration/memo-crud.test.ts
describe('Memo CRUD operations', () => {
  it('should create, update, and delete a memo', () => {
    const { result } = renderHook(() => useMemoStore());

    // Create
    act(() => {
      const id = result.current.addMemo({
        title: 'Test',
        content: 'Content',
      });
      expect(result.current.memos.get(id)).toBeDefined();
    });

    // Update
    act(() => {
      result.current.updateMemo(id, { title: 'Updated' });
      expect(result.current.memos.get(id)?.title).toBe('Updated');
    });

    // Delete
    act(() => {
      result.current.deleteMemo(id);
      expect(result.current.memos.has(id)).toBe(false);
    });
  });
});
```

#### 3. E2Eテスト（Playwright）

**対象**: ユーザーフローの全体

```typescript
// __tests__/e2e/memo-flow.spec.ts
test('user can create and edit a memo', async ({ page }) => {
  await page.goto('/');

  // 新規メモボタンをクリック
  await page.click('button:has-text("新規メモ")');

  // タイトルを入力
  await page.fill('[placeholder="タイトル"]', 'My First Memo');

  // 本文を入力
  await page.fill('[placeholder="メモを入力..."]', 'This is my memo content');

  // 自動保存を待つ
  await page.waitForSelector('text=保存済み');

  // メモがリストに表示されることを確認
  await expect(page.locator('text=My First Memo')).toBeVisible();
});
```

### テストカバレッジの目標

- **ユニットテスト**: 80%以上
- **統合テスト**: 主要フロー100%
- **E2Eテスト**: クリティカルパス100%

### テストのベストプラクティス

1. **AAA パターン**
   - **Arrange**: テストの準備
   - **Act**: 実行
   - **Assert**: 検証

2. **1テスト1アサーション** (可能な限り)

3. **テストの独立性**: 各テストは他のテストに依存しない

4. **意味のある名前**: `it('should ...')`形式

5. **エッジケースのテスト**: 空配列、null、undefined等

---

## 状態管理

### Zustand ストア設計

#### メモストア

```typescript
// lib/store/memoStore.ts
interface MemoState {
  memos: Map<string, Memo>;

  // Actions
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMemo: (id: string, updates: Partial<Memo>) => void;
  deleteMemo: (id: string) => void;
  pinMemo: (id: string, isPinned: boolean) => void;

  // Selectors
  getMemo: (id: string) => Memo | undefined;
  getPinnedMemos: () => Memo[];
}
```

#### UIストア

```typescript
// lib/store/uiStore.ts
interface UIState {
  selectedMemoId: string | null;
  selectedCategoryId: string | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
  searchQuery: string;

  // Actions
  setSelectedMemo: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  // ...
}
```

### ストアの使用方法

#### コンポーネント内

```typescript
// ❌ 避ける: ストア全体を購読
const store = useMemoStore();

// ✅ 推奨: 必要な部分だけ購読
const memos = useMemoStore((state) => state.memos);
const addMemo = useMemoStore((state) => state.addMemo);
```

---

## コーディング規約

### TypeScript

- **厳格モード**: `strict: true`
- **型推論**: 可能な限り型推論を活用
- **any禁止**: `no-explicit-any` (ESLint)

### React

- **関数コンポーネント**: アロー関数ではなく`function`宣言
- **Hooks**: カスタムフックは`use`プレフィックス
- **Props**: インターフェースで定義

### CSS/Tailwind

- **ユーティリティファースト**: Tailwindを優先
- **カスタムクラス**: 本当に必要な場合のみ
- **レスポンシブ**: モバイルファースト

### Git

- **ブランチ命名**: `feature/機能名`, `fix/バグ名`
- **コミットメッセージ**: 英語、現在形、動詞から始める
  - `Add memo deletion feature`
  - `Fix search query encoding`
  - `Refactor MemoCard component`

### コメント

- **why, not what**: 「なぜ」を説明、「何を」は不要
- **複雑なロジック**: コメントで説明
- **TODO**: `// TODO: 説明` で残す

---

## 次のステップ

### Phase 1: テスト環境のセットアップ（優先度: 最高）

- [ ] Jest + React Testing Libraryの設定
- [ ] Playwrightの設定
- [ ] テストユーティリティの作成
- [ ] CIパイプラインでのテスト自動実行

### Phase 2: 状態管理の実装（優先度: 高）

#### 2.1 メモストアのテストと実装

```bash
# TDDサイクル
1. lib/store/memoStore.test.ts を作成
2. テストを実行（Red）
3. lib/store/memoStore.ts を実装（Green）
4. リファクタリング（Refactor）
```

#### 2.2 カテゴリストアのテストと実装

#### 2.3 UIストアのテストと実装

### Phase 3: データ永続化（優先度: 高）

- [ ] IndexedDBラッパーのテストと実装
- [ ] LocalStorageとの統合
- [ ] データマイグレーション戦略

### Phase 4: コンポーネントのリファクタリング（優先度: 中）

既存のコンポーネントをプレゼンテーショナルに変更：

- [ ] MemoCard: ストア依存を削除、propsで受け取る
- [ ] MemoList: onSelectなどのコールバックを追加
- [ ] MemoEditor: onChangeコールバックで状態を親に伝える
- [ ] CategorySidebar: 選択状態をpropsで受け取る

### Phase 5: 検索・ソート機能（優先度: 中）

- [ ] Web Workerによる検索のテストと実装
- [ ] ソート機能のテストと実装
- [ ] デバウンス処理

### Phase 6: UX改善（優先度: 低）

- [ ] キーボードショートカット
- [ ] トースト通知システム
- [ ] オンボーディング
- [ ] ゴミ箱機能

---

## 開発時の参照ドキュメント

### 仕様書

1. **DESIGN.md**: 機能要件、データモデル、UX方針
2. **ARCHITECTURE.md**: 技術的実装パターン
3. **DESIGN_REVIEW.md**: ユーザビリティレビュー
4. **DESIGN_IMPROVEMENTS.md**: 優先度付き改善案

### 外部ドキュメント

- [Next.js Docs](https://nextjs.org/docs)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/docs/intro)

---

## トラブルシューティング

### テストが失敗する

```bash
# キャッシュをクリア
npm test -- --clearCache

# 特定のテストのみ実行
npm test MemoCard.test.tsx

# デバッグモード
node --inspect-brk node_modules/.bin/jest --runInBand
```

### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# 型チェック
npx tsc --noEmit
```

---

## まとめ

このプロジェクトの開発では：

1. **テストファースト**: コードを書く前にテストを書く
2. **プレゼンテーショナルコンポーネント**: UIとロジックを分離
3. **仕様書駆動**: DESIGN.mdに基づいて実装
4. **継続的改善**: Red-Green-Refactorサイクル

**Happy Testing & Coding!** 🧪✨

---

**最終更新**: 2025-10-21
**バージョン**: 1.0.0
