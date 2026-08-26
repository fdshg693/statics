/**
 * アニメーションComposable
 * キャラクターのアニメーション管理を担当
 */

import { ref, Ref } from 'vue';

/**
 * アニメーション管理のためのComposable
 * @returns {Object} アニメーション関連の状態とメソッド
 */
export function useAnimation() {
    // アニメーション用の状態
    const playerAnimation: Ref<string> = ref('');
    const enemyAnimation: Ref<string> = ref('');

    /**
     * アニメーションを再生
     * @param {string} target - 'player' または 'enemy'
     * @param {string} animationClass - アニメーションのクラス名
     * @param {number} duration - アニメーション継続時間（ミリ秒）
     */
    const playAnimation = (target: string, animationClass: string, duration: number = 500): void => {
        if (target === 'player') {
            playerAnimation.value = animationClass;
            setTimeout(() => {
                playerAnimation.value = '';
            }, duration);
        } else if (target === 'enemy') {
            enemyAnimation.value = animationClass;
            setTimeout(() => {
                enemyAnimation.value = '';
            }, duration);
        }
    };

    /**
     * 攻撃アニメーションシーケンス
     * @param {boolean} enemyHit - 敵がダメージを受けたか
     * @param {boolean} playerHit - プレイヤーが反撃を受けたか
     */
    const playAttackSequence = (enemyHit: boolean, playerHit: boolean): void => {
        playAnimation('player', 'attacking');

        if (enemyHit) {
            setTimeout(() => {
                playAnimation('enemy', 'hit');
            }, 200);
        }

        if (playerHit) {
            setTimeout(() => {
                playAnimation('player', 'hit');
            }, 600);
        }
    };

    /**
     * 回復アニメーションシーケンス
     */
    const playHealSequence = (): void => {
        playAnimation('player', 'healed');

        // 敵の反撃
        setTimeout(() => {
            playAnimation('player', 'hit');
        }, 600);
    };

    /**
     * 防御アニメーションシーケンス
     */
    const playDefendSequence = (): void => {
        playAnimation('player', 'defending');

        // 敵の攻撃（軽減されたダメージ）
        setTimeout(() => {
            playAnimation('player', 'hit');
        }, 600);
    };

    /**
     * 逃走アニメーションシーケンス
     * @param {boolean} success - 逃走成功したか
     */
    const playEscapeSequence = (success: boolean): void => {
        if (success) {
            playAnimation('player', 'escaping');
        } else {
            // 逃走失敗、敵の攻撃を受ける
            setTimeout(() => {
                playAnimation('player', 'hit');
            }, 600);
        }
    };

    /**
     * 戦闘開始アニメーション
     */
    const playBattleStartAnimation = (): void => {
        setTimeout(() => {
            playAnimation('enemy', 'appear');
        }, 100);
    };

    /**
     * 勝利アニメーション
     */
    const playVictoryAnimation = (): void => {
        setTimeout(() => {
            playAnimation('player', 'victory');
        }, 500);
    };

    /**
     * 敗北アニメーション
     */
    const playDefeatAnimation = (): void => {
        setTimeout(() => {
            playAnimation('player', 'defeat');
        }, 500);
    };

    return {
        playerAnimation,
        enemyAnimation,
        playAnimation,
        playAttackSequence,
        playHealSequence,
        playDefendSequence,
        playEscapeSequence,
        playBattleStartAnimation,
        playVictoryAnimation,
        playDefeatAnimation
    };
}
