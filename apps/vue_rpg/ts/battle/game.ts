/**
 * RPG Game Core Logic
 * 純粋なJavaScriptで実装されたRPGのコアロジック
 * UIから完全に独立
 * 
 * Gameクラスはバトルのオーケストレーションを担当し、
 * 実際の処理はPlayerとEnemyクラスに委譲
 */

import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { generateRandomEnemy } from './entities/EnemyGenerator.js';
import { generateDrops } from './entities/ItemDropGenerator.js';
import { Potion } from './entities/Item.js';
import { FloorConstants, PlayerActionConstants } from './GameConstants.js';
import { getRarityText } from './utils/message.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('Game');

export interface BattleLogEntry {
    message: string;
    timestamp: number;
    turn: number;
}

export interface GameState {
    player: any | null;
    enemy: any | null;
    battleState: string;
    isDefending: boolean;
    turnCount: number;
    battleLog: BattleLogEntry[];
    floor: number;
    battlesOnCurrentFloor: number;
    battlesPerFloor: number;
}

/**
 * ゲームクラス
 * RPGの戦闘システムを管理
 */
class Game {
    player: Player;
    enemy: Enemy | null;
    battleLog: BattleLogEntry[];
    isDefending: boolean;
    battleState: string;
    turnCount: number;
    floor: number;
    battlesOnCurrentFloor: number;
    battlesPerFloor: number;

    constructor() {
        this.player = new Player('勇者', 100, 20, 10, 1);
        this.enemy = null;
        this.battleLog = [];
        this.isDefending = false;
        this.battleState = 'idle'; // idle, fighting, victory, defeat
        this.turnCount = 0;
        this.floor = 1; // 現在の階層
        this.battlesOnCurrentFloor = 0; // 現在の階で戦った回数
        this.battlesPerFloor = FloorConstants.BATTLES_PER_FLOOR; // 階が上がるまでの戦闘回数

        log.debug('Game initialized', {
            player: this.player.toJSON(),
            floor: this.floor,
            battlesPerFloor: this.battlesPerFloor
        });
    }

    /**
     * ポーションを使用
     * @param {string} itemId - 使用するポーションのID
     * @returns {boolean} 使用できたかどうか
     */
    usePotion(itemId: string): boolean {
        const item = this.player.inventory.getItem(itemId);

        if (!item || item.type !== 'potion') {
            this.addLog('ポーションが見つからなかった...');
            log.debug('Use potion failed (not found)', { itemId });
            return false;
        }

        const potion = item as Potion;

        if (this.battleState === 'fighting') {
            this.turnCount++;
            this.isDefending = false;
        }

        const playerHpBefore = this.player.hp;
        const actualHeal = this.player.heal(potion.healAmount);
        this.player.inventory.removeItem(itemId);

        this.addLog(`${this.player.name}は${potion.name}を使った！ HP+${actualHeal}`);

        log.debug('Potion used', {
            itemId,
            healAmount: potion.healAmount,
            actualHeal,
            playerHpBefore,
            playerHpAfter: this.player.hp,
            battleState: this.battleState,
            turn: this.turnCount
        });

        if (this.battleState === 'fighting') {
            if (!this.checkBattleState()) {
                return true;
            }

            // 敵の反撃
            this.enemyAttack();
        }

        return true;
    }

    /**
     * プレイヤーの初期化
     */
    initializePlayer(): void {
        this.player = new Player('勇者', 100, 20, 10, 1);
        log.debug('Player initialized', this.player.toJSON());
    }

    /**
     * 戦闘ログにメッセージを追加
     * @param {string} message - ログメッセージ
     */
    addLog(message: string): void {
        this.battleLog.push({
            message,
            timestamp: Date.now(),
            turn: this.turnCount
        });
        log.debug('Battle log added', { message, turn: this.turnCount });
    }

    /**
     * ランダムな敵を生成
     * @returns {Enemy} 生成された敵
     */
    generateEnemy(): Enemy {
        const enemy = generateRandomEnemy(this.player.level, this.floor);
        log.debug('Enemy generated', enemy.toJSON());
        return enemy;
    }

    /**
     * 新しい戦闘を開始
     */
    startNewBattle(): void {
        this.enemy = this.generateEnemy();
        this.battleLog = [];
        this.isDefending = false;
        this.battleState = 'fighting';
        this.turnCount = 0;

        log.group('Battle started', {
            floor: this.floor,
            battlesOnCurrentFloor: this.battlesOnCurrentFloor,
            battlesPerFloor: this.battlesPerFloor,
            player: this.player.toJSON(),
            enemy: this.enemy?.toJSON()
        });

        this.addLog(`${this.enemy.name}が現れた！`);
        this.addLog(`${this.enemy.name} HP: ${this.enemy.hp}/${this.enemy.maxHp}`);

        log.groupEnd();
    }

