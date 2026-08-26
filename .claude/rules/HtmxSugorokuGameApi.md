---
paths:
  - "python_backend/packages/htmx_sugoroku_server/src/htmx_sugoroku_server/**"
  - "python_backend/packages/util/src/util/path.py"
  - "apps/htmx_sugoroku/openapi/**"
---

## HtmxSugorokuGameApi 関連ドキュメント

- ゲームロジックは別モジュールに分離されておらず、`main.py` 1ファイルに Flask ルート定義がすべて書かれている（blueprint なし）。ゲーム状態はプロセス内メモリの `games: dict[str, dict]`（キーは `uuid4` 文字列）のみで、永続化なし。サーバー再起動やマルチプロセス構成で状態は失われる/分裂する。
- `/info` (GET) が README 未記載のエンドポイントとして存在し、他エンドポイントの一覧を返す。
- 静的ファイルは `util.path.find_code_root()` が返す `CodeRoot` を起点に `CodeRoot/StaticApps/apps/htmx_sugoroku` と `CodeRoot/StaticApps/cdn_resources` から配信される（`main.py` 冒頭）。
- **重要な前提**: `find_code_root()`（`packages/util/src/util/path.py`）は cwd や環境変数を見ず、**自分自身の `__file__`（editable install 経由で `packages/util/src/util/path.py` の実体を指す）から親ディレクトリを遡り、名前が厳密に `CodeRoot` のフォルダを探す**。現在のチェックアウト（`C:\C\statics\...`）の祖先に `CodeRoot` という名前のディレクトリは存在しない（`C:\C\statics` → `C:\C` → `C:\` のいずれも該当なしを確認済み）。このままでは `htmx_sugoroku_server` の import 時（`main.py` の `find_code_root()` 呼び出し）に `FileNotFoundError` になる。静的ファイル配信まわりのエラーが出たら、まずこの前提（リポジトリが `<何か>/CodeRoot/StaticApps/...` 配下にあるか）を疑う。
- CORS は `flask_cors.CORS(app)` によりオールオリジン許可でグローバルに有効化されている。
- `app.run(debug=True, port=5000, host='0.0.0.0')` が固定値（`main()`）。ポート/デバッグモードは config 化されておらず、コード変更でのみ変更可能。
- API 契約: フロントエンド側の OpenAPI 仕様は `apps/htmx_sugoroku/openapi/sugoroku-api.yaml` にあり、`GameStartResponse` / `RollDiceRequest` / `RollDiceResponse` / `GameStatusResponse` / `ErrorResponse` / `InfoResponse` のスキーマを定義している。`main.py` の `jsonify(...)` 応答との同期はコード生成やバリデーションによる自動連携がなく、**手動で一致させる必要がある**。片方を変更したらもう片方も確認すること。
