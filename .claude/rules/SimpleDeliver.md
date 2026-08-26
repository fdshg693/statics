---
paths:
  - "python_backend/packages/simple_deliver/src/simple_deliver/**"
---

## SimpleDeliver 関連ドキュメント

- `config.yaml` のルートは `routes:` のようなリストではなく、トップレベルの数字文字列キー (`"1"`, `"2"`, ...) として `port`/`base_dir` と並べて書く（`config.py:_parse_config`）。`route` が `/` で始まらない場合は自動的に付与される。
- ルートマッチングは宣言順ではなく **`route` 文字列の長さの降順** で走査される（`handler.py:_find_matching_route`）。重複・入れ子になったルートがある場合、より具体的な（長い）パスが優先される。
- `dir` はディレクトリだけでなく単一ファイルも指定可能。単一ファイルの場合はそのルートへの全リクエストがそのファイルを返す。
- パストラバーサル対策は `Path.resolve()` の結果に対して `relative_to(dir_path.resolve())` を試み、`ValueError` なら拒否する方式（`handler.py:_resolve_file_path`）。
- バリデーションは2段階: `ServerConfig.__post_init__`（port範囲・base_dirの絶対パス/存在チェック）は読み込み時に自動実行されるが、各ルートの `dir` 存在チェック (`validate_routes()`) は `main.py` から明示的に呼ばれる別関数。`server.py` や `config.py` を直接使うコードから呼ぶ場合は呼び忘れに注意。
- サーバーは `ThreadingHTTPServer` を使うが `serve_forever()` ではなく `timeout=0.5` の手動ポーリングループ（`while not shutdown: handle_request()`）。Windows で Ctrl+C (`KeyboardInterrupt`) を確実に拾うための実装で、SIGTERM ハンドラは Unix のみ登録される（`server.py:ServerManager`）。
