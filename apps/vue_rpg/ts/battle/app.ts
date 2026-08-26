/**
 * RPG Game Vue Application
 * Vue 3 Composition APIを使用したUIの実装
 * 
 * 構造:
 * - types.ts: Player/Enemy型の定義
 * - composables/useBattle.ts: バトルロジックとゲーム状態管理
 * - composables/useAnimation.ts: アニメーション管理
 * - utils/message.ts: メッセージ処理ユーティリティ
 */

import { createApp, ref, computed, watch, onMounted, Ref, ComputedRef } from 'vue';
import { useBattle } from './composables/useBattle.js';
import { useAnimation } from './composables/useAnimation.js';
import { ItemRarity } from './entities/Item.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('BattleUI');

// Vueアプリケーションを作成
createApp({
    setup() {
        // ゲームタイトル
        const gameTitle: Ref<string> = ref('RPG Battle Game');

        // インベントリモーダルの表示状態
        const showInventory: Ref<boolean> = ref(false);
        const inventoryTab: Ref<string> = ref('all'); // 'all', 'weapons', 'potions'

        // バトルロジックとゲーム状態（Composable）
        const {
            player,
            enemy,
            messages,
            battleState,
            floor,
            battlesOnCurrentFloor,
            battlesPerFloor,
            playerHpPercentage,
            enemyHpPercentage,
            playerExpPercentage,
            playerMpPercentage,
            canAct,
            canAttack,
            canHeal,
            canDefend,
            canEscape,
            canUsePotion,
            canStartNewBattle,
            attackEnemy,
            playerHeal,
            playerDefend,
            flee,
            usePotion: usePotionFromInventory,
            startNewBattle,
            initialize,
            saveSnapshot,
            scriptEnabled,
            scriptCode,
            scriptLogs,
            lastScriptError,
            setScript,
            setScriptEnabled,
            tryExecuteScript,
            clearScriptLogs
        } = useBattle();

        // アニメーション管理（Composable）
        const {
            playerAnimation,
            enemyAnimation,
            playAttackSequence,
            playHealSequence,
            playDefendSequence,
            playEscapeSequence,
            playBattleStartAnimation,
            playVictoryAnimation,
            playDefeatAnimation
        } = useAnimation();

        /**
         * 攻撃ボタンのハンドラー
         */
        const attack = (): void => {
            const { enemyHit, playerHit } = attackEnemy();
            playAttackSequence(enemyHit, playerHit);
            log.debug('Attack action', { enemyHit, playerHit });
        };

        /**
         * 回復ボタンのハンドラー
         */
        const heal = (): void => {
            playerHeal();
            playHealSequence();
            log.debug('Heal action');
        };

        /**
         * 防御ボタンのハンドラー
         */
        const defend = (): void => {
            playerDefend();
            playDefendSequence();
            log.debug('Defend action');
        };

        /**
         * 逃げるボタンのハンドラー
         */
        const escape = (): void => {
            const success = flee();
            playEscapeSequence(success);
            log.debug('Escape action', { success });
        };

        /**
         * ポーション使用
         */
        const usePotion = (itemId: string): void => {
            const used = usePotionFromInventory(itemId);
            if (used) {
                playHealSequence();
            }
            log.debug('Potion used from inventory', { itemId, used });
        };

        /**
         * 新しい戦闘を開始
         */
        const onStartNewBattle = (): void => {
            startNewBattle();
            playBattleStartAnimation();
            log.debug('Start new battle action');
        };

        /**
         * 記録してスタート画面へ戻る
         */
        const saveAndReturnToStart = (): void => {
            saveSnapshot();
            window.location.href = '../index.html';
        };

        /**
         * 初期化（onMounted）
         */
        onMounted(() => {
            initialize();
            log.info('Battle UI mounted');
        });

        /**
         * 戦闘状態の変化を監視
         */
        watch(battleState, (newState: string) => {
            log.debug('Battle state changed', { newState });
            if (newState === 'victory') {
                playVictoryAnimation();
            } else if (newState === 'defeat') {
                playDefeatAnimation();
                
                // 死亡時は少し待ってからアラートを表示
                setTimeout(() => {
                    alert('あなたは倒れてしまいました...\n\nスタート画面に戻ります。');
                    window.location.href = '../index.html';
                }, 2000);
            }
        });

        /**
         * インベントリ関連のComputed
         */
        const inventoryItems: ComputedRef<any[]> = computed(() => {
            const items = player.inventory?.items || [];
            log.debug('Inventory items computed', { count: items.length, items });
            return items;
        });

        const weaponItems: ComputedRef<any[]> = computed(() => {
            return inventoryItems.value.filter(item => item.type === 'weapon');
        });

        const potionItems: ComputedRef<any[]> = computed(() => {
            return inventoryItems.value.filter(item => item.type === 'potion');
        });

        const gold: ComputedRef<number> = computed(() => {
            const goldValue = player.inventory?.gold || 0;
            log.debug('Gold computed', { gold: goldValue });
            return goldValue;
        });

        const inventoryCount: ComputedRef<number> = computed(() => {
            return inventoryItems.value.length;
        });

        const currentTabItems: ComputedRef<any[]> = computed(() => {
            switch (inventoryTab.value) {
                case 'weapons':
                    return weaponItems.value;
                case 'potions':
                    return potionItems.value;
                case 'all':
                default:
                    return inventoryItems.value;
            }
        });

        // ========================================
        // プログラマブルアクション UI
        // ========================================

        const scriptEditor: Ref<string> = ref('');

        const scriptEnabledProxy = computed<boolean>({
            get: () => scriptEnabled.value,
            set: (value: boolean) => {
                setScriptEnabled(value);
            }
        });

        const canRunScript: ComputedRef<boolean> = computed(() => {
            return battleState.value === 'fighting' && scriptEnabledProxy.value;
        });

        const applyScript = (): void => {
            try {
                setScript(scriptEditor.value);
                if (scriptEnabledProxy.value) {
                    setScriptEnabled(true);
                }
            } catch (error) {
                // useBattle 内でエラーを保持するためここでは握りつぶす
            }
        };

        const runScriptOnce = (): void => {
            const executed = tryExecuteScript();
            log.debug('Script executed', { executed });
        };

        // エディタとスクリプト状態を同期
        watch(scriptCode, (newCode: string) => {
            if (scriptEditor.value !== newCode) {
                scriptEditor.value = newCode || '';
            }
        }, { immediate: true });

        /**
         * インベントリを開く
         */
        const openInventory = (): void => {
            showInventory.value = true;
        };

        /**
         * インベントリを閉じる
         */
        const closeInventory = (): void => {
            showInventory.value = false;
        };

        /**
         * アイテムアイコンを取得
         */
        const getItemIcon = (type: string): string => {
            switch (type) {
                case 'weapon':
                    return '⚔️';
                case 'potion':
                    return '🧪';
                default:
                    return '📦';
            }
        };

        /**
         * レアリティバッジを取得
         */
        const getRarityBadge = (rarity: ItemRarity): string => {
            switch (rarity) {
                case 'legendary':
                    return '伝説';
                case 'epic':
                    return '史詩';
                case 'rare':
                    return 'レア';
                case 'uncommon':
                    return '上級';
                case 'common':
                default:
                    return '通常';
            }
        };

        // テンプレートで使用する値を返す
        return {
            // データ
            gameTitle,
            player,
            enemy,
            messages,
            battleState,
            playerAnimation,
            enemyAnimation,
            floor,
            battlesOnCurrentFloor,
            battlesPerFloor,

            // Computed
            playerHpPercentage,
            enemyHpPercentage,
            playerExpPercentage,
            playerMpPercentage,
            canAct,
            canAttack,
            canHeal,
            canDefend,
            canEscape,
            canUsePotion,
            canStartNewBattle,

            // インベントリ
            showInventory,
            inventoryTab,
            inventoryItems,
            weaponItems,
            potionItems,
            gold,
            inventoryCount,
            currentTabItems,

            // メソッド
            attack,
            heal,
            defend,
            escape,
            startNewBattle: onStartNewBattle,
            saveAndReturnToStart,
            usePotion,
            openInventory,
            closeInventory,
            getItemIcon,
            getRarityBadge,

            // スクリプトUI
            scriptEditor,
            scriptEnabledProxy,
            scriptLogs,
            lastScriptError,
            canRunScript,
            applyScript,
            runScriptOnce,
            clearScriptLogs
        };
    }
}).mount('#app');
