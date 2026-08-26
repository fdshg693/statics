/**
 * Itemクラス
 * アイテムの基底クラス
 */

export type ItemType = 'weapon' | 'potion' | 'gold';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemData {
    id: string;
    name: string;
    type: ItemType;
    rarity: ItemRarity;
}

export class Item {
    id: string;
    name: string;
    type: ItemType;
    rarity: ItemRarity;

    constructor(id: string, name: string, type: ItemType, rarity: ItemRarity = 'common') {
        this.id = id;
        this.name = name;
        this.type = type;
        this.rarity = rarity;
    }

    /**
     * アイテムをシリアライズ
     * @returns {Object} アイテム情報
     */
    toJSON(): ItemData {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            rarity: this.rarity
        };
    }

    /**
     * JSONからアイテムを復元
     * @param {Object} data - シリアライズされたデータ
     * @returns {Item} 復元されたアイテム
     */
    static fromJSON(data: any): Item {
        switch (data.type) {
            case 'weapon':
                return new Weapon(data.id, data.name, data.attackBonus, data.rarity);
            case 'potion':
                return new Potion(data.id, data.name, data.healAmount, data.rarity);
            case 'gold':
                return new Gold(data.amount);
            default:
                return new Item(data.id, data.name, data.type, data.rarity);
        }
    }
}

/**
 * Weaponクラス
 * 武器アイテム
 */
export interface WeaponData extends ItemData {
    attackBonus: number;
}

export class Weapon extends Item {
    attackBonus: number;

    constructor(id: string, name: string, attackBonus: number, rarity: ItemRarity = 'common') {
        super(id, name, 'weapon', rarity);
        this.attackBonus = attackBonus;
    }

    /**
     * アイテムをシリアライズ
     * @returns {Object} アイテム情報
     */
    toJSON(): WeaponData {
        return {
            ...super.toJSON(),
            attackBonus: this.attackBonus
        };
    }
}

/**
 * Potionクラス
 * ポーションアイテム
 */
export interface PotionData extends ItemData {
    healAmount: number;
}

export class Potion extends Item {
    healAmount: number;

    constructor(id: string, name: string, healAmount: number, rarity: ItemRarity = 'common') {
        super(id, name, 'potion', rarity);
        this.healAmount = healAmount;
    }

    /**
     * アイテムをシリアライズ
     * @returns {Object} アイテム情報
     */
    toJSON(): PotionData {
        return {
            ...super.toJSON(),
            healAmount: this.healAmount
        };
    }
}

/**
 * Goldクラス
 * ゴールド
 */
export interface GoldData extends ItemData {
    amount: number;
}

export class Gold extends Item {
    amount: number;

    constructor(amount: number) {
        super('gold', 'ゴールド', 'gold', 'common');
        this.amount = amount;
    }

    /**
     * アイテムをシリアライズ
     * @returns {Object} アイテム情報
     */
    toJSON(): GoldData {
        return {
            ...super.toJSON(),
            amount: this.amount
        };
    }
}
