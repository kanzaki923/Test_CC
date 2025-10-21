# 🚀 高速メモアプリ

Next.js 15で構築された、最高のユーザビリティを提供する高速メモアプリケーション

## ✨ 特徴

### パフォーマンス

- ⚡ **超高速**: 仮想スクロールで1000件以上のメモも60fps表示
- 💾 **即座に保存**: 楽観的UI更新で操作を一切妨げない
- 🎯 **ゼロローディング**: Next.js 15のPartial Prerenderingを活用
- 🔍 **高速検索**: Web Workerによるバックグラウンド検索

### 機能

- 📝 **メモ管理**: 作成、編集、削除、ピン留め
- 🏷️ **カテゴリ**: メモを色分けして整理
- 🔎 **全文検索**: タイトルと本文をリアルタイム検索
- 📊 **ソート**: 更新日時、作成日時、タイトルで並び替え
- 💾 **自動保存**: 300msデバウンスによる自動保存
- 📱 **完全レスポンシブ**: モバイル、タブレット、デスクトップ対応

### UX/UI

- 🎨 **モダンデザイン**: Tailwind CSSによる洗練されたUI
- 🌙 **ダークモード**: ライト/ダークモード切り替え
- ♿ **アクセシブル**: WCAG 2.1 AA準拠
- ⌨️ **キーボードショートカット**: パワーユーザー向け
- 📱 **スワイプジェスチャー**: モバイル最適化

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **状態管理**: Zustand
- **データ永続化**: IndexedDB + LocalStorage
- **スタイリング**: Tailwind CSS
- **UI**: Radix UI (ヘッドレスコンポーネント)
- **アニメーション**: Framer Motion
- **仮想スクロール**: TanStack Virtual

## 📁 プロジェクト構成

```
memo-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # ルートレイアウト
│   ├── page.tsx               # ホームページ
│   └── globals.css            # グローバルスタイル
├── components/                 # Reactコンポーネント
│   ├── ui/                    # 基本UIコンポーネント
│   ├── memo/                  # メモ関連コンポーネント
│   ├── category/              # カテゴリ関連コンポーネント
│   └── layout/                # レイアウトコンポーネント
├── lib/                        # ライブラリ・ユーティリティ
│   ├── store/                 # Zustand ストア
│   ├── db/                    # IndexedDB操作
│   ├── hooks/                 # カスタムフック
│   ├── utils/                 # ユーティリティ関数
│   └── workers/               # Web Workers
├── public/                     # 静的ファイル
├── DESIGN.md                   # 設計ドキュメント
├── ARCHITECTURE.md             # アーキテクチャ詳細
└── IMPLEMENTATION_GUIDE.md     # 実装ガイド
```

## 🚀 セットアップ

### 前提条件

- Node.js 18.17以上
- npm または yarn

### インストール

1. **プロジェクトをクローン**

```bash
git clone <repository-url>
cd memo-app
```

2. **依存関係をインストール**

```bash
npm install
```

3. **開発サーバーを起動**

```bash
npm run dev
```

4. **ブラウザで開く**

```
http://localhost:3000
```

## 📚 ドキュメント

詳細な設計・実装ドキュメントは以下を参照してください:

1. **[DESIGN.md](./DESIGN.md)** - プロジェクト設計ドキュメント
   - 技術スタック
   - データモデル
   - UX/UI設計方針
   - パフォーマンス目標

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - アーキテクチャ詳細
   - 状態管理アーキテクチャ
   - データフロー
   - コンポーネント設計
   - 具体的な実装例

3. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - 実装ガイド
   - フェーズごとの実装手順
   - チェックリスト
   - よくある問題と解決策

## 🎯 実装の進め方

### Phase 1: 基盤構築（推奨1日）

- [ ] Next.jsプロジェクトのセットアップ
- [ ] Zustandストアの実装
- [ ] IndexedDB永続化レイヤー
- [ ] TypeScript型定義

