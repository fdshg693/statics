---
paths:
  - "apps/svelte_baseball/**"
---

## svelte_baseball 関連ドキュメント

概要・技術選定・機能・設計方針は `apps/svelte_baseball/README.md` を参照（重複記載しない）。

- **配信方式**: このアプリに `config.yaml` はない。他アプリと違い `python_backend` の `simple-deliver` 経由ではなく、素の Vite フローで動く。
  - `cd apps/svelte_baseball && npm install && npm run dev`（または `npm run build` / `npm run preview`）
  - あるいは `apps/justfile` から: `just svelte_baseball-install`（`npm install`）→ `just svelte_baseball`（`npm run dev`）
- **ディレクトリ分離**: `src/lib/config/*`（`pitchZones.ts`, `pitchResultProbabilities.ts` — ゾーン定義と結果確率テーブルの純粋データ）/ `src/lib/game/*`（`state.ts`, `resolvePitchResult.ts`, `playPitch.ts` — 確率抽選とカウント・進塁ロジック）/ `src/lib/types/game.ts`（型定義）という三層構成。確率やゾーンの調整は `lib/config` のテーブルを編集し、`lib/game` にマジックナンバーを埋め込まない。
- **Svelte のリアクティビティ**: `svelte` は ^5 系だが、`src/App.svelte` は Svelte 5 の runes（`$state`/`$derived`）ではなく、旧来の `let` + `$:` によるレガシーなリアクティビティで書かれている。既存コードに手を入れる際は runes と混在させず、このファイルのスタイルに合わせる。
- **仕様書は `plan/` 配下**: `PLAN.md` はドキュメント全体の入口。詳細は `plan/game-spec.md`（ルール仕様）、`plan/technical-decisions.md`（技術選定）、`plan/implementation-phases.md`（フェーズ分割）。フェーズ1〜6はすべて実装済みで、これらは実装済み内容の仕様整理用（未実装の構想ではない）。
