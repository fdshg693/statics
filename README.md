# StaticApps

`apps/` 配下に複数の独立した Web アプリをまとめた、静的配信向けのリポジトリです。
素の HTML/CSS/JavaScript だけで動くアプリや TypeScript/Vite でビルドした成果物の静的配信をメインとしつつ、ローカル動作確認のための配信サーバーや、最低限のAPIを提供するPythonバックエンド（`python_backend`）も内包しています。

アプリごとの詳細は、それぞれの `apps/<project_name>/README.md` を参照してください。

## プロジェクト構成

```text
StaticApps/
├── apps/             # 独立したアプリケーション群（8個）
├── cdn_resources/    # 共通で使うローカル配信ライブラリ
├── experiments/      # 技術検証用のファイル・プロジェクト
├── python_backend/   # ローカル配信サーバーおよびAPIバックエンド用のPythonワークスペース
└── README.md         # このファイル
```

## アプリケーション一覧

- [`apps/alpine_todo`](apps/alpine_todo/README.md)
  Alpine.js を使った ToDo アプリ。追加・編集・削除、完了状態の切り替え、フィルタリング、統計表示に対応しています。

- [`apps/blackjack`](apps/blackjack/README.md)
  ES Modules で責務分離したブラックジャックゲーム。ベット、ダブルダウン、サレンダー、コイン管理を備えています。

- [`apps/simple_login`](apps/simple_login/README.md)
  TypeScript + ES Modules で実装された認証サンプル。`ts/` を編集し、`tsc` で `js/` にコンパイルして利用します。

- [`apps/vanilla_circle_cross`](apps/vanilla_circle_cross/README.md)
  バニラ JavaScript の〇×ゲーム。ボードサイズや勝利条件を変更できるモジュール構成の実装です。

- [`apps/vue_janken`](apps/vue_janken/README.md)
  Vue 3 Composition API で作られたじゃんけんゲーム。履歴、統計グラフ、LocalStorage 永続化に対応しています。

- [`apps/htmx_sugoroku`](apps/htmx_sugoroku/README.md)
  HTMX を題材にしつつ、現在は TypeScript + Vite + OpenAPI + MSW を使って構成されたアプリです。開発時はモック API でも実バックエンド接続でも確認でき、ビルド成果物は `dist/` に出力されます。

- [`apps/vue_rpg`](apps/vue_rpg/README.md)
  Vue 3 + TypeScript のターン制 RPG。戦闘、セーブ履歴、アイテム、複数画面構成を持ち、`ts/` をコンパイルして `js/` を生成します。

- [`apps/svelte_baseball`](apps/svelte_baseball/README.md)
  Svelte + TypeScript + Vite の野球ゲーム。`config.yaml` を持たず、素の Vite (`npm run dev`/`build`) で動作します。

## 開発時の共通ルール

- TypeScript で管理されているアプリは、生成済みの `js/` や `dist/` を直接編集せず、必ずソース側を編集してください。
  - `apps/simple_login`: `ts/` を編集して `js/` へ出力
  - `apps/vue_rpg`: `ts/` を編集して `js/` へ出力
  - `apps/htmx_sugoroku`: `src/` を編集して `dist/` へビルド

- `config.yaml` があるアプリは、ローカルサーバー経由での配信を前提にしています。
  ES Modules を使うアプリも多いため、基本的にはファイル直開きではなくサーバー経由での確認を推奨します。

- CDN を使う場合は、外部 URL ではなく `cdn_resources/` 配下のローカルファイルを優先します。

## よくある実行方法

### `simple_login` / `vue_rpg`

```powershell
# TypeScript をコンパイル
tsc -p apps/simple_login/tsconfig.json
tsc -p apps/vue_rpg/tsconfig.json
```

### `htmx_sugoroku`

```powershell
cd apps/htmx_sugoroku
npm install
npm run dev
```

```powershell
cd apps/htmx_sugoroku
npm run build
```

### `config.yaml` を使って配信する場合

```powershell
# Pythonバックエンドのワークスペースへ移動
cd python_backend

# 共通ローカルサーバーを起動し、対象アプリを配信
uv run simple-deliver ..\apps\<app_name>\config.yaml
```

### `htmx_sugoroku_server` (API バックエンド) を起動する場合

```powershell
# Pythonバックエンドのワークスペースへ移動
cd python_backend

# APIバックエンドサーバーを起動
uv run htmx-sugoroku-server
```

起動方法や前提条件はアプリごとに異なるため、実際に作業する前に対象アプリの `README.md` を確認してください。

## 共通リソース

`cdn_resources/` には、複数アプリから参照されるライブラリを配置しています。

- `cdn_resources/alpine.min.js`
- `cdn_resources/htmx.min.js`
- `cdn_resources/vue.esm-browser.js`

## 実験用コード

`experiments/` には単体検証用の HTML ファイルがあります。

- `experiments/preact.html`
- `experiments/solid.html`
- `experiments/sucrase.html`
