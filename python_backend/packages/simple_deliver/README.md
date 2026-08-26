# Simple Deliver

YAMLベースの設定ファイルで簡単に複数ルートの静的ファイルを配信できるPythonサーバー

## 📝 概要

Simple Deliverは、設定ファイル（YAML）ベースで複数の静的ファイルディレクトリやHTMLファイルを配信できるシンプルなHTTPサーバーです。開発環境やプレビュー環境で静的ファイルを手軽に配信するために設計されています。

## ✨ 機能一覧

- **複数ルートの設定**: 1つのサーバーで複数のディレクトリやファイルを異なるパスで配信可能
- **柔軟なパスマッピング**: 任意のURLパスに任意のディレクトリをマッピング
- **単一ファイル配信**: ディレクトリだけでなく、単一のHTMLファイルも配信可能
- **YAML設定ファイル**: わかりやすい設定ファイル形式
- **マルチスレッド対応**: 複数の同時リクエストを処理可能
- **グレースフルシャットダウン**: Ctrl+Cで安全にサーバーを停止
- **詳細なログ出力**: リクエストログとエラーログを出力（`--verbose`オプションでDEBUGレベルも可能）
- **自動index.html配信**: ディレクトリへのアクセス時に自動的にindex.htmlを配信
- **ディレクトリリスティング**: index.htmlが存在しない場合はディレクトリ一覧を表示
- **セキュリティ**: パストラバーサル攻撃を防止（`../`などの不正なパスアクセスをブロック）

## 📦 インストール方法

### uvを使用したインストール

```bash
# リポジトリのクローン（またはパッケージディレクトリに移動）
cd c:\CodeRoot\StaticApps\python_backend\packages\simple_deliver

# 開発モードでインストール（編集可能モード）
uv pip install -e .

# または通常のインストール
uv pip install .
```

### インストール確認

```bash
simple-deliver --help
```

## ⚙️ 設定ファイルの書き方

設定ファイルはYAML形式で記述します。以下の項目を設定できます：

- `port`: サーバーのポート番号（デフォルト: 8000）
- `base_dir`: 配信するファイルのベースディレクトリ（**絶対パス必須**）
- `1`, `2`, `3`...: ルート設定（数値キーで複数定義可能）
  - `route`: URLパス（例: `/static`, `/`）
  - `dir`: 配信するディレクトリまたはファイルのパス（`base_dir`からの相対パスまたは絶対パス）

### 設定例1: 複数の静的ディレクトリを配信

```yaml
port: 8080
base_dir: C:\CodeRoot\StaticApps

1:
  route: /apps
  dir: apps

2:
  route: /cdn
  dir: cdn_resources

3:
  route: /
  dir: apps/alpine_todo
```

**説明:**
- `http://localhost:8080/apps/` → `C:\CodeRoot\StaticApps\apps` ディレクトリを配信
- `http://localhost:8080/cdn/` → `C:\CodeRoot\StaticApps\cdn_resources` ディレクトリを配信
- `http://localhost:8080/` → `C:\CodeRoot\StaticApps\apps\alpine_todo` ディレクトリをルートに配信

### 設定例2: ルートパスに単一HTMLファイルを配信

```yaml
port: 3000
base_dir: C:\MyProjects\WebApp

1:
  route: /static
  dir: public/static

2:
  route: /assets
  dir: public/assets

3:
  route: /
  dir: public/index.html
```

**説明:**
- `http://localhost:3000/static/` → `C:\MyProjects\WebApp\public\static` ディレクトリ
- `http://localhost:3000/assets/` → `C:\MyProjects\WebApp\public\assets` ディレクトリ
- `http://localhost:3000/` → `C:\MyProjects\WebApp\public\index.html` ファイル（単一HTMLファイル）

### 設定例3: 開発環境向け - アプリとCDNリソースを同時配信

