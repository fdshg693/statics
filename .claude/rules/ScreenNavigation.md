---
paths:
  - "apps/vue_rpg/index.html"
  - "apps/vue_rpg/history.html"
  - "apps/vue_rpg/battle/index.html"
  - "apps/vue_rpg/ts/screens/**"
  - "apps/vue_rpg/ts/save/**"
  - "apps/vue_rpg/ts/battle/composables/useSaveGame.ts"
  - "apps/vue_rpg/ts/battle/app.ts"
---

## vue_rpg 画面構成とセーブフロー

3つの独立した HTML エントリポイントが `window.location.href` によるフルページ遷移で繋がっており、SPA ルーティングではない。画面間の状態共有は localStorage のみを介する。

- `index.html`（スタート）と `history.html`（履歴）は **Vue を使わない** 素の TypeScript + DOM 操作（`ts/screens/start.ts`, `ts/screens/history.ts`）。
- **Vue が使われるのは `battle/index.html` のみ**（`ts/battle/app.ts` が `#app` にマウント）。ここだけ `battle/index.html` の importmap で `vue` → `/cdn_resources/vue.esm-browser.js` を解決している。
- 遷移: スタート「新規/再開」→ `battle/index.html`（新規は `clearActiveSaveId()`、再開は最新セーブを `setActiveSaveId()`）。バトル終了/離脱時は `saveAndReturnToStart()` → `../index.html`。敗北時は自動で `../index.html` へ強制遷移。

セーブは `ts/save/saveRepository.ts`（localStorage キー: `rpg_battle_game_saves` = 複数スロット配列、`rpg_battle_game_active_save_id` = アクティブスロット、旧 `rpg_battle_game_save` は `migrateLegacySave()` で移行）が一元管理。`ts/battle/composables/useSaveGame.ts` の使い分けに注意:

- `saveGame()`（自動保存、reactive source を watch）→ アクティブスロットを**上書き**。
- `saveSnapshot()`（スタート画面へ戻る際）→ `createNew: true` で**履歴に新規追加**。
- HP0（`defeat`）時は保存自体をスキップする。

戦闘計算式・敵/アイテム仕様は `apps/vue_rpg/docs/game_specification.md`、自動戦闘スクリプト機能は `apps/vue_rpg/docs/programmable_action.md` 以下を参照（本ファイルでは重複させない）。
