# simple_login

## 概要

TypeScript で実装されたシンプルなログインアプリです。
ユーザー登録、ログイン、ログアウトといった基本的な認証フローを、フロントエンドだけで完結する形で確認できます。

## 使用技術

- TypeScript
- HTML / CSS
- ES Modules
- `tsc` による JavaScript 生成
- localStorage

## 実装の特徴

- `ts/` 配下の TypeScript を編集し、`js/` 配下へコンパイルする構成です。
- 認証、永続化、UI 操作を責務ごとに分けたモジュール構成になっています。
- 画面ごとにエントリーポイントを分けた複数ページ構成です。
- ユーザー情報やログイン状態は localStorage を使ってブラウザ内に保持します。

## 起動方法

まず TypeScript をコンパイルします。

```powershell
cd c:\CodeRoot\StaticApps
tsc -p apps/simple_login/tsconfig.json
```

その後、`config.yaml` を使ってローカル配信します。

```powershell
cd c:\CodeRoot\StaticApps\python_backend
uv run simple-deliver ..\apps\simple_login\config.yaml
```

起動後、`http://localhost:8000/` にアクセスします。

## 補足

`js/` 配下はコンパイル結果なので、変更するときは `ts/` 配下の TypeScript を編集してください。
