/**
 * BattleScript 型定義
 * プログラマブルアクション用のインターフェース定義
 */

import { EnemyType } from '../entities/Enemy.js';
import { ItemRarity } from '../entities/Item.js';

/**
 * 読み取り専用のアイテム情報
 */
export interface ReadonlyItemInfo {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly rarity: ItemRarity;
}

/**
 * 読み取り専用のポーション情報
 */
export interface ReadonlyPotionInfo extends ReadonlyItemInfo {
    readonly type: 'potion';
    readonly healAmount: number;
}

/**
 * 読み取り専用のインベントリ状態
 */
export interface ReadonlyInventoryState {
    readonly items: ReadonlyArray<ReadonlyItemInfo>;
    readonly gold: number;
    getPotions(): ReadonlyArray<ReadonlyPotionInfo>;
    hasPotion(): boolean;
}

/**
 * 読み取り専用のプレイヤー状態
 */
export interface ReadonlyPlayerState {
    readonly name: string;
    readonly hp: number;
    readonly maxHp: number;
    readonly mp: number;
    readonly maxMp: number;
    readonly attack: number;
    readonly defense: number;
    readonly level: number;
    readonly exp: number;
    readonly expToNextLevel: number;
    readonly isAlive: boolean;
    readonly inventory: ReadonlyInventoryState;

    // 算出プロパティ
    readonly hpRate: number;  // hp / maxHp
    readonly mpRate: number;  // mp / maxMp

    // アクション可否判定
    canAttack(): boolean;
    canHeal(): boolean;
    canDefend(): boolean;
    canFlee(): boolean;
}

/**
 * 読み取り専用の敵状態
 */
export interface ReadonlyEnemyState {
    readonly name: string;
    readonly type: EnemyType;
    readonly hp: number;
    readonly maxHp: number;
    readonly attack: number;
    readonly defense: number;
    readonly level: number;
    readonly isAlive: boolean;

    // 算出プロパティ
    readonly hpRate: number;  // hp / maxHp
}

/**
 * 読み取り専用のバトル状態
 */
export interface ReadonlyBattleState {
    readonly state: 'idle' | 'fighting' | 'victory' | 'defeat';
    readonly turnCount: number;
    readonly floor: number;
    readonly battlesOnCurrentFloor: number;
    readonly battlesPerFloor: number;
    readonly isPlayerTurn: boolean;
}

/**
 * 行動コマンドの型
 */
export type ActionCommandType = 'attack' | 'heal' | 'defend' | 'flee' | 'useItem';

export interface ActionCommandBase {
    readonly type: ActionCommandType;
}

export interface AttackCommand extends ActionCommandBase {
    readonly type: 'attack';
}

export interface HealCommand extends ActionCommandBase {
    readonly type: 'heal';
}

export interface DefendCommand extends ActionCommandBase {
    readonly type: 'defend';
}

export interface FleeCommand extends ActionCommandBase {
    readonly type: 'flee';
}

export interface UseItemCommand extends ActionCommandBase {
    readonly type: 'useItem';
    readonly itemId: string;
}

export type ActionCommand = AttackCommand | HealCommand | DefendCommand | FleeCommand | UseItemCommand;

/**
 * スクリプト実行結果
 */
export interface ScriptExecutionResult {
    readonly success: boolean;
    readonly command: ActionCommand | null;
    readonly error?: string;
    readonly logs: string[];
    readonly executionTimeMs: number;
}

/**
 * スクリプト実行制限
 */
export interface ScriptExecutionLimits {
    readonly maxExecutionTimeMs: number;
    readonly maxInstructions: number;
}

export const DEFAULT_SCRIPT_LIMITS: ScriptExecutionLimits = {
    maxExecutionTimeMs: 100,
    maxInstructions: 1000
};

/**
 * BattleScriptコンテキスト（スクリプト内からアクセス可能）
 */
export interface BattleScriptContext {
    readonly player: ReadonlyPlayerState;
    readonly enemy: ReadonlyEnemyState;
    readonly battleState: ReadonlyBattleState;

    // デバッグ用ログ
    log(message: string): void;

    // 行動コマンド発行
    attack(): void;
    heal(): void;
    defend(): void;
    flee(): void;
    useItem(itemId: string): void;
}
