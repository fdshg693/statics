---
paths:
  - "python_backend/packages/htmx_sugoroku_server/src/htmx_sugoroku_server/**"
  - "python_backend/packages/util/src/util/path.py"
  - "apps/htmx_sugoroku/openapi/**"
---

## HtmxSugorokuGameApi 関連ドキュメント

- ゲームロジックは別モジュールに分離されておらず、`main.py` 1ファイルに Flask ルート定義がすべて書かれている（blueprint なし）。ゲーム状態はプロセス内メモリの `games: dict[str, dict]`（キーは `uuid4` 文字列）のみで、永続化なし。サーバー再起動やマルチプロセス構成で状態は失われる/分裂する。
- `/info` (GET) が README 未記載のエンドポイントとして存在し、他エンドポイントの一覧を返す。
- 静的ファイルは `util.path.find_repo_root()` が返すリポジトリルートを起点に `<root>/apps/htmx_sugoroku` と `<root>/cdn_resources` から配信される（`main.py` 冒頭）。
- `find_repo_root()`（`packages/util/src/util/path.py`）は cwd や環境変数を見ず、**自分自身の `__file__` から親ディレクトリを遡り、`cdn_resources` ディレクトリを直下に持つ最初の祖先**を返す。以前は名前が厳密に `CodeRoot` のフォルダを探す実装で、現在のチェックアウト（`C:\C\statics\...`）ではそのようなフォルダが存在せず `FileNotFoundError` になっていたが、この cdn_resources 検出方式に修正済み。Docker イメージ内でこの3ルート（`/`, `/style.css`, `/cdn_resources/<path>`）を有効にするには、`cdn_resources` と `apps/htmx_sugoroku` をイメージ内の同じ親ディレクトリ配下にコピーする必要がある（`infra/docker/htmx-sugoroku-api.Dockerfile` 参照）。ただし K8s/Caddy 構成ではこれら3ルートは Caddy が肩代わりするため冗長で、実質使われない。
- CORS は `flask_cors.CORS(app)` によりオールオリジン許可でグローバルに有効化されている。
- `app.run(debug=True, port=5000, host='0.0.0.0')` が固定値（`main()`）。ポート/デバッグモードは config 化されておらず、コード変更でのみ変更可能。
- API 契約: フロントエンド側の OpenAPI 仕様は `apps/htmx_sugoroku/openapi/sugoroku-api.yaml` にあり、`GameStartResponse` / `RollDiceRequest` / `RollDiceResponse` / `GameStatusResponse` / `ErrorResponse` / `InfoResponse` のスキーマを定義している。`main.py` の `jsonify(...)` 応答との同期はコード生成やバリデーションによる自動連携がなく、**手動で一致させる必要がある**。片方を変更したらもう片方も確認すること。
