/**
 * BattleScriptExecutor
 * スクリプトを安全に実行するエンジン
 */

import { Game } from '../game.js';
import { createBattleSnapshot } from './ReadonlyStateWrapper.js';
import {
    BattleScriptContext,
    ActionCommand,
    ScriptExecutionResult,
    ScriptExecutionLimits,
    DEFAULT_SCRIPT_LIMITS,
    ReadonlyPlayerState,
    ReadonlyEnemyState,
    ReadonlyBattleState
} from './BattleScriptTypes.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('BattleScriptExecutor');

/**
 * スクリプト実行コンテキストの実装
 */
class BattleScriptContextImpl implements BattleScriptContext {
    private _command: ActionCommand | null = null;
    private _logs: string[] = [];
    private _commandIssued: boolean = false;

    readonly player: ReadonlyPlayerState;
    readonly enemy: ReadonlyEnemyState;
    readonly battleState: ReadonlyBattleState;

    constructor(
        player: ReadonlyPlayerState,
        enemy: ReadonlyEnemyState,
        battleState: ReadonlyBattleState
    ) {
        this.player = player;
        this.enemy = enemy;
        this.battleState = battleState;
    }

    log(message: string): void {
        this._logs.push(String(message));
    }

    attack(): void {
        this._issueCommand({ type: 'attack' });
    }

    heal(): void {
        this._issueCommand({ type: 'heal' });
    }

    defend(): void {
        this._issueCommand({ type: 'defend' });
    }

    flee(): void {
        this._issueCommand({ type: 'flee' });
    }

    useItem(itemId: string): void {
        this._issueCommand({ type: 'useItem', itemId: String(itemId) });
    }

    private _issueCommand(command: ActionCommand): void {
        // 1ターンに1コマンドのみ有効（最初のコマンドを採用）
        if (!this._commandIssued) {
            this._command = command;
            this._commandIssued = true;
            log.debug('Command issued', { command });
        } else {
            log.debug('Command ignored (already issued)', { command });
        }
    }

    getCommand(): ActionCommand | null {
        return this._command;
    }

    getLogs(): string[] {
        return [...this._logs];
    }
}

/**
 * スクリプト実行エンジン
 */
export class BattleScriptExecutor {
    private readonly limits: ScriptExecutionLimits;

    constructor(limits: ScriptExecutionLimits = DEFAULT_SCRIPT_LIMITS) {
        this.limits = limits;
    }

    /**
     * スクリプトを実行
     * @param scriptCode - 実行するスクリプトコード
     * @param game - ゲームインスタンス
     * @returns 実行結果
     */
    execute(scriptCode: string, game: Game): ScriptExecutionResult {
        const startTime = performance.now();

        log.group('Script execution started', {
            codeLength: scriptCode.length,
            limits: this.limits
        });

        try {
            // スナップショットを作成
            const snapshot = createBattleSnapshot(game);

            if (!snapshot.enemy) {
                log.groupEnd();
                return {
                    success: false,
                    command: null,
                    error: 'No enemy in battle',
                    logs: [],
                    executionTimeMs: performance.now() - startTime
                };
            }

            // コンテキストを作成
            const context = new BattleScriptContextImpl(
                snapshot.player,
                snapshot.enemy,
                snapshot.battleState
            );

            // サンドボックス環境でスクリプトを実行
            this._executeInSandbox(scriptCode, context);

            const executionTimeMs = performance.now() - startTime;

            log.debug('Script execution completed', {
                command: context.getCommand(),
                logs: context.getLogs(),
                executionTimeMs
            });
            log.groupEnd();

            return {
                success: true,
                command: context.getCommand(),
                logs: context.getLogs(),
                executionTimeMs
            };

        } catch (error) {
            const executionTimeMs = performance.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            log.error('Script execution failed', { error: errorMessage, executionTimeMs });
            log.groupEnd();

            return {
                success: false,
                command: null,
                error: errorMessage,
                logs: [],
                executionTimeMs
            };
        }
    }

    /**
     * サンドボックス環境でスクリプトを実行
     * 危険なAPIへのアクセスを制限
     */
    private _executeInSandbox(
        scriptCode: string,
        context: BattleScriptContextImpl
    ): void {
        // 危険なキーワードの簡易ブロック（厳密なパーサではないが誤用を防ぐ）
        if (/\beval\b|\bFunction\b/.test(scriptCode)) {
            throw new Error('Forbidden keyword detected in script');
        }

        // コンテキストから公開する変数/関数を取得
        const sandboxGlobals = {
            // 読み取り専用状態
            player: context.player,
            enemy: context.enemy,
            battleState: context.battleState,

            // 行動コマンド
            attack: () => context.attack(),
            heal: () => context.heal(),
            defend: () => context.defend(),
            flee: () => context.flee(),
            useItem: (itemId: string) => context.useItem(itemId),

            // ユーティリティ
            log: (msg: string) => context.log(msg),

            // 安全なグローバル
            Math: Math,
            console: {
                log: (msg: any) => context.log(String(msg))
            },

            // 危険なグローバルを無効化
            window: undefined,
            document: undefined,
            fetch: undefined,
            XMLHttpRequest: undefined,
            localStorage: undefined,
            sessionStorage: undefined,
            setTimeout: undefined,
            setInterval: undefined,
            importScripts: undefined
        };

        // 引数名と値を分離
        const argNames = Object.keys(sandboxGlobals);
        const argValues = Object.values(sandboxGlobals);

        // Functionコンストラクタでスクリプトを実行
        // 'use strict' でより安全な実行環境を作成
        const wrappedCode = `
            "use strict";
            ${scriptCode}
        `;

        try {
            // スクリプトを関数化して実行
            const scriptFunction = new Function(...argNames, wrappedCode);
            scriptFunction(...argValues);
        } catch (e) {
            throw e;
        }
    }

    /**
     * スクリプトの構文チェック（実行せずに検証）
     */
    validateSyntax(scriptCode: string): { valid: boolean; error?: string } {
        try {
            // 構文チェックのみ（実行はしない）
            new Function(scriptCode);
            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

// デフォルトエクスポート
export const defaultExecutor = new BattleScriptExecutor();
