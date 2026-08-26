/**
 * Inventoryクラス
 * プレイヤーの所持品を管理
 */
import { Item } from './Item.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('Inventory');

export interface InventoryData {
    items: any[];
    gold: number;
}

export class Inventory {
    items: Item[];
    gold: number;

    constructor() {
        this.items = [];
        this.gold = 0;
    }

    /**
     * アイテムを追加
     * @param {Item} item - 追加するアイテム
     */
    addItem(item: Item): void {
        log.debug('addItem called', { item });
        if (item.type === 'gold') {
            this.gold += (item as any).amount;
            log.debug('Gold updated', { gold: this.gold });
        } else {
            this.items.push(item);
            log.debug('Item list updated', { count: this.items.length, items: this.items });
        }
    }

    /**
     * アイテムを削除
     * @param {string} itemId - 削除するアイテムのID
     * @returns {boolean} 削除成功かどうか
     */
    removeItem(itemId: string): boolean {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * アイテムを取得
     * @param {string} itemId - 取得するアイテムのID
     * @returns {Item|null} アイテムまたはnull
     */
    getItem(itemId: string): Item | null {
        return this.items.find(item => item.id === itemId) || null;
    }

    /**
     * タイプ別にアイテムを取得
     * @param {string} type - アイテムタイプ
     * @returns {Array<Item>} アイテムリスト
     */
    getItemsByType(type: string): Item[] {
        return this.items.filter(item => item.type === type);
    }

    /**
     * 全アイテムを取得
     * @returns {Array<Item>} アイテムリスト
     */
    getAllItems(): Item[] {
        return [...this.items];
    }

    /**
     * アイテム数を取得
     * @returns {number} アイテム数
     */
    getItemCount(): number {
        return this.items.length;
    }

    /**
     * ゴールドを追加
     * @param {number} amount - 追加するゴールド
     */
    addGold(amount: number): void {
        this.gold += amount;
    }

    /**
     * ゴールドを使用
     * @param {number} amount - 使用するゴールド
     * @returns {boolean} 使用成功かどうか
     */
    spendGold(amount: number): boolean {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    /**
     * 所持ゴールドを取得
     * @returns {number} 所持ゴールド
     */
    getGold(): number {
        return this.gold;
    }

    /**
     * インベントリをクリア
     */
    clear(): void {
        this.items = [];
        this.gold = 0;
    }

    /**
     * インベントリをシリアライズ
     * @returns {Object} インベントリ情報
     */
    toJSON(): InventoryData {
        return {
            items: this.items.map(item => item.toJSON()),
            gold: this.gold
        };
    }

    /**
     * JSONからインベントリを復元
     * @param {Object} data - シリアライズされたデータ
     * @returns {Inventory} 復元されたインベントリ
     */
    static fromJSON(data: InventoryData): Inventory {
        const inventory = new Inventory();
        inventory.gold = data.gold || 0;
        if (data.items) {
            inventory.items = data.items.map(itemData => Item.fromJSON(itemData));
        }
        return inventory;
    }
}