**参照**: [IMPLEMENTATION_GUIDE.md - Phase 1-2](./IMPLEMENTATION_GUIDE.md#phase-1-プロジェクトセットアップ)

### Phase 2: UIコンポーネント（推奨2日）

- [ ] Tailwind CSS設定
- [ ] 基本UIコンポーネント（Button, Input等）
- [ ] レスポンシブレイアウト

**参照**: [IMPLEMENTATION_GUIDE.md - Phase 3](./IMPLEMENTATION_GUIDE.md#phase-3-uiコンポーネント基盤)

### Phase 3: メモ機能（推奨2日）

- [ ] メモリスト（仮想スクロール）
- [ ] メモエディタ
- [ ] 自動保存機能
- [ ] CRUD操作

**参照**: [IMPLEMENTATION_GUIDE.md - Phase 4](./IMPLEMENTATION_GUIDE.md#phase-4-メモ機能の実装)

### Phase 4: カテゴリ・検索・ソート（推奨2日）

- [ ] カテゴリサイドバー
- [ ] カテゴリ管理
- [ ] 検索機能（デバウンス + Web Worker）
- [ ] ソート機能

**参照**: [IMPLEMENTATION_GUIDE.md - Phase 5-6](./IMPLEMENTATION_GUIDE.md#phase-5-カテゴリ機能)

### Phase 5: 最適化・仕上げ（推奨1日）

- [ ] パフォーマンス最適化
- [ ] アクセシビリティ対応
- [ ] キーボードショートカット
- [ ] モバイルジェスチャー

**参照**: [IMPLEMENTATION_GUIDE.md - Phase 8](./IMPLEMENTATION_GUIDE.md#phase-8-パフォーマンス最適化)

## ⌨️ キーボードショートカット

| ショートカット | 機能 |
|--------------|------|
| `Cmd/Ctrl + N` | 新規メモ作成 |
| `Cmd/Ctrl + K` | 検索を開く |
| `Cmd/Ctrl + S` | 手動保存（視覚的フィードバック） |
| `Esc` | モーダルを閉じる |
| `↑/↓` | メモリストをナビゲート |

## 📱 対応ブラウザ

- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

## 🎨 デザインシステム

### カラーパレット

**ライトモード**
- Background: `#FFFFFF`
- Foreground: `#0F172A`
- Primary: `#3B82F6`
- Secondary: `#F1F5F9`

**ダークモード**
- Background: `#0F172A`
- Foreground: `#E2E8F0`
- Primary: `#60A5FA`
- Secondary: `#1E293B`

### タイポグラフィ

- **フォント**: Inter (システムフォント)
- **見出し**: 700 (Bold)
- **本文**: 400 (Regular)
- **メモ内容**: Fira Code / Source Code Pro（等幅）

## 🧪 テスト

### ユニットテスト

```bash
npm test
```

### E2Eテスト

```bash
npm run test:e2e
```

### Lighthouse スコア

```bash
npm run build
npm start
npx lighthouse http://localhost:3000 --view
```

**目標スコア**:
- Performance: 95+
- Accessibility: 100
- Best Practices: 95+
- SEO: 95+

## 🚀 デプロイ

### Vercel（推奨）

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ
vercel
```

### 手動デプロイ

```bash
# ビルド
npm run build

# 起動
npm start
```

## 📈 パフォーマンス目標

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 1.0s
- **FID** (First Input Delay): < 50ms
- **CLS** (Cumulative Layout Shift): < 0.1

### カスタムメトリクス

- **初回ペイント**: < 500ms
- **メモリスト表示**: < 100ms
- **検索結果表示**: < 200ms（1000件）
- **メモ保存**: < 50ms（楽観的更新）
- **スクロールFPS**: 60fps以上

## 🔮 将来の拡張機能

- [ ] Markdown高度記法（テーブル、絵文字、数式）
- [ ] ファイル添付（画像、PDF）
- [ ] メモのエクスポート（Markdown, JSON, PDF）
- [ ] クラウド同期（Google Drive, Dropbox）
- [ ] コラボレーション機能
- [ ] AIアシスタント（要約、翻訳、提案）
- [ ] PWA対応（オフライン編集）
- [ ] メモのバージョン履歴
- [ ] カスタムテーマ

## 🤝 コントリビューション

コントリビューションを歓迎します！以下の手順でお願いします:

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

MIT License

## 👤 作成者

あなたの名前

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Zustand](https://github.com/pmndrs/zustand) - 状態管理
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [Radix UI](https://www.radix-ui.com/) - UIコンポーネント
- [TanStack Virtual](https://tanstack.com/virtual) - 仮想スクロール

---

**Happy Coding!** 🎉

何か質問があれば、Issueを作成してください。
