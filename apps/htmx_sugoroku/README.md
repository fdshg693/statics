# htmx_sugoroku

## 概要

すごろくを題材にしたフロントエンドアプリです。
HTMX を扱う題材でありつつ、現在は型付き API 連携やモックを含む開発フローを持つ構成になっています。

## 使用技術

- TypeScript
- Vite
- HTMX
- OpenAPI 3.1
- `openapi-typescript`
- `openapi-fetch`
- MSW
- HTML / CSS

## 実装の特徴

- OpenAPI 定義を起点に、TypeScript の型と API クライアント利用を揃えています。
- 開発時は MSW を使って、バックエンドなしでも画面確認できます。
- 実バックエンドに切り替えての確認もできる構成です。
- 本番向けの静的ファイルは `dist/` にビルドして配信できます。

## 起動方法

### 開発サーバーで起動する場合

```powershell
cd c:\CodeRoot\StaticApps\apps\htmx_sugoroku
npm install
npm run dev
```

起動後、`http://localhost:3000` にアクセスします。

### ビルドして配信する場合

```powershell
cd c:\CodeRoot\StaticApps\apps\htmx_sugoroku
npm run build
```

その後、`config.yaml` を使って配信します。

```powershell
cd c:\CodeRoot\StaticApps\python_backend
uv run simple-deliver ..\apps\htmx_sugoroku\config.yaml
```

あるいは、APIバックエンドを提供するPythonサーバーを起動します。

```powershell
cd c:\CodeRoot\StaticApps\python_backend
uv run htmx-sugoroku-server
```

起動後、`http://localhost:8000/` にアクセスします。
