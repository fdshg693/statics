---
paths:
  - "apps/vanilla_circle_cross/**"
---

## モジュール配線が現状壊れている — `export`/`import` の欠落

`js/core/GameConfig.js`, `js/core/GameState.js`, `js/managers/BoardManager.js` は
`export` を持たないプレーンなクラス宣言（`GameConfig.js` 末尾の `module.exports` ガードは
ブラウザ上では no-op）。`index.html` は全スクリプトを `type="module"` で読み込んでおり、
ES モジュールはそれぞれ独立したスコープを持つため、これらのクラスは他ファイルから参照できない。
`js/main.js` は `UIManager` しか import していないのに `new BoardManager(...)` を直接呼んでおり、
`BoardManager.js` 自体も `GameConfig`/`GameState`/`GameLogic` を import せずに参照している。
結果として `init()` が `DOMContentLoaded` 時に `ReferenceError: BoardManager is not defined` を
投げ、現状のコミット状態ではゲームが動かない。正しく `export`/`import` されているのは
`GameLogic.js`（`export default GameLogic`）と `UIManager.js`（`export class UIManager`）のみ —
修正する際はこの2ファイルのパターンに揃える。

## `index.html` と `UIManager` の DOM id 不一致

`UIManager` のコンストラクタは `document.getElementById('reset-btn')` を読むが、
`index.html` の実際のボタン id は `resetBtn`（ハイフンなし）。また
`UIManager.renderSettingsUI()` は起動時に `#settings` の innerHTML を
`board-size`/`win-count`/`apply-settings` という別idで丸ごと再生成するため、
`index.html` に静的に書かれた `<select id="boardSizeSelect">` 等のマークアップは
使われていない（デッドコード）。

## ルート直下の `script.js` は未使用の legacy コード

`index.html` は `js/core/*`, `js/managers/*`, `js/main.js` のみを module として読み込んでおり、
ルート直下の `script.js`（同じゲームの非モジュール版の独立実装）はどこからも参照されていない。
このアプリを触る際に編集対象にしないこと。
