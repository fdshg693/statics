/**
 * Playerクラス
 * プレイヤーキャラクターの状態と行動をカプセル化
 */
import { Inventory } from './Inventory.js';
import { Enemy } from './Enemy.js';
import {
    BattleConstants,
    PlayerActionConstants,
    LevelUpConstants
} from '../GameConstants.js';

export interface AttackResult {
    damage: number;
    message: string;
}

export interface HealResult {
    healAmount: number;
    message: string;
}

export interface ExpGainResult {
    exp: number;
    levelUp: boolean;
    message: string;
}

export interface LevelUpResult {
    level: number;
    message: string;
}

export interface PlayerData {
    name: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    level: number;
    exp: number;
    expToNextLevel: number;
    isAlive: boolean;
    inventory: any;
}

export class Player {
    name: string;
    maxHp: number;
    hp: number;
    maxMp: number;
    mp: number;
    attack: number;
    defense: number;
    level: number;
    exp: number;
    expToNextLevel: number;
    inventory: Inventory;

    constructor(name: string, hp: number, attack: number, defense: number, level: number = 1, inventory: Inventory | null = null) {
        this.name = name;
        this.maxHp = hp;
        this.hp = hp;
        this.maxMp = PlayerActionConstants.INITIAL_MP;
        this.mp = this.maxMp;
        this.attack = attack;
        this.defense = defense;
        this.level = level;
        this.exp = 0;
        this.expToNextLevel = 100;
        this.inventory = inventory || new Inventory();
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
     * 回復する
     * @param {number} amount - 回復量
     * @returns {number} 実際に回復した量
     */
    heal(amount: number): number {
        const beforeHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - beforeHp;
    }

    /**
     * MPを消費できるか確認
     * @param {number} amount - 消費量
     * @returns {boolean} 消費可能か
     */
    canConsumeMp(amount: number): boolean {
        if (amount <= 0) return true;
        return this.mp >= amount;
    }

    /**
     * MPを消費
     * @param {number} amount - 消費量
     * @returns {boolean} 消費できたか
     */
    consumeMp(amount: number): boolean {
        if (!this.canConsumeMp(amount)) {
            return false;
        }
        if (amount > 0) {
            this.mp = Math.max(0, this.mp - amount);
        }
        return true;
    }

    /**
     * 生存確認
     * @returns {boolean} 生きているかどうか
     */
    isAlive(): boolean {
        return this.hp > 0;
    }

    /**
     * 敵を攻撃
     * @param {Enemy} enemy - 攻撃対象の敵
     * @param {boolean} isDefending - 敵が防御中か
     * @returns {Object} 攻撃結果 {damage: number, message: string}
     */
    attackTarget(enemy: Enemy, isDefending: boolean = false): AttackResult {
        const damage = this.calculateDamage(enemy.defense, isDefending);
        const actualDamage = enemy.takeDamage(damage);

        return {
            damage: actualDamage,
            message: `${this.name}の攻撃！ ${enemy.name}に${actualDamage}のダメージ！`
        };
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
     * 回復行動を実行
     * @returns {Object} 回復結果 {healAmount: number, message: string}
     */
    performHeal(): HealResult {
        const healAmount = Math.floor(this.maxHp * PlayerActionConstants.HEAL_RATE);
        const actualHeal = this.heal(healAmount);

        return {
            healAmount: actualHeal,
            message: `${this.name}は回復した！ HP+${actualHeal}`
        };
    }

    /**
     * 経験値を獲得
     * @param {number} amount - 獲得経験値
     * @returns {Object} 経験値獲得結果 {exp: number, levelUp: boolean, message: string}
     */
    gainExp(amount: number): ExpGainResult {
        this.exp += amount;
        let didLevelUp = false;
        let message = `${amount}の経験値を獲得！`;

        // レベルアップ判定
        if (this.exp >= this.expToNextLevel) {
            const levelUpResult = this.levelUp();
            didLevelUp = true;
            message += ` ${levelUpResult.message}`;
        }

        return {
            exp: this.exp,
            levelUp: didLevelUp,
            message: message
        };
    }

    /**
     * レベルアップ
     * @returns {Object} レベルアップ情報 {level: number, message: string}
     */
    levelUp(): LevelUpResult {
        this.level++;
        this.maxHp += LevelUpConstants.HP_INCREASE;
        this.hp = this.maxHp;
        this.maxMp += LevelUpConstants.MP_INCREASE;
        this.mp = this.maxMp;
        this.attack += LevelUpConstants.ATTACK_INCREASE;
        this.defense += LevelUpConstants.DEFENSE_INCREASE;

        // 経験値をリセットし、次のレベルまでの必要経験値を増やす
        this.exp = 0;
        this.expToNextLevel = Math.floor(this.expToNextLevel * LevelUpConstants.EXP_MULTIPLIER);

        return {
            level: this.level,
            message: `レベルアップ！ レベル${this.level}になった！`
        };
    }

    /**
     * プレイヤーの状態をシリアライズ
     * @returns {Object} プレイヤー状態
     */
    toJSON(): PlayerData {
        return {
            name: this.name,
            hp: this.hp,
            maxHp: this.maxHp,
            mp: this.mp,
            maxMp: this.maxMp,
            attack: this.attack,
            defense: this.defense,
            level: this.level,
            exp: this.exp,
            expToNextLevel: this.expToNextLevel,
            isAlive: this.isAlive(),
            inventory: this.inventory.toJSON()
        };
    }

    /**
     * 完全回復
     */
    fullRecover(): void {
        this.hp = this.maxHp;
        this.mp = this.maxMp;
    }
}