    /**
     * 戦闘状態をチェック
     * @returns {boolean} 戦闘が続行可能かどうか
     */
    checkBattleState(): boolean {
        if (this.enemy && !this.enemy.isAlive()) {
            this.battleState = 'victory';
            this.addLog(`${this.enemy.name}を倒した！`);

            log.group('Enemy defeated', {
                enemy: this.enemy.toJSON(),
                player: this.player.toJSON(),
                floor: this.floor,
                turn: this.turnCount
            });

            // 経験値獲得とレベルアップ
            const levelUpResult = this.player.gainExp(this.enemy.expReward);
            this.addLog(`${this.enemy.expReward}の経験値を獲得した！`);
            if (levelUpResult.levelUp) {
                this.addLog(levelUpResult.message);
            }

            log.debug('Exp gained', {
                expReward: this.enemy.expReward,
                levelUp: levelUpResult.levelUp,
                player: this.player.toJSON()
            });

            // アイテムドロップ
            const drops = generateDrops(this.enemy, this.floor);
            log.debug('Item drop generated', {
                enemy: this.enemy.name,
                floor: this.floor,
                drops
            });
            for (const item of drops) {
                this.player.inventory.addItem(item);
                log.debug('Item added to inventory', {
                    item,
                    inventoryCount: this.player.inventory.items.length,
                    gold: this.player.inventory.gold
                });
                if (item.type === 'gold') {
                    this.addLog(`${(item as any).amount}ゴールドを手に入れた！`);
                } else {
                    const rarityText = getRarityText(item.rarity);
                    this.addLog(`${rarityText}${item.name}を手に入れた！`);
                }
            }

            // 戦闘回数をカウント
            this.battlesOnCurrentFloor++;
            log.debug('Battle count updated', {
                floor: this.floor,
                battlesOnCurrentFloor: this.battlesOnCurrentFloor,
                battlesPerFloor: this.battlesPerFloor
            });
            
            // 指定回数の戦闘後に階層を上げる
            if (this.battlesOnCurrentFloor >= this.battlesPerFloor) {
                this.floor++;
                this.battlesOnCurrentFloor = 0;
                this.addLog(`--- ${this.floor}階に到達しました ---`);
                log.info('Floor advanced', { floor: this.floor });
            }

            log.groupEnd();

            return false;
        }

        if (!this.player.isAlive()) {
            this.battleState = 'defeat';
            this.addLog('あなたは倒れた...');
            log.warn('Player defeated', {
                player: this.player.toJSON(),
                enemy: this.enemy?.toJSON(),
                floor: this.floor,
                turn: this.turnCount
            });
            return false;
        }

        return true;
    }

    /**
     * プレイヤーが敵を攻撃
     */
    attackEnemy(): void {
        if (this.battleState !== 'fighting' || !this.enemy) {
            log.debug('Attack ignored (invalid state)', {
                battleState: this.battleState,
                hasEnemy: !!this.enemy
            });
            return;
        }

        const mpCost = PlayerActionConstants.ATTACK_MP_COST;
        if (!this.player.consumeMp(mpCost)) {
            this.addLog(`${this.player.name}のMPが足りない！`);
            log.debug('Attack blocked (insufficient MP)', {
                mp: this.player.mp,
                mpCost
            });
            return;
        }

        this.turnCount++;
        this.isDefending = false;

        const enemyHpBefore = this.enemy.hp;

        // Playerクラスに処理を委譲
        const result = this.player.attackTarget(this.enemy, false);
        this.addLog(result.message);

        log.debug('Player attacked', {
            damage: result.damage,
            enemyHpBefore,
            enemyHpAfter: this.enemy.hp,
            turn: this.turnCount
        });

        if (!this.checkBattleState()) {
            return;
        }

        // 敵の反撃
        this.enemyAttack();
    }

    /**
     * 敵がプレイヤーを攻撃
     */
    enemyAttack(): void {
        if (this.battleState !== 'fighting' || !this.enemy) {
            log.debug('Enemy attack skipped (invalid state)', {
                battleState: this.battleState,
                hasEnemy: !!this.enemy
            });
            return;
        }

        const playerHpBefore = this.player.hp;

        // Enemyクラスに処理を委譲
        const result = this.enemy.attackTarget(this.player, this.isDefending);
        this.addLog(result.message);

        log.debug('Enemy attacked', {
            damage: result.damage,
            playerHpBefore,
            playerHpAfter: this.player.hp,
            isDefending: this.isDefending,
            turn: this.turnCount
        });

        this.isDefending = false;

        this.checkBattleState();
    }

