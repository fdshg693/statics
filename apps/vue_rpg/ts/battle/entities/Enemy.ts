/**
 * Enemyクラス
 * 敵キャラクターの状態と行動をカプセル化
 */
import { BattleConstants, EnemyTypeMultipliers } from '../GameConstants.js';

export type EnemyType = 'normal' | 'leader' | 'boss';

export interface AttackResult {
    damage: number;
    message: string;
}

export interface EnemyData {
    name: string;
    type: EnemyType;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    level: number;
    expReward: number;
    isAlive: boolean;
}

export class Enemy {
    name: string;
    type: EnemyType;
    maxHp: number;
    hp: number;
    attack: number;
    defense: number;
    level: number;
    expReward: number;

    constructor(name: string, hp: number, attack: number, defense: number, level: number = 1, expReward: number | null = null, type: EnemyType = 'normal') {
        this.name = name;
        this.type = type;
        
        // タイプに応じたステータス倍率を適用
        const multiplier = this.getStatMultiplier();
        
        this.maxHp = Math.floor(hp * multiplier);
        this.hp = this.maxHp;
        this.attack = Math.floor(attack * multiplier);
        this.defense = Math.floor(defense * multiplier);
        this.level = level;
        this.expReward = expReward !== null ? expReward : level * 10;
    }

    /**
     * タイプに応じたステータス倍率を取得
     * @returns {number} ステータス倍率
     */
    getStatMultiplier(): number {
        switch (this.type) {
            case 'leader':
                return EnemyTypeMultipliers.LEADER;
            case 'boss':
                return EnemyTypeMultipliers.BOSS;
            case 'normal':
            default:
                return EnemyTypeMultipliers.NORMAL;
        }
    }

    /**
     * ダメージを受ける
     * @param {number} damage - 受けるダメージ量
     * @returns {number} 実際に受けたダメージ
     */
    takeDamage(damage: number): number {
        const actualDamage = Math.max(0, Math.floor(damage));
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    /**
     * 回復する（敵の場合、将来的な拡張用）
     * @param {number} amount - 回復量
     * @returns {number} 実際に回復した量
     */
    heal(amount: number): number {
        const beforeHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - beforeHp;
    }

    /**
     * 生存確認
     * @returns {boolean} 生きているかどうか
     */
    isAlive(): boolean {
        return this.hp > 0;
    }

    /**
     * プレイヤーを攻撃
     * @param {any} player - 攻撃対象のプレイヤー
     * @param {boolean} isDefending - プレイヤーが防御中か
     * @returns {Object} 攻撃結果 {damage: number, message: string}
     */
    attackTarget(player: any, isDefending: boolean = false): AttackResult {
        const damage = this.calculateDamage(player.defense, isDefending);
        const actualDamage = player.takeDamage(damage);
        
        if (isDefending) {
            return {
                damage: actualDamage,
                message: `${this.name}の攻撃！ ${player.name}は防御した！ ${actualDamage}のダメージ！`
            };
        } else {
            return {
                damage: actualDamage,
                message: `${this.name}の攻撃！ ${player.name}に${actualDamage}のダメージ！`
            };
        }
    }

    /**
     * ダメージを計算
     * @param {number} targetDefense - 攻撃対象の防御力
     * @param {boolean} isDefending - 対象が防御中か
     * @returns {number} 計算されたダメージ
     */
    calculateDamage(targetDefense: number, isDefending: boolean = false): number {
        // 基本ダメージ = 攻撃力 - 防御力/2
        let baseDamage = this.attack - targetDefense / 2;

        // ランダム要素（±20%）
        const randomRange = BattleConstants.DAMAGE_RANDOM_MAX - BattleConstants.DAMAGE_RANDOM_MIN;
        const randomFactor = BattleConstants.DAMAGE_RANDOM_MIN + Math.random() * randomRange;
        baseDamage *= randomFactor;

        // 防御時はダメージを軽減
        if (isDefending) {
            baseDamage *= BattleConstants.DEFENSE_DAMAGE_REDUCTION;
        }

        // 最小ダメージ
        return Math.max(BattleConstants.MINIMUM_DAMAGE, Math.floor(baseDamage));
    }

    /**
     * 敵を倒した時の経験値を取得
     * @returns {number} 経験値
     */
    getExpReward(): number {
        return this.expReward;
    }

    /**
     * 敵の状態をシリアライズ
     * @returns {Object} 敵状態
     */
    toJSON(): EnemyData {
        return {
            name: this.name,
            type: this.type,
            hp: this.hp,
            maxHp: this.maxHp,
            attack: this.attack,
            defense: this.defense,
            level: this.level,
            expReward: this.expReward,
            isAlive: this.isAlive()
        };
    }
}
