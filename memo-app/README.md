# メモアプリ プロトタイプ

Next.js 15で構築された高速・高ユーザビリティのメモアプリケーションのUIプロトタイプです。

## スクリーンショット

現在のプロトタイプには以下の機能が含まれています：

- ✅ レスポンシブレイアウト（モバイル・タブレット・デスクトップ対応）
- ✅ カテゴリサイドバー（ダミーデータ）
- ✅ メモリスト（5件のサンプルメモ）
- ✅ メモエディタ（タイトル・本文編集UI）
- ✅ 検索バー・ツールバー
- ✅ ピン留め・削除アクション（UIのみ）
- ✅ リアルタイム日付フォーマット（「10分前」など）

## 技術スタック

- **Next.js 15.5** - App Router
- **Tailwind CSS v4** - @tailwindcss/postcss使用
- **TypeScript** - 型安全性
- **Lucide React** - アイコンライブラリ
- **Class Variance Authority** - コンポーネントバリアント管理

## セットアップ

### 前提条件

- Node.js 18.17以上
- npm

### インストール

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

### ビルド

```bash
# プロダクションビルド
npm run build

# ビルドしたアプリを起動
npm start
```

## プロジェクト構成

```
memo-app/
├── app/
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # ホームページ
│   └── globals.css             # グローバルスタイル
├── components/
│   ├── ui/
│   │   ├── Button.tsx          # ボタンコンポーネント
│   │   └── Input.tsx           # 入力コンポーネント
│   ├── memo/
│   │   ├── MemoList.tsx        # メモリスト
│   │   ├── MemoCard.tsx        # メモカード
│   │   └── MemoEditor.tsx      # メモエディタ
│   └── category/
│       └── CategorySidebar.tsx # カテゴリサイドバー
├── lib/
│   ├── types/
│   │   └── index.ts            # 型定義
│   └── utils/
│       └── cn.ts               # クラス名ユーティリティ
├── package.json
├── tsconfig.json
├── next.config.mjs
└── postcss.config.mjs
```

## コンポーネント

### Button

バリアント付きボタンコンポーネント：

```tsx
<Button variant="default">デフォルト</Button>
<Button variant="outline">アウトライン</Button>
<Button variant="ghost">ゴースト</Button>
<Button variant="destructive">危険</Button>
```

サイズ：`sm`, `default`, `lg`, `icon`

### Input

テキスト入力コンポーネント：

```tsx
<Input placeholder="検索..." />
```

### MemoCard

メモを表示するカードコンポーネント。ピン留めアイコン、日付フォーマット、ホバー時のアクションボタンを含みます。

### MemoEditor

タイトルと本文を編集するエディタコンポーネント。保存ステータスと文字数カウンターを表示。

### CategorySidebar

カテゴリリストを表示するサイドバー。各カテゴリのメモ数を表示。

## ダミーデータ

現在、以下のダミーデータが含まれています：

### メモ

1. プロジェクト会議メモ（ピン留め）
2. 買い物リスト
3. アプリのアイデア
4. TypeScriptの学習メモ
5. 週末の予定

### カテゴリ

1. 仕事（青）
2. プライベート（緑）
3. アイデア（オレンジ）

## レスポンシブデザイン

### モバイル（< 768px）
- カテゴリサイドバー非表示
- メモリストのみ表示（全幅）
- メモエディタ非表示（モーダルで開く想定）

### タブレット（768px - 1024px）
- カテゴリサイドバー表示
- メモリスト表示
- メモエディタ非表示

### デスクトップ（> 1024px）
- カテゴリサイドバー表示
- メモリスト表示（50%幅）
- メモエディタ表示（50%幅）

## 次のステップ

このプロトタイプを完全なアプリケーションにするために必要な実装：

### Phase 1: 状態管理
- [ ] Zustandストアの実装
- [ ] メモのCRUD操作
- [ ] カテゴリ管理

### Phase 2: データ永続化
- [ ] IndexedDB統合
- [ ] LocalStorageとのハイブリッド
- [ ] 自動保存機能

### Phase 3: 検索・ソート
- [ ] 全文検索機能
- [ ] Web Workerによる高速検索
- [ ] ソート機能実装

### Phase 4: UX改善
- [ ] キーボードショートカット
- [ ] モバイルジェスチャー（スワイプ）
- [ ] オンボーディングチュートリアル
- [ ] トースト通知

### Phase 5: 高度な機能
- [ ] ゴミ箱機能
- [ ] Markdownサポート
- [ ] ダークモード切り替え
- [ ] エクスポート機能

## ビルド情報

プロダクションビルド結果：

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    12.6 kB         114 kB
└ ○ /_not-found                            995 B         103 kB
+ First Load JS shared by all             102 kB
```

- ✅ ビルド成功
- ✅ 静的ページ生成
- ✅ First Load JS: 114 kB（最適化済み）

## 開発ガイドライン

### カラーシステム

プロジェクトはCSS変数を使用したカラーシステムを使用：

- `--background`, `--foreground`: 背景と前景色
- `--primary`, `--secondary`: プライマリ・セカンダリカラー
- `--muted`, `--accent`: ミュート・アクセントカラー
- `--destructive`: 危険なアクション用
- `--border`, `--input`, `--ring`: UIエレメント用

ダークモードは `.dark` クラスで切り替え可能。

### ユーティリティクラス

- `.scrollbar-thin`: カスタムスクロールバー
- Tailwindの標準クラスをすべて使用可能

## トラブルシューティング

### ビルドエラー

Tailwind CSS v4を使用しているため、古い設定ファイル（`tailwind.config.js`）は不要です。

### Google Fonts エラー

ネットワーク接続の問題を避けるため、システムフォント（font-sans）を使用しています。

## ライセンス

MIT

## 作成者

Claude Code

---

**Happy Coding!** 🎉
