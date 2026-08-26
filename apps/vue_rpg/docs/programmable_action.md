# プログラマブルアクション（総合インデックス）

プログラマブルアクションは、プレイヤーが自作のJavaScriptスクリプトを用いて戦闘中の行動を自動的に決定できる仕組みです。
本機能の仕様、実装、セキュリティ、およびテスト方針について、各責務ごとにドキュメントを分割して整理しています。

---

## 仕様書一覧

プログラマブルアクションの各仕様の詳細については、以下の個別ドキュメントを参照してください。

### 1. [概要・主要コンセプト・公開API](programmable_action/overview.md)
* **内容**: 自動戦闘の目的、ターン開始時のスナップショット評価、非破壊的フォールバック（手動プレイへの透過的切り替え）などの主要コンセプト。
* **API**: スクリプト内からアクセス可能なプレイヤー状態（`player`）、インベントリ（`player.inventory`）、敵状態（`enemy`）、バトル状態（`battleState`）の構造や、行動コマンド（`attack()`, `heal()` 等）、およびデバッグ用 `log()` メソッドの一覧。

### 2. [実装構成・動作フロー](programmable_action/implementation.md)
* **内容**: `ts/battle/script/` 配下の各 TypeScript クラスの設計責務と役割。
* **フロー**: ターン開始からスナップショットの生成、サンドボックスでのスクリプト評価、ゲームエンジンへのコマンド適用、フォールバック判断までの詳細なシーケンスフロー（Mermaid図付き）。
* **UI統合**: Vue 3 の `useBattle` Composable に拡張されたステート（`scriptEnabled`, `scriptLogs` 等）の定義。

### 3. [セキュリティ制約・サンドボックス設計](programmable_action/SECURITY.md)
* **内容**: 任意のユーザー記述コードを実行する上での脅威モデル（チート、XSS、XHR送信、無限ループによるフリーズ、プロトタイプ汚染）。
* **防御システム**: `Object.freeze` による完全不変状態、`Function` によるスコープマスキング（危険なグローバルの `undefined` 化）、`"use strict";` による `this` の無効化などの多層防御。
* **制限値**: 実行時間上限 `100ms` 等のシステム制限。

### 4. [ログ記録方針・蓄積ログ仕様](programmable_action/LOGGING.md)
* **内容**: デバッグしやすさとシステム性能監視を両立するログ設計。
* **データフロー**: スクリプト内 `log()` および `console.log()` から `scriptLogs` リアクティブ配列へ蓄積されUIにレンダリングされる仕組み、および開発者向けのシステム動作ログ（実行時間のミリ秒計測）の役割。

### 5. [テスト観点・検証パターン](programmable_action/TESTING.md)
* **内容**: 機能の堅牢性と安全性を保証するためのテストスイートの設計方針。
* **検証内容**: HP比率に応じた正常系分岐テスト、シンタックス/ランタイムエラー発生時の異常系フォールバックテスト、DOMやグローバルオブジェクトへの不正アクセス、プロパティ改ざんをブロックするセキュリティパターンテスト。

### 6. [影響範囲・後方互換性仕様](programmable_action/BREAKING_CHANGES.md)
* **内容**: 新機能の統合が既存のゲームループや Vue UI、および `localStorage` 保存システムに与える影響。
* **互換性**: 既存のUI構成やゲームエンジンが破壊されず、後方互換性が完全に維持されている設計上の根拠。

---

## クイックスタート: 自動戦闘スクリプト例

スクリプトエディタに記述する、最も標準的な自動判断スクリプトの例です。

```javascript
// 1. 状態の確認とログ出力
log("Current Turn: " + battleState.turnCount);
log("My HP rate: " + player.hpRate);

// 2. 自動行動決定ロジック
if (player.hpRate < 0.3) {
    // HPが3割未満かつポーションがあればアイテム使用、なければ回復魔法
    if (player.inventory.hasPotion()) {
        const potions = player.inventory.getPotions();
        log("Using item: " + potions[0].name);
        useItem(potions[0].id);
    } else if (player.canHeal()) {
        log("Casting Heal!");
        heal();
    } else {
        log("Defending to survive...");
        defend();
    }
} else if (enemy.hpRate < 0.1) {
    // 敵のHPが1割未満ならトドメを刺すために全力攻撃
    log("Enemy HP is low! Finishing move!");
    attack();
} else {
    // それ以外は通常攻撃
    attack();
}
```
