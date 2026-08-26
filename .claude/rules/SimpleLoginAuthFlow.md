---
paths:
  - "apps/simple_login/ts/**/*.ts"
  - "apps/simple_login/*.html"
---

## simple_login 認証フローの内部構造

- 各ページ（index/login/register/home の各 .ts）に共通ブートストラップは無く、エントリーポイント冒頭で毎回
  `AuthManager(AppStorageManager)` → `UIManager(authManager)` を個別に組み立てる（factory 関数による DI）。
  新しい画面を追加する際もこのボイラープレートを踏襲する。
- `UIManager()` は `IUIManager` に現れない副作用を持つ: 呼び出すとテーマ切替ボタン・背景オーブ・パスワード表示
  トグルの DOM を `document.body` に注入する（`ui.ts` の `initThemeSystem` / `initPasswordToggles`）。
  二重初期化は `#themeToggle` の存在チェックで防止している。
- 各エントリーポイントはロード直後に `uiManager.checkAuthAndRedirect(requireAuth)` を呼ぶ規約がある。
  `index/login/register` は `false`（ログイン済みなら home.html へ）、`home` は `true`（未ログインなら
  index.html へ）。新規ページ追加時はこの引数の使い分けに合わせる。
- 認証は完全にフェイク: `storage.ts` はパスワードをハッシュ化せず `user_<username>` キーへ平文で保存し、
  `currentUser` キーは単なるユーザー名文字列（トークンや有効期限の概念なし）。明示的な依頼がない限り
  この単純さを前提にコードを扱う。
- login/register の送信は `setTimeout` で疑似遅延（800ms）を挟む UX パターンで、register 成功後はさらに
  1.5 秒後に `login.html?username=<name>` へ遷移してユーザー名をプレフィルする。他画面を追加する際の参考。
