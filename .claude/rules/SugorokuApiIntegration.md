---
paths:
  - "apps/htmx_sugoroku/openapi/**"
  - "apps/htmx_sugoroku/src/api/**"
  - "apps/htmx_sugoroku/src/mock/**"
  - "apps/htmx_sugoroku/src/generated/**"
  - "apps/htmx_sugoroku/vite.config.ts"
  - "apps/htmx_sugoroku/index.html"
---

## API 型生成とモック/実バックエンド切り替え

- `src/generated/api-types.ts` は `openapi/sugoroku-api.yaml` から `openapi-typescript` で自動生成される（`npm run dev` / `build` が毎回 `generate:types` を先に実行）。このファイルを直接編集しない。型を変えたい場合は yaml を編集して再生成する。
- モック/実バックエンドの切替は環境変数やビルドフラグではなく、`index.html` の `#api-url` 入力欄（`main.ts` の `startGame()` が読む）で行う。
  - 空欄 → `initApiClient('')` で同一オリジン相対パス（`/api/...`）にリクエスト → dev モードでは `import.meta.env.DEV` 時に常時起動している MSW（`src/mock/browser.ts` の `setupWorker`、ハンドラは `src/mock/handlers.ts`）が同一オリジン相対パスにマッチして横取りする。
  - `http://localhost:5000` 等を入力 → 別オリジン宛の絶対URLになるため MSW のハンドラ（相対パス基準）はマッチせず素通りし、実際に Flask バックエンド（`python_backend/packages/htmx_sugoroku_server`, CORS 有効, ポート5000固定）にリクエストが飛ぶ。
- `vite.config.ts` の `/api`, `/info` プロキシ（→ localhost:5000）は、上記の理由で dev モックが有効な間は実質使われない（MSW がネットワーク層に到達する前に横取りするため）。
- 実バックエンド起動時のポートは **5000**（`main.py` の `app.run(port=5000)`）。`simple-deliver` が配信する静的ファイル側のポート（`config.yaml`）とは別物なので混同しない。
