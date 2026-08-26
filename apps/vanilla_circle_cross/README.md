# vanilla_circle_cross

## 概要

ブラウザで遊べる〇×ゲームです。
盤面サイズや勝利条件を切り替えながら、シンプルな対戦ロジックを試せる構成になっています。

## 使用技術

- HTML / CSS / JavaScript
- ES Modules
- ビルドツールなしの静的ファイル構成

## 実装の特徴

- バニラ JavaScript で実装されており、フレームワークには依存しません。
- `js/core/` と `js/managers/` に役割を分け、ゲームロジックと UI 管理を分離しています。
- 盤面は設定に応じて動的に生成される構成です。
- モジュール読み込みを使うため、機能単位で追いやすい構成になっています。

## 起動方法

ES Modules を使っているため、静的サーバー経由で起動してください。

```powershell
cd c:\CodeRoot\StaticApps
python -m http.server 8000
```

起動後、`http://localhost:8000/apps/vanilla_circle_cross/` にアクセスします。