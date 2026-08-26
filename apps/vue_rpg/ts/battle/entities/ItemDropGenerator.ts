/**
 * ItemDropGenerator
 * 敵を倒した際のアイテムドロップを生成
 */
import { Weapon, Potion, Gold, Item, ItemRarity } from './Item.js';
import { Enemy } from './Enemy.js';
import { EnemyTypeMultipliers } from '../GameConstants.js';

interface WeaponData {
    name: string;
    attackBonus: number;
}

interface PotionData {
    name: string;
    healAmount: number;
}

/**
 * ランダムにアイテムをドロップ
 * @param {Enemy} enemy - 倒した敵
 * @param {number} floor - 現在の階層
 * @returns {Array<Item>} ドロップしたアイテムリスト
 */
export function generateDrops(enemy: Enemy, floor: number): Item[] {
    const drops: Item[] = [];
    
    // 必ずゴールドをドロップ
    const goldAmount = calculateGoldDrop(enemy, floor);
    drops.push(new Gold(goldAmount));
    
    // 武器のドロップ判定
    if (Math.random() < getWeaponDropRate(enemy)) {
        const weapon = generateWeapon(enemy, floor);
        drops.push(weapon);
    }
    
    // ポーションのドロップ判定
    if (Math.random() < getPotionDropRate(enemy)) {
        const potion = generatePotion(enemy, floor);
        drops.push(potion);
    }
    
    return drops;
}

/**
 * ゴールドのドロップ量を計算
 * @param {Enemy} enemy - 倒した敵
 * @param {number} floor - 現在の階層
 * @returns {number} ゴールド量
 */
function calculateGoldDrop(enemy: Enemy, floor: number): number {
    let baseGold = 10 + floor * 5;
    
    // 敵のタイプによる倍率
    switch (enemy.type) {
        case 'leader':
            baseGold *= EnemyTypeMultipliers.LEADER;
            break;
        case 'boss':
            baseGold *= EnemyTypeMultipliers.BOSS * 1.25; // ボスはさらに25%ボーナス
            break;
    }
    
    // ランダム要素（±30%）
    const randomFactor = 0.7 + Math.random() * 0.6;
    return Math.floor(baseGold * randomFactor);
}

/**
 * 武器のドロップ率を取得
 * @param {Enemy} enemy - 倒した敵
 * @returns {number} ドロップ率（0.0 ~ 1.0）
 */
function getWeaponDropRate(enemy: Enemy): number {
    switch (enemy.type) {
        case 'boss':
            return 0.8;
        case 'leader':
            return 0.4;
        case 'normal':
        default:
            return 0.15;
    }
}

/**
 * ポーションのドロップ率を取得
 * @param {Enemy} enemy - 倒した敵
 * @returns {number} ドロップ率（0.0 ~ 1.0）
 */
function getPotionDropRate(enemy: Enemy): number {
    switch (enemy.type) {
        case 'boss':
            return 0.7;
        case 'leader':
            return 0.5;
        case 'normal':
        default:
            return 0.25;
    }
}

/**
 * 武器を生成
 * @param {Enemy} enemy - 倒した敵
 * @param {number} floor - 現在の階層
 * @returns {Weapon} 生成された武器
 */
function generateWeapon(enemy: Enemy, floor: number): Weapon {
    // レアリティを決定
    const rarity = determineRarity(enemy);
    
    // レアリティに応じた武器を生成
    const weaponData = getWeaponByRarity(rarity, floor);
    
    return new Weapon(
        `weapon_${Date.now()}_${Math.random()}`,
        weaponData.name,
        weaponData.attackBonus,
        rarity
    );
}

/**
 * ポーションを生成
 * @param {Enemy} enemy - 倒した敵
 * @param {number} floor - 現在の階層
 * @returns {Potion} 生成されたポーション
 */
function generatePotion(enemy: Enemy, floor: number): Potion {
    // レアリティを決定
    const rarity = determineRarity(enemy);
    
    // レアリティに応じたポーションを生成
    const potionData = getPotionByRarity(rarity, floor);
    
    return new Potion(
        `potion_${Date.now()}_${Math.random()}`,
        potionData.name,
        potionData.healAmount,
        rarity
    );
}

/**
 * レアリティを決定
 * @param {Enemy} enemy - 倒した敵
 * @returns {string} レアリティ
 */
function determineRarity(enemy: Enemy): ItemRarity {
    const rand = Math.random();
    
    // ボスの場合、レアが出やすい
    if (enemy.type === 'boss') {
        if (rand < 0.1) return 'legendary';
        if (rand < 0.3) return 'epic';
        if (rand < 0.6) return 'rare';
        if (rand < 0.85) return 'uncommon';
        return 'common';
    }
    
    // リーダーの場合
    if (enemy.type === 'leader') {
        if (rand < 0.05) return 'epic';
        if (rand < 0.20) return 'rare';
        if (rand < 0.50) return 'uncommon';
        return 'common';
    }
    
    // 通常の敵
    if (rand < 0.01) return 'rare';
    if (rand < 0.10) return 'uncommon';
    return 'common';
}

/**
 * レアリティに応じた武器データを取得
 * @param {string} rarity - レアリティ
 * @param {number} floor - 現在の階層
 * @returns {Object} 武器データ
 */
function getWeaponByRarity(rarity: ItemRarity, floor: number): WeaponData {
    const baseBonus = 2 + Math.floor(floor * 0.5);
    
    switch (rarity) {
        case 'legendary':
            return { name: '伝説の剣', attackBonus: baseBonus * 5 };
        case 'epic':
            return { name: '魔剣', attackBonus: baseBonus * 3.5 };
        case 'rare':
            return { name: '銀の剣', attackBonus: baseBonus * 2.5 };
        case 'uncommon':
            return { name: '鋼の剣', attackBonus: baseBonus * 1.5 };
        case 'common':
        default:
            return { name: '鉄の剣', attackBonus: baseBonus };
    }
}

/**
 * レアリティに応じたポーションデータを取得
 * @param {string} rarity - レアリティ
 * @param {number} floor - 現在の階層
 * @returns {Object} ポーションデータ
 */
function getPotionByRarity(rarity: ItemRarity, floor: number): PotionData {
    const baseHeal = 20 + Math.floor(floor * 2);
    
    switch (rarity) {
        case 'legendary':
            return { name: '万能薬', healAmount: baseHeal * 5 };
        case 'epic':
            return { name: '高級ポーション', healAmount: baseHeal * 3.5 };
        case 'rare':
            return { name: '上級ポーション', healAmount: baseHeal * 2.5 };
        case 'uncommon':
            return { name: '中級ポーション', healAmount: baseHeal * 1.5 };
        case 'common':
        default:
            return { name: '初級ポーション', healAmount: baseHeal };
    }
}
