# alpine_todo

## 概要

Alpine.js を使ったシンプルな ToDo アプリです。
ブラウザ上で ToDo を管理し、一覧画面と統計画面を行き来しながら状態を確認できます。

## 使用技術

- Alpine.js
- HTML / CSS / JavaScript
- localStorage
- Vitest（テスト実行用）
- ローカル CDN リソース: `../../cdn_resources/alpine.min.js`

## 実装の特徴

- ビルド不要の静的ファイル構成です。
- `Alpine.store()` と `Alpine.data()` を使い、データ管理と画面ロジックを分離しています。
- `index.html` と `stats.html` の 2 画面で同じデータを共有します。
- ToDo データは localStorage に保存され、ブラウザ再読み込み後も維持されます。
- 各 ToDo はタイトルと本文を持ち、一覧からクリックして編集できます。

## ディレクトリ構成

- `js/shared/`: 永続化・通知・ToDoドメインの共通ロジック
- `js/todo/`: 一覧画面のフィルタ、ソート、ドラッグ&ドロップ制御
- `js/stats/`: 統計集計、チャートデータ生成、メッセージ生成
- `js/todoStore.js` / `js/todoApp.js` / `js/stats.js`: Alpine 登録だけを担う薄いエントリファイル

## 起動方法

最も簡単なのは `index.html` をブラウザで直接開く方法です。

- メイン画面: `apps/alpine_todo/index.html`
- 統計画面: `apps/alpine_todo/stats.html`

静的サーバーで確認する場合は、リポジトリルートで次を実行してください。

```powershell
cd c:\CodeRoot\StaticApps
python -m http.server 8000
```

起動後、以下にアクセスします。

- `http://localhost:8000/apps/alpine_todo/index.html`
- `http://localhost:8000/apps/alpine_todo/stats.html`