# Python Backend Workspace

`StaticApps` の動作確認用配信サーバーおよび API バックエンドをまとめた Python ワークスペースです。
本リポジトリは静的ファイル配信をメインとしていますが、ローカル環境でのモジュール解決や OpenAPI バックエンド連携の確認のために本バックエンドを利用します。

## 📁 ディレクトリ構成

```text
python_backend/
├── pyproject.toml      # ワークスペース全体の管理設定 (uv workspace)
├── uv.lock             # ロックファイル
├── packages/           # ワークスペース内のローカルパッケージ
│   ├── simple_deliver/ # YAML設定に基づいて静的ファイルを配信する軽量Webサーバー
│   ├── htmx_sugoroku_server/ # すごろくゲーム向けAPI/静的ファイル配信サーバー (Flask)
│   └── util/           # 共通ユーティリティ (プロジェクトルートパスの取得など)
└── README.md           # このファイル
```

## 🛠️ 環境構築

本プロジェクトは [uv](https://github.com/astral-sh/uv) を使用してパッケージと依存関係を管理しています。

```powershell
# python_backend ディレクトリに移動
cd python_backend

# 依存関係のセットアップ (仮想環境の作成とローカルパッケージのリンク)
uv sync
```

## 🚀 実行方法

`uv sync` 完了後、以下のコマンドで各サーバーを直接実行できます。

### 1. 汎用静的ファイル配信サーバー (`simple_deliver`)

各アプリケーションの `config.yaml` を指定して起動します。

```powershell
# ToDoアプリを配信する場合
uv run simple-deliver ..\apps\alpine_todo\config.yaml

# ログイン認証サンプルを配信する場合
uv run simple-deliver ..\apps\simple_login\config.yaml
```

### 2. すごろくゲーム用 API バックエンド (`htmx_sugoroku_server`)

```powershell
uv run htmx-sugoroku-server
```
起動すると、`http://localhost:5000` で Flask サーバーが起動し、ゲームロジックの API および静的ファイルを提供します。

## 📝 パッケージ解説

### `simple_deliver`
`config.yaml` に記述されたルーティング設定に基づいて静的ファイルを配信します。
- ポート番号の変更可能
- 複数のディレクトリやファイルを別々のURLルートにマッピング可能
- パストラバーサル対策などの最低限のセキュリティを内包

### `htmx_sugoroku_server`
すごろくアプリ `htmx_sugoroku` に向けた API サーバーです。
- `/api/game/start`: ゲームの開始と UUID 発行
- `/api/game/roll`: サイコロを振っての進捗とゴール判定
- `/api/game/status`: ゲーム状態の取得

### `util`
各サーバーから参照される共通ユーティリティです。
- 親ディレクトリを遡ってプロジェクトのルートディレクトリである `CodeRoot` を自動判別し、絶対パスを取得する機能を持ちます。
