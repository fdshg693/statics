/**
 * セーブ/ロード Composable
 * ゲームの永続化ロジックを担当
 *
 * 責務:
 * - ゲーム状態のローカルストレージへの保存
 * - ゲーム状態のローカルストレージからの読み込み
 * - 自動保存のセットアップ
 */

import { watch, WatchSource } from 'vue';
import { Game } from '../game.js';
import { loadActiveState, saveState } from '../../save/saveRepository.js';
import { applyGameState } from '../save/gameStateAdapter.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('useSaveGame');

export interface SaveGameOptions {
    createNew?: boolean;
}

/**
 * セーブ/ロード管理のためのComposable
 * @param game - Gameインスタンス
 * @param onLoadSuccess - ロード成功時のコールバック
 */
export function useSaveGame(game: Game, onLoadSuccess?: () => void) {
    /**
     * ゲームデータをローカルストレージに保存
     */
    const saveGame = (options?: SaveGameOptions): void => {
        if (game.player.hp <= 0 || game.battleState === 'defeat') {
            log.debug('Skip save (defeated)', {
                hp: game.player.hp,
                battleState: game.battleState
            });
            return;
        }

        try {
            const state = game.getState();
            const saveId = saveState(state, options);
            log.info('Game saved', {
                saveId,
                createNew: !!options?.createNew,
                label: state?.player?.level ? `レベル${state.player.level}` : undefined,
                floor: state.floor
            });
        } catch (e) {
            log.error('Save failed', e);
        }
    };

    /**
     * ゲームデータをローカルストレージから読み込み
     * @returns ロード成功したかどうか
     */
    const loadGame = (): boolean => {
        try {
            const state = loadActiveState();
            if (state) {
                applyGameState(game, state);
                onLoadSuccess?.();
                log.info('Game loaded', {
                    label: state?.player?.level ? `レベル${state.player.level}` : undefined,
                    floor: state.floor
                });
                return true;
            }
        } catch (e) {
            log.error('Load failed', e);
        }
        log.debug('No active save found');
        return false;
    };

    /**
     * スナップショットを保存（新規セーブを作成）
     */
    const saveSnapshot = (): void => {
        log.info('Snapshot save requested');
        saveGame({ createNew: true });
    };

    /**
     * 自動保存を設定
     * @param watchSources - 監視対象のリアクティブソース
     */
    const setupAutoSave = (watchSources: WatchSource[]): void => {
        for (const source of watchSources) {
            watch(source, () => {
                log.debug('Auto-save triggered');
                saveGame();
            });
        }
    };

    return {
        saveGame,
        loadGame,
        saveSnapshot,
        setupAutoSave
    };
}
