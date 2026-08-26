/**
 * バトルComposable
 * ゲームロジックとVueの状態管理を統合
 *
 * 責務:
 * - Vue状態管理（player, enemy, messages, battleState）
 * - ゲームアクションのオーケストレーション
 * - UI用の算出プロパティ（HPパーセンテージ等）
 * - プログラマブルアクション（スクリプト）の統合
 *
 * 永続化は useSaveGame に委譲
 */

import { ref, reactive, computed, Ref, ComputedRef } from 'vue';
import { Game } from '../game.js';
import { formatBattleLog, FormattedMessage } from '../utils/message.js';
import { FloorConstants, PlayerActionConstants } from '../GameConstants.js';
import { useSaveGame } from './useSaveGame.js';
import { createLogger } from '../../utils/logger.js';
import {
    getActionDecisionService,
    ActionCommand
} from '../script/index.js';

const log = createLogger('useBattle');

export interface AttackEnemyResult {
    enemyHit: boolean;
    playerHit: boolean;
}

/**
 * メッセージリストを自動スクロール（UIの責務としてここで定義）
 */
function scrollToLatestMessage(): void {
    setTimeout(() => {
        const messageList = document.querySelector('.message-list');
        if (messageList) {
            messageList.scrollTop = messageList.scrollHeight;
        }
    }, 50);
}

/**
 * バトル管理のためのComposable
 * @returns {Object} バトル関連の状態とメソッド
 */
