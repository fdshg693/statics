/**
 * メッセージユーティリティ
 * バトルログのメッセージ処理・テキストフォーマットを担当
 *
 * 責務:
 * - メッセージタイプの判定
 * - バトルログのフォーマット
 * - 表示用テキストの生成（レアリティ等）
 */

import type { ItemRarity } from '../entities/Item.js';

export type MessageType = 'damage' | 'heal' | 'victory' | 'defeat' | 'defend' | 'escape' | 'info';

export interface BattleLogEntry {
    message: string;
    timestamp: number;
    turn: number;
}

export interface FormattedMessage {
    text: string;
    type: MessageType;
    id: string;
}

/**
 * メッセージの種類を判定
 * @param {string} message - メッセージテキスト
 * @returns {string} メッセージタイプ
 */
export function getMessageType(message: string): MessageType {
    if (message.includes('ダメージ') || message.includes('攻撃')) {
        return 'damage';
    } else if (message.includes('回復') || message.includes('HP+')) {
        return 'heal';
    } else if (message.includes('倒した') || message.includes('レベルアップ')) {
        return 'victory';
    } else if (message.includes('倒れた')) {
        return 'defeat';
    } else if (message.includes('防御')) {
        return 'defend';
    } else if (message.includes('逃げ')) {
        return 'escape';
    }
    return 'info';
}

/**
 * バトルログを整形されたメッセージリストに変換
 * @param {Array<{message: string, timestamp: number, turn: number}>} battleLog
 * @returns {Array<{text: string, type: string, id: string}>}
 */
export function formatBattleLog(battleLog: BattleLogEntry[]): FormattedMessage[] {
    return battleLog.map((log, index) => ({
        text: log.message,
        type: getMessageType(log.message),
        id: `${log.timestamp}-${index}`
    }));
}

/**
 * レアリティの表示テキストを取得
 * @param rarity - アイテムのレアリティ
 * @returns 表示用のレアリティテキスト（括弧付き）
 */
export function getRarityText(rarity: ItemRarity | string): string {
    switch (rarity) {
        case 'legendary':
            return '【伝説】';
        case 'epic':
            return '【史詩】';
        case 'rare':
            return '【レア】';
        case 'uncommon':
            return '【上級】';
        case 'common':
        default:
            return '';
    }
}
