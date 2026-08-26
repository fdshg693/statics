/**
 * BattleScript モジュール
 * プログラマブルアクション機能のエントリーポイント
 */

// 型定義のエクスポート
export {
    ReadonlyItemInfo,
    ReadonlyPotionInfo,
    ReadonlyInventoryState,
    ReadonlyPlayerState,
    ReadonlyEnemyState,
    ReadonlyBattleState,
    ActionCommandType,
    ActionCommand,
    AttackCommand,
    HealCommand,
    DefendCommand,
    FleeCommand,
    UseItemCommand,
    ScriptExecutionResult,
    ScriptExecutionLimits,
    DEFAULT_SCRIPT_LIMITS,
    BattleScriptContext
} from './BattleScriptTypes.js';

// 読み取り専用ラッパーのエクスポート
export {
    createBattleSnapshot,
    ReadonlyPlayerWrapper,
    ReadonlyEnemyWrapper,
    ReadonlyBattleStateWrapper,
    ReadonlyInventoryWrapper
} from './ReadonlyStateWrapper.js';

// スクリプト実行エンジンのエクスポート
export {
    BattleScriptExecutor,
    defaultExecutor
} from './BattleScriptExecutor.js';

// 行動決定サービスのエクスポート
export {
    ActionSource,
    ActionDecisionResult,
    ActionDecisionService,
    getActionDecisionService,
    resetActionDecisionService
} from './ActionDecisionService.js';
