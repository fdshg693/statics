/**
 * Logger Utility
 * 詳細ログ出力のための軽量ロガー
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: 100
};

function normalizeLevel(value: string | null | undefined): LogLevel | null {
    if (!value) return null;
    const lowered = value.trim().toLowerCase();
    if (lowered === 'debug' || lowered === 'info' || lowered === 'warn' || lowered === 'error' || lowered === 'silent') {
        return lowered;
    }
    if (lowered === '1' || lowered === 'true') {
        return 'debug';
    }
    if (lowered === '0' || lowered === 'false') {
        return 'silent';
    }
    return null;
}

function getLevelFromQuery(): LogLevel | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return (
        normalizeLevel(params.get('debug')) ||
        normalizeLevel(params.get('log')) ||
        normalizeLevel(params.get('logLevel'))
    );
}

function getLevelFromStorage(): LogLevel | null {
    if (typeof window === 'undefined') return null;
    return (
        normalizeLevel(window.localStorage.getItem('rpg_debug_level')) ||
        normalizeLevel(window.localStorage.getItem('rpg_debug')) ||
        normalizeLevel(window.localStorage.getItem('RPG_DEBUG_LEVEL'))
    );
}

function getDefaultLevel(): LogLevel {
    return 'debug';
}

function getLogLevel(): LogLevel {
    return getLevelFromQuery() || getLevelFromStorage() || getDefaultLevel();
}

function shouldLog(level: LogLevel): boolean {
    const currentLevel = getLogLevel();
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

function formatPrefix(scope: string): string {
    const time = new Date().toISOString();
    return `${time} [RPG][${scope}]`;
}

export interface Logger {
    debug: (message: string, data?: unknown) => void;
    info: (message: string, data?: unknown) => void;
    warn: (message: string, data?: unknown) => void;
    error: (message: string, data?: unknown) => void;
    group: (title: string, data?: unknown) => void;
    groupEnd: () => void;
}

export function createLogger(scope: string): Logger {
    return {
        debug: (message: string, data?: unknown) => {
            if (!shouldLog('debug')) return;
            if (data !== undefined) {
                console.debug(formatPrefix(scope), message, data);
            } else {
                console.debug(formatPrefix(scope), message);
            }
        },
        info: (message: string, data?: unknown) => {
            if (!shouldLog('info')) return;
            if (data !== undefined) {
                console.info(formatPrefix(scope), message, data);
            } else {
                console.info(formatPrefix(scope), message);
            }
        },
        warn: (message: string, data?: unknown) => {
            if (!shouldLog('warn')) return;
            if (data !== undefined) {
                console.warn(formatPrefix(scope), message, data);
            } else {
                console.warn(formatPrefix(scope), message);
            }
        },
        error: (message: string, data?: unknown) => {
            if (!shouldLog('error')) return;
            if (data !== undefined) {
                console.error(formatPrefix(scope), message, data);
            } else {
                console.error(formatPrefix(scope), message);
            }
        },
        group: (title: string, data?: unknown) => {
            if (!shouldLog('debug')) return;
            const label = `${formatPrefix(scope)} ${title}`;
            if (data !== undefined) {
                console.groupCollapsed(label, data);
            } else {
                console.groupCollapsed(label);
            }
        },
        groupEnd: () => {
            if (!shouldLog('debug')) return;
            console.groupEnd();
        }
    };
}