```yaml
port: 8000
base_dir: C:\CodeRoot

1:
  route: /static
  dir: StaticApps

2:
  route: /cdn
  dir: StaticApps/cdn_resources

3:
  route: /
  dir: StaticApps/apps/vue_janken
```

**説明:**
- SPAアプリケーションと、その依存するCDNリソースを1つのサーバーで配信
- `http://localhost:8000/` でじゃんけんアプリにアクセス
- `http://localhost:8000/cdn/vue.global.js` でCDNリソースにアクセス可能

## 🚀 使用方法

### 基本的な使用方法

```bash
# 設定ファイルを指定してサーバーを起動
simple-deliver config.yaml

# 詳細ログを表示（DEBUGレベル）
simple-deliver config.yaml --verbose
simple-deliver config.yaml -v

# 絶対パスで設定ファイルを指定
simple-deliver C:\path\to\config.yaml
```

### サーバーの停止

```
Ctrl+C
```

### ログ出力例

```
2026-01-06 10:30:00 - simple_deliver.main - INFO - Loading config from: config.yaml
2026-01-06 10:30:00 - simple_deliver.main - INFO - Validating routes...
2026-01-06 10:30:00 - simple_deliver.main - INFO - Starting server...
============================================================
Server started successfully
Host: 0.0.0.0
Port: 8080
Base directory: C:\CodeRoot\StaticApps
Access URL: http://localhost:8080
------------------------------------------------------------
Routes:
  /apps -> apps
  /cdn -> cdn_resources
  / -> apps/alpine_todo
============================================================
Press Ctrl+C to stop the server
```

## 📚 依存関係

- **Python**: 3.13 以上
- **PyYAML**: 6.0 以上（YAML設定ファイルの解析）

その他の依存関係は標準ライブラリのみ（`http.server`, `pathlib`, `logging`など）

## 💡 使用例

### 例1: Todoアプリを配信

```yaml
# config_todo.yaml
port: 8000
base_dir: C:\CodeRoot\StaticApps
1:
  route: /
  dir: apps/alpine_todo
```

```bash
simple-deliver config_todo.yaml
# http://localhost:8000/ でTodoアプリにアクセス
```

### 例2: 複数のアプリを同時配信

```yaml
# config_multi_apps.yaml
port: 8000
base_dir: C:\CodeRoot\StaticApps
1:
  route: /todo
  dir: apps/alpine_todo
2:
  route: /janken
  dir: apps/vue_janken
3:
  route: /rpg
  dir: apps/vue_rpg
```

```bash
simple-deliver config_multi_apps.yaml
# http://localhost:8000/todo/ でTodoアプリ
# http://localhost:8000/janken/ でじゃんけんゲーム
# http://localhost:8000/rpg/ でRPGゲーム
```

### 例3: CDNリソースと一緒に配信

```yaml
# config_with_cdn.yaml
port: 8000
base_dir: C:\CodeRoot
1:
  route: /
  dir: StaticApps/apps/vue_janken
2:
  route: /cdn
  dir: StaticApps/cdn_resources
```

```bash
simple-deliver config_with_cdn.yaml
# アプリ内で /cdn/vue.global.js などのCDNリソースが利用可能
```

## 🔧 トラブルシューティング

### ポートが既に使用されている

```
Port 8000 is already in use
```

**解決策**: 設定ファイルで異なるポート番号を指定してください。

### ファイルが見つからない

```
Path does not exist for route '/static': C:\path\to\static
```

**解決策**: 
- `base_dir` が正しい絶対パスか確認
- ルート設定の `dir` パスが正しいか確認
- パスの区切り文字（Windows: `\` または `/`）を確認

### base_dirが絶対パスではない

```
base_dir must be an absolute path
```

**解決策**: `base_dir` には必ず絶対パスを指定してください（例: `C:\Users\...` や `/home/user/...`）

## 📄 ライセンス

このプロジェクトは自由に使用・改変可能です。

## 🤝 貢献

バグ報告や機能リクエストは、issueやプルリクエストでお願いします。