/**
 * 読み取り専用状態ラッパー
 * ゲーム状態のスナップショットを読み取り専用で提供
 */

import { Game, GameState } from '../game.js';
import { PlayerActionConstants } from '../GameConstants.js';
import {
    ReadonlyPlayerState,
    ReadonlyEnemyState,
    ReadonlyBattleState,
    ReadonlyInventoryState,
    ReadonlyItemInfo,
    ReadonlyPotionInfo
} from './BattleScriptTypes.js';

/**
 * インベントリの読み取り専用ラッパー
 */
class ReadonlyInventoryWrapper implements ReadonlyInventoryState {
    private readonly _items: ReadonlyArray<ReadonlyItemInfo>;
    private readonly _gold: number;

    constructor(inventoryData: { items: any[]; gold: number }) {
        this._items = Object.freeze(
            inventoryData.items.map(item => Object.freeze({
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                ...(item.type === 'potion' ? { healAmount: item.healAmount } : {})
            } as ReadonlyItemInfo))
        );
        this._gold = inventoryData.gold;
    }

    get items(): ReadonlyArray<ReadonlyItemInfo> {
        return this._items;
    }

    get gold(): number {
        return this._gold;
    }

    getPotions(): ReadonlyArray<ReadonlyPotionInfo> {
        return this._items.filter(
            (item): item is ReadonlyPotionInfo => item.type === 'potion'
        );
    }

    hasPotion(): boolean {
        return this.getPotions().length > 0;
    }
}

/**
 * プレイヤー状態の読み取り専用ラッパー
 */
class ReadonlyPlayerWrapper implements ReadonlyPlayerState {
    private readonly _data: any;
    private readonly _inventory: ReadonlyInventoryState;

    constructor(playerData: any) {
        this._data = playerData;
        this._inventory = new ReadonlyInventoryWrapper(playerData.inventory || { items: [], gold: 0 });
    }

    get name(): string { return this._data.name; }
    get hp(): number { return this._data.hp; }
    get maxHp(): number { return this._data.maxHp; }
    get mp(): number { return this._data.mp; }
    get maxMp(): number { return this._data.maxMp; }
    get attack(): number { return this._data.attack; }
    get defense(): number { return this._data.defense; }
    get level(): number { return this._data.level; }
    get exp(): number { return this._data.exp; }
    get expToNextLevel(): number { return this._data.expToNextLevel; }
    get isAlive(): boolean { return this._data.isAlive; }
    get inventory(): ReadonlyInventoryState { return this._inventory; }

    get hpRate(): number {
        return this.maxHp > 0 ? this.hp / this.maxHp : 0;
    }

    get mpRate(): number {
        return this.maxMp > 0 ? this.mp / this.maxMp : 0;
    }

    canAttack(): boolean {
        return this.mp >= PlayerActionConstants.ATTACK_MP_COST;
    }

    canHeal(): boolean {
        return this.mp >= PlayerActionConstants.HEAL_MP_COST;
    }

    canDefend(): boolean {
        return this.mp >= PlayerActionConstants.DEFEND_MP_COST;
    }

    canFlee(): boolean {
        return this.mp >= PlayerActionConstants.ESCAPE_MP_COST;
    }
}

/**
 * 敵状態の読み取り専用ラッパー
 */
class ReadonlyEnemyWrapper implements ReadonlyEnemyState {
    private readonly _data: any;

    constructor(enemyData: any) {
        this._data = enemyData;
    }

    get name(): string { return this._data.name; }
    get type(): 'normal' | 'leader' | 'boss' { return this._data.type; }
    get hp(): number { return this._data.hp; }
    get maxHp(): number { return this._data.maxHp; }
    get attack(): number { return this._data.attack; }
    get defense(): number { return this._data.defense; }
    get level(): number { return this._data.level; }
    get isAlive(): boolean { return this._data.isAlive; }

    get hpRate(): number {
        return this.maxHp > 0 ? this.hp / this.maxHp : 0;
    }
}

/**
 * バトル状態の読み取り専用ラッパー
 */
class ReadonlyBattleStateWrapper implements ReadonlyBattleState {
    private readonly _state: 'idle' | 'fighting' | 'victory' | 'defeat';
    private readonly _turnCount: number;
    private readonly _floor: number;
    private readonly _battlesOnCurrentFloor: number;
    private readonly _battlesPerFloor: number;

    constructor(gameState: GameState) {
        this._state = gameState.battleState as 'idle' | 'fighting' | 'victory' | 'defeat';
        this._turnCount = gameState.turnCount;
        this._floor = gameState.floor;
        this._battlesOnCurrentFloor = gameState.battlesOnCurrentFloor;
        this._battlesPerFloor = gameState.battlesPerFloor;
    }

    get state(): 'idle' | 'fighting' | 'victory' | 'defeat' { return this._state; }
    get turnCount(): number { return this._turnCount; }
    get floor(): number { return this._floor; }
    get battlesOnCurrentFloor(): number { return this._battlesOnCurrentFloor; }
    get battlesPerFloor(): number { return this._battlesPerFloor; }
    get isPlayerTurn(): boolean { return true; }  // 現状、常にプレイヤー先攻
}

/**
 * ゲーム状態からスナップショットを作成
 */
export function createBattleSnapshot(game: Game): {
    player: ReadonlyPlayerState;
    enemy: ReadonlyEnemyState | null;
    battleState: ReadonlyBattleState;
} {
    const state = game.getState();

    return {
        player: new ReadonlyPlayerWrapper(state.player),
        enemy: state.enemy ? new ReadonlyEnemyWrapper(state.enemy) : null,
        battleState: new ReadonlyBattleStateWrapper(state)
    };
}

export {
    ReadonlyPlayerWrapper,
    ReadonlyEnemyWrapper,
    ReadonlyBattleStateWrapper,
    ReadonlyInventoryWrapper
};
