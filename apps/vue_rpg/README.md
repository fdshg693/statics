# vue_rpg

## 関連ドキュメント

- [docs/game_specification.md](docs/game_specification.md)
    - ゲームシステム、戦闘計算式、敵・アイテムなどの詳細仕様
- [docs/programmable_action.md](docs/programmable_action.md)
    - プログラムからゲーム操作が可能

## 概要

Vue 3 と TypeScript で作られたターン制バトル RPG です。
戦闘を進めながら成長し、保存履歴を管理しつつプレイを継続できる複数画面構成のアプリです。

## 使用技術

- Vue.js 3
- Composition API
- TypeScript
- ES Modules
- HTML / CSS
- localStorage

## 実装の特徴

- `ts/` 配下の TypeScript を `js/` 配下へコンパイルして利用する構成です。
- ゲームコアは TypeScript で独立して実装されており、Vue 側は UI と状態同期に集中する設計です。
- スタート画面、履歴画面、バトル画面を持つ複数ページ構成です。
- セーブデータや進行状況を localStorage に保持し、再開や履歴管理ができます。

## 起動方法

まず TypeScript をコンパイルします。

```powershell
cd c:\CodeRoot\StaticApps
tsc -p apps/vue_rpg/tsconfig.json
```

その後、静的サーバーを起動します。

```powershell
cd c:\CodeRoot\StaticApps
python -m http.server 8000
```

起動後、`http://localhost:8000/apps/vue_rpg/` にアクセスします。

保存履歴画面は `http://localhost:8000/apps/vue_rpg/history.html` で確認できます。

## 補足

`js/` 配下はコンパイル結果なので、変更するときは `ts/` 配下の TypeScript を編集してください。