export function useBattle() {
    // ゲームインスタンス
    const game = new Game();

    // 行動決定サービス
    const actionDecisionService = getActionDecisionService();

    // プレイヤー状態（game.player を直接 reactive でラップ）
    const player = reactive(game.player);

    // 敵の状態
    const enemy: Ref<any> = ref(null);

    // バトルログ（メッセージリスト）
    const messages: Ref<FormattedMessage[]> = ref([]);

    // 戦闘状態
    const battleState: Ref<string> = ref('idle'); // idle, fighting, victory, defeat

    // 階層情報
    const floor: Ref<number> = ref(1);
    const battlesOnCurrentFloor: Ref<number> = ref(0);
    const battlesPerFloor: Ref<number> = ref(FloorConstants.BATTLES_PER_FLOOR);

    // スクリプト関連の状態
    const scriptEnabled: Ref<boolean> = ref(false);
    const scriptCode: Ref<string> = ref('');
    const scriptLogs: Ref<string[]> = ref([]);
    const lastScriptError: Ref<string | null> = ref(null);

    /**
     * game.jsから現在の状態を取得してVueの状態を更新
     * player は game.player への直接参照なので自動同期される
     */
    const updateGameState = (): void => {
        const state = game.getState();

        // 敵の状態更新
        enemy.value = state.enemy;

        // 戦闘状態の更新
        battleState.value = state.battleState;

        // 階層情報の更新
        floor.value = state.floor || 1;
        battlesOnCurrentFloor.value = state.battlesOnCurrentFloor || 0;
        battlesPerFloor.value = state.battlesPerFloor || FloorConstants.BATTLES_PER_FLOOR;

        // バトルログの更新
        messages.value = formatBattleLog(state.battleLog);

        log.debug('State synced to UI', {
            battleState: state.battleState,
            turnCount: state.turnCount,
            floor: state.floor,
            battlesOnCurrentFloor: state.battlesOnCurrentFloor,
            messages: state.battleLog.length
        });

        // メッセージリストを自動スクロール
        scrollToLatestMessage();
    };

    // セーブ/ロード機能を取得（永続化ロジックを委譲）
    const { loadGame, saveSnapshot, setupAutoSave } = useSaveGame(game, updateGameState);

    /**
     * プレイヤーのHPパーセンテージ（computed）
     */
    const playerHpPercentage: ComputedRef<number> = computed(() => {
        if (player.maxHp === 0) return 0;
        return Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    });

    /**
     * 敵のHPパーセンテージ（computed）
     */
    const enemyHpPercentage: ComputedRef<number> = computed(() => {
        if (!enemy.value || enemy.value.maxHp === 0) return 0;
        return Math.max(0, Math.min(100, (enemy.value.hp / enemy.value.maxHp) * 100));
    });

    /**
     * プレイヤーの経験値パーセンテージ（computed）
     */
    const playerExpPercentage: ComputedRef<number> = computed(() => {
        if (player.expToNextLevel === 0) return 0;
        return Math.max(0, Math.min(100, (player.exp / player.expToNextLevel) * 100));
    });

    /**
     * プレイヤーのMPパーセンテージ（computed）
     */
    const playerMpPercentage: ComputedRef<number> = computed(() => {
        if (player.maxMp === 0) return 0;
        return Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100));
    });

    /**
     * アクションボタンが有効かどうか（computed）
     */
    const canAct: ComputedRef<boolean> = computed(() => {
        return battleState.value === 'fighting' && enemy.value !== null;
    });

    /**
     * MP条件を含むアクション可否（computed）
     */
    const canAttack: ComputedRef<boolean> = computed(() => {
        return canAct.value && player.mp >= PlayerActionConstants.ATTACK_MP_COST;
    });

    const canHeal: ComputedRef<boolean> = computed(() => {
        return canAct.value && player.mp >= PlayerActionConstants.HEAL_MP_COST;
    });

    const canDefend: ComputedRef<boolean> = computed(() => {
        return canAct.value && player.mp >= PlayerActionConstants.DEFEND_MP_COST;
    });

    const canEscape: ComputedRef<boolean> = computed(() => {
        return canAct.value && player.mp >= PlayerActionConstants.ESCAPE_MP_COST;
    });

    /**
     * ポーション使用可否（computed）
     */
    const canUsePotion: ComputedRef<boolean> = computed(() => {
        if (battleState.value === 'fighting') {
            return canAct.value;
        }
        return true;
    });

    /**
     * 新しい戦闘を開始できるかどうか（computed）
     */
    const canStartNewBattle: ComputedRef<boolean> = computed(() => {
        return battleState.value !== 'fighting';
    });

    /**
     * 攻撃ボタンのハンドラー
     * @returns {Object} アニメーション用の情報
     */
    const attackEnemy = (): AttackEnemyResult => {
        if (!canAttack.value) return { enemyHit: false, playerHit: false };

        const enemyHpBefore = enemy.value ? enemy.value.hp : 0;
        const playerHpBefore = player.hp;

        game.attackEnemy();
        updateGameState();

        const enemyHit = enemy.value && enemy.value.hp < enemyHpBefore;
        const playerHit = player.hp < playerHpBefore;

        return { enemyHit, playerHit };
    };

    /**
     * 回復ボタンのハンドラー
     */
    const playerHeal = (): void => {
        if (!canHeal.value) return;

        game.playerHeal();
        updateGameState();
    };

    /**
     * 防御ボタンのハンドラー
     */
    const playerDefend = (): void => {
        if (!canDefend.value) return;

        game.playerDefend();
        updateGameState();
    };

    /**
     * 逃げるボタンのハンドラー
     * @returns {boolean} 逃走成功したか
     */
    const flee = (): boolean => {
        if (!canEscape.value) return false;

        const beforeState = battleState.value;
        game.flee();
        updateGameState();

        return battleState.value === 'idle' && beforeState === 'fighting';
    };

    /**
     * ポーション使用
     * @param {string} itemId - 使用するポーションのID
     * @returns {boolean} 使用できたかどうか
     */
    const usePotion = (itemId: string): boolean => {
        if (battleState.value === 'fighting' && !canAct.value) return false;

        const used = game.usePotion(itemId);
        updateGameState();
        return used;
    };

    /**
     * 新しい戦闘を開始
     */
    const startNewBattle = (): void => {
        game.startNewBattle();
        updateGameState();

        // スクリプトが有効な場合、ターン開始時に自動実行を試みる
        if (scriptEnabled.value) {
            tryExecuteScript();
        }
    };

    // ========================================
    // スクリプト関連メソッド
    // ========================================

    /**
     * スクリプトを設定
     * @param code - スクリプトコード
     */
    const setScript = (code: string): void => {
        try {
            actionDecisionService.setScript(code);
            scriptCode.value = code;
            lastScriptError.value = null;
            log.info('Script set successfully', { codeLength: code.length });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            lastScriptError.value = errorMessage;
            log.error('Failed to set script', { error: errorMessage });
            throw error;
        }
    };

    /**
     * スクリプト実行を有効/無効にする
     */
    const setScriptEnabled = (enabled: boolean): void => {
        actionDecisionService.setScriptEnabled(enabled);
        scriptEnabled.value = actionDecisionService.isScriptEnabled();
        log.info('Script enabled state changed', { enabled: scriptEnabled.value });
    };

    /**
     * スクリプトによる行動を試みる
     * @returns 行動が実行されたかどうか
     */
    const tryExecuteScript = (): boolean => {
        if (!scriptEnabled.value || battleState.value !== 'fighting') {
            return false;
        }

        const result = actionDecisionService.decideAction(game);

        if (!result) {
            // スクリプト無効またはUI入力待機
            return false;
        }

        // スクリプトログを保存
        if (result.scriptLogs) {
            scriptLogs.value = result.scriptLogs;
        }

        if (!result.success) {
            // スクリプトエラー（フォールバックでUI待機）
            lastScriptError.value = result.error || 'Unknown error';
            log.warn('Script execution failed', { error: result.error });
            return false;
        }

        if (!result.command) {
            // コマンドなし（UI待機）
            return false;
        }

        // コマンドを実行
        log.info('Executing script command', { command: result.command });
        return executeCommand(result.command);
    };

    /**
     * ActionCommandを実行
     */
    const executeCommand = (command: ActionCommand): boolean => {
        switch (command.type) {
            case 'attack':
                if (canAttack.value) {
                    attackEnemy();
                    return true;
                }
                break;
            case 'heal':
                if (canHeal.value) {
                    playerHeal();
                    return true;
                }
                break;
            case 'defend':
                if (canDefend.value) {
                    playerDefend();
                    return true;
                }
                break;
            case 'flee':
                if (canEscape.value) {
                    flee();
                    return true;
                }
                break;
            case 'useItem':
                if (canUsePotion.value) {
                    return usePotion(command.itemId);
                }
                break;
        }
        log.debug('Command not executable', { command });
        return false;
    };

    /**
     * スクリプトログをクリア
     */
    const clearScriptLogs = (): void => {
        scriptLogs.value = [];
    };

    /**
     * 初期化処理
     */
    const initialize = (): void => {
        // セーブデータを読み込み
        const loaded = loadGame();

        log.info('Initialize battle', { loaded });

        if (!loaded) {
            updateGameState();

            // 初回メッセージ
            if (messages.value.length === 0) {
                messages.value.push({
                    text: 'RPG Battle Gameへようこそ！',
                    type: 'info',
                    id: 'welcome'
                });
                messages.value.push({
                    text: '「新しい戦闘」ボタンをクリックして冒険を始めましょう！',
                    type: 'info',
                    id: 'start-guide'
                });
            }
        }

        // 自動保存を設定（プレイヤーHP変更時、戦闘状態変更時）
        setupAutoSave([() => player.hp, () => player.mp, battleState]);
    };

    return {
        // 状態
        player,
        enemy,
        messages,
        battleState,
        floor,
        battlesOnCurrentFloor,
        battlesPerFloor,

        // スクリプト状態
        scriptEnabled,
        scriptCode,
        scriptLogs,
        lastScriptError,

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

        // メソッド
        attackEnemy,
        playerHeal,
        playerDefend,
        flee,
        usePotion,
        startNewBattle,
        initialize,
        saveSnapshot,

        // スクリプトメソッド
        setScript,
        setScriptEnabled,
        tryExecuteScript,
        executeCommand,
        clearScriptLogs
    };
}