    /**
     * プレイヤーが回復
     */
    playerHeal(): void {
        if (this.battleState !== 'fighting') {
            log.debug('Heal ignored (invalid state)', { battleState: this.battleState });
            return;
        }

        const mpCost = PlayerActionConstants.HEAL_MP_COST;
        if (!this.player.consumeMp(mpCost)) {
            this.addLog(`${this.player.name}のMPが足りない！`);
            log.debug('Heal blocked (insufficient MP)', {
                mp: this.player.mp,
                mpCost
            });
            return;
        }

        this.turnCount++;
        this.isDefending = false;

        const playerHpBefore = this.player.hp;

        // Playerクラスに処理を委譲
        const result = this.player.performHeal();
        this.addLog(result.message);

        log.debug('Player healed', {
            healAmount: result.healAmount,
            playerHpBefore,
            playerHpAfter: this.player.hp,
            turn: this.turnCount
        });

        if (!this.checkBattleState()) {
            return;
        }

        // 敵の反撃
        this.enemyAttack();
    }

    /**
     * プレイヤーが防御
     */
    playerDefend(): void {
        if (this.battleState !== 'fighting') {
            log.debug('Defend ignored (invalid state)', { battleState: this.battleState });
            return;
        }

        const mpCost = PlayerActionConstants.DEFEND_MP_COST;
        if (!this.player.consumeMp(mpCost)) {
            this.addLog(`${this.player.name}のMPが足りない！`);
            log.debug('Defend blocked (insufficient MP)', {
                mp: this.player.mp,
                mpCost
            });
            return;
        }

        this.turnCount++;
        this.isDefending = true;

        log.debug('Player defending', { turn: this.turnCount });

        this.addLog(`${this.player.name}は身を守っている...`);

        if (!this.checkBattleState()) {
            return;
        }

        // 敵の攻撃
        this.enemyAttack();
    }

    /**
     * 逃走を試みる
     * @returns {boolean} 逃走成功したかどうか
     */
    flee(): boolean {
        if (this.battleState !== 'fighting') {
            log.debug('Flee ignored (invalid state)', { battleState: this.battleState });
            return false;
        }

        const mpCost = PlayerActionConstants.ESCAPE_MP_COST;
        if (!this.player.consumeMp(mpCost)) {
            this.addLog(`${this.player.name}のMPが足りない！`);
            log.debug('Flee blocked (insufficient MP)', {
                mp: this.player.mp,
                mpCost
            });
            return false;
        }

        this.turnCount++;
        this.isDefending = false;

        // 逃走成功率は50%
        const success = Math.random() < PlayerActionConstants.ESCAPE_SUCCESS_RATE;

        log.debug('Flee attempted', {
            success,
            turn: this.turnCount,
            escapeRate: PlayerActionConstants.ESCAPE_SUCCESS_RATE
        });

        if (success) {
            this.addLog(`${this.player.name}は逃げ出した！`);
            this.battleState = 'idle';
            this.enemy = null;
            return true;
        } else {
            this.addLog(`${this.player.name}は逃げられなかった！`);

            if (!this.checkBattleState()) {
                return false;
            }

            // 敵の攻撃
            this.enemyAttack();
            return false;
        }
    }

    /**
     * ゲームをリセット
     */
    reset(): void {
        this.initializePlayer();
        this.enemy = null;
        this.battleLog = [];
        this.isDefending = false;
        this.battleState = 'idle';
        this.turnCount = 0;
        this.floor = 1;
        this.battlesOnCurrentFloor = 0;

        this.addLog('ゲームをリセットしました');
        log.info('Game reset', {
            player: this.player.toJSON(),
            floor: this.floor
        });
    }

    /**
     * 現在のゲーム状態を取得
     * @returns {Object} ゲーム状態
     */
    getState(): GameState {
        const state = {
            player: this.player ? this.player.toJSON() : null,
            enemy: this.enemy ? this.enemy.toJSON() : null,
            battleState: this.battleState,
            isDefending: this.isDefending,
            turnCount: this.turnCount,
            battleLog: [...this.battleLog],
            floor: this.floor,
            battlesOnCurrentFloor: this.battlesOnCurrentFloor,
            battlesPerFloor: this.battlesPerFloor
        };
        log.debug('State snapshot', {
            battleState: state.battleState,
            turnCount: state.turnCount,
            floor: state.floor,
            battlesOnCurrentFloor: state.battlesOnCurrentFloor,
            player: state.player,
            enemy: state.enemy
        });
        return state;
    }
}

// エクスポート
export { Game };
