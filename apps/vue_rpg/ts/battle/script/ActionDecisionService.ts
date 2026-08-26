/**
 * ActionDecisionService
 * 行動決定を一元管理するサービス
 * スクリプト経由とUI経由の行動決定を統一的に扱う
 */

import { Game } from '../game.js';
import { BattleScriptExecutor, defaultExecutor } from './BattleScriptExecutor.js';
import { ActionCommand } from './BattleScriptTypes.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('ActionDecisionService');

/**
 * 行動決定の入力ソース
 */
export type ActionSource = 'ui' | 'script';

/**
 * 行動決定の結果
 */
export interface ActionDecisionResult {
    /** 決定された行動コマンド */
    command: ActionCommand | null;
    /** 入力ソース */
    source: ActionSource;
    /** 成功したか */
    success: boolean;
    /** エラーメッセージ（失敗時） */
    error?: string;
    /** スクリプト実行ログ */
    scriptLogs?: string[];
}

/**
 * 行動決定サービス
 */
export class ActionDecisionService {
    private _scriptCode: string | null = null;
    private _scriptEnabled: boolean = false;
    private readonly _executor: BattleScriptExecutor;

    constructor(executor: BattleScriptExecutor = defaultExecutor) {
        this._executor = executor;
    }

    /**
     * スクリプトを設定
     */
    setScript(code: string | null): void {
        if (code === null || code.trim() === '') {
            this._scriptCode = null;
            this._scriptEnabled = false;
            log.info('Script cleared');
        } else {
            // 構文チェック
            const validation = this._executor.validateSyntax(code);
            if (!validation.valid) {
                log.warn('Invalid script syntax', { error: validation.error });
                throw new Error(`スクリプト構文エラー: ${validation.error}`);
            }
            this._scriptCode = code;
            this._scriptEnabled = true;
            log.info('Script set', { codeLength: code.length });
        }
    }

    /**
     * スクリプト実行を有効/無効にする
     */
    setScriptEnabled(enabled: boolean): void {
        this._scriptEnabled = enabled && this._scriptCode !== null;
        log.info('Script enabled state changed', { enabled: this._scriptEnabled });
    }

    /**
     * スクリプトが有効か
     */
    isScriptEnabled(): boolean {
        return this._scriptEnabled && this._scriptCode !== null;
    }

    /**
     * 現在のスクリプトコードを取得
     */
    getScriptCode(): string | null {
        return this._scriptCode;
    }

    /**
     * 行動を決定（スクリプト優先、フォールバックでUI待機）
     * @param game - ゲームインスタンス
     * @returns 行動決定結果（nullの場合はUI入力待機）
     */
    decideAction(game: Game): ActionDecisionResult | null {
        // 戦闘中でなければ行動決定しない
        if (game.battleState !== 'fighting') {
            log.debug('Not in fighting state, skip action decision');
            return null;
        }

        // スクリプトが無効の場合はUI入力待機
        if (!this.isScriptEnabled()) {
            log.debug('Script not enabled, waiting for UI input');
            return null;
        }

        // スクリプトを実行
        log.debug('Executing script for action decision');
        const result = this._executor.execute(this._scriptCode!, game);

        if (!result.success) {
            log.warn('Script execution failed, falling back to UI', {
                error: result.error
            });
            return {
                command: null,
                source: 'script',
                success: false,
                error: result.error,
                scriptLogs: result.logs
            };
        }

        if (result.command === null) {
            log.debug('Script did not issue command, falling back to UI');
            return {
                command: null,
                source: 'script',
                success: true,
                scriptLogs: result.logs
            };
        }

        log.info('Action decided by script', {
            command: result.command,
            logs: result.logs
        });

        return {
            command: result.command,
            source: 'script',
            success: true,
            scriptLogs: result.logs
        };
    }

    /**
     * UI経由の行動を作成
     */
    createUIAction(command: ActionCommand): ActionDecisionResult {
        log.debug('Action created from UI', { command });
        return {
            command,
            source: 'ui',
            success: true
        };
    }
}

// シングルトンインスタンス
let _instance: ActionDecisionService | null = null;

export function getActionDecisionService(): ActionDecisionService {
    if (_instance === null) {
        _instance = new ActionDecisionService();
    }
    return _instance;
}

export function resetActionDecisionService(): void {
    _instance = null;
}
