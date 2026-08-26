import { Enemy } from './Enemy.js';

/**
 * 敵のテンプレートデータ
 * frequency: 出現頻度（正の整数、数値÷合計で出現確率が決まる）
 * expMultiplier: 経験値倍率（level * expMultiplier で経験値が決まる）
 * hpGrowth, attackGrowth, defenseGrowth: レベルごとのステータス成長値
 */
export interface EnemyTemplate {
    name: string;
    hp: number;
    attack: number;
    defense: number;
    level: number;
    frequency: number;
    expMultiplier: number;
    hpGrowth: number;
    attackGrowth: number;
    defenseGrowth: number;
}

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
    { name: 'スライム', hp: 30, attack: 8, defense: 3, level: 1, frequency: 50, expMultiplier: 10, hpGrowth: 5, attackGrowth: 1, defenseGrowth: 0.5 },
    { name: 'ゴブリン', hp: 50, attack: 12, defense: 5, level: 2, frequency: 30, expMultiplier: 15, hpGrowth: 8, attackGrowth: 2, defenseGrowth: 1 },
    { name: 'オーク', hp: 80, attack: 18, defense: 8, level: 3, frequency: 15, expMultiplier: 15, hpGrowth: 12, attackGrowth: 3, defenseGrowth: 1.5 },
    { name: 'トロール', hp: 120, attack: 25, defense: 12, level: 4, frequency: 8, expMultiplier: 20, hpGrowth: 18, attackGrowth: 4, defenseGrowth: 2 },
    { name: 'ドラゴン', hp: 200, attack: 35, defense: 20, level: 5, frequency: 2, expMultiplier: 20, hpGrowth: 30, attackGrowth: 6, defenseGrowth: 3 }
];

/**
 * 出現頻度を考慮してランダムに敵を選択
 * @param {Array} enemies - 敵テンプレートの配列
 * @returns {Object} 選択された敵テンプレート
 */
function selectEnemyByFrequency(enemies: EnemyTemplate[]): EnemyTemplate {
    // 合計頻度を計算
    const totalFrequency = enemies.reduce((sum, enemy) => sum + enemy.frequency, 0);
    
    // ランダムな値を生成（0から合計頻度まで）
    let random = Math.random() * totalFrequency;
    
    // 累積頻度で敵を選択
    for (const enemy of enemies) {
        random -= enemy.frequency;
        if (random <= 0) {
            return enemy;
        }
    }
    
    // フォールバック（通常はここには到達しない）
    return enemies[enemies.length - 1];
}

/**
 * ランダムな敵を生成
 * @param {number} playerLevel - プレイヤーのレベル
 * @param {number} floor - 現在の階数
 * @returns {Enemy} 生成された敵
 */
export function generateRandomEnemy(playerLevel: number, floor: number): Enemy {
    // プレイヤーのレベルに応じて敵の範囲を制限
    const maxEnemyLevel = Math.min(
        ENEMY_TEMPLATES.length,
        Math.max(1, playerLevel + 1)
    );
    const availableEnemies = ENEMY_TEMPLATES.filter(e => e.level <= maxEnemyLevel);

    // 出現頻度を考慮して敵を選択
    const enemyTemplate = selectEnemyByFrequency(availableEnemies);

    // 階数に基づいて敵の実際のレベルを決定（floor + ランダム(-1 ~ +2)、最小レベルは1）
    const randomOffset = Math.floor(Math.random() * 4) - 1; // -1, 0, 1, 2 のいずれか
    const enemyLevel = Math.max(1, floor + randomOffset);

    // レベルに応じてステータスを計算（ベース + 成長値 × レベル）
    const hp = Math.floor(enemyTemplate.hp + enemyTemplate.hpGrowth * enemyLevel);
    const attack = Math.floor(enemyTemplate.attack + enemyTemplate.attackGrowth * enemyLevel);
    const defense = Math.floor(enemyTemplate.defense + enemyTemplate.defenseGrowth * enemyLevel);

    // 敵のタイプを決定（通常: 85%, リーダー: 13%, ボス: 2%）
    const typeRoll = Math.random() * 100;
    let enemyType: 'normal' | 'leader' | 'boss' = 'normal';
    let enemyName = enemyTemplate.name;
    let expMultiplier = 1.0;

    if (typeRoll < 2) {
        // ボス: 2%
        enemyType = 'boss';
        enemyName = `${enemyTemplate.name}・ザ・ボス`;
        expMultiplier = 2.0;
    } else if (typeRoll < 15) {
        // リーダー: 13% (2% + 13% = 15%)
        enemyType = 'leader';
        enemyName = `リーダー${enemyTemplate.name}`;
        expMultiplier = 1.5;
    }

    // 経験値を計算（レベル × 経験値倍率 × タイプ倍率）
    const expReward = Math.floor(enemyTemplate.level * enemyTemplate.expMultiplier * expMultiplier);

    return new Enemy(
        enemyName,
        hp,
        attack,
        defense,
        enemyLevel,
        expReward,
        enemyType
    );
}
