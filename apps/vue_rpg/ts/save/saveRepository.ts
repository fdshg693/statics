/**
 * Save Repository
 * ローカルストレージを用いたセーブ履歴・アクティブスロット管理を担当
 */

import { createLogger } from '../utils/logger.js';

const log = createLogger('saveRepository');

export interface SaveEntry {
    id: string;
    label: string;
    createdAt: number;
    updatedAt: number;
    state: any;
}

const LEGACY_SAVE_KEY: string = 'rpg_battle_game_save';
const SAVE_LIST_KEY: string = 'rpg_battle_game_saves';
const ACTIVE_SAVE_ID_KEY: string = 'rpg_battle_game_active_save_id';

export function generateSaveId(): string {
    const randomPart = Math.random().toString(36).slice(2, 8);
    return `save_${Date.now().toString(36)}_${randomPart}`;
}

export function loadSaveList(): SaveEntry[] {
    try {
        const raw = localStorage.getItem(SAVE_LIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        log.warn('Failed to parse save list');
        return [];
    }
}

export function saveSaveList(list: SaveEntry[]): void {
    localStorage.setItem(SAVE_LIST_KEY, JSON.stringify(list));
    log.debug('Save list updated', { count: list.length });
}

export function buildSaveLabel(state: any): string {
    const parts: string[] = [];
    if (state?.player?.level) {
        parts.push(`レベル${state.player.level}`);
    }
    if (state?.floor) {
        parts.push(`${state.floor}階`);
    }
    return parts.length > 0 ? parts.join(' / ') : '冒険の記録';
}

export function migrateLegacySave(): void {
    const legacy = localStorage.getItem(LEGACY_SAVE_KEY);
    if (!legacy) return;

    const list = loadSaveList();
    if (list.length > 0) {
        localStorage.removeItem(LEGACY_SAVE_KEY);
        log.info('Legacy save cleared (new format already exists)');
        return;
    }

    try {
        const state = JSON.parse(legacy);
        const now = Date.now();
        const id = generateSaveId();
        const entry: SaveEntry = {
            id,
            label: buildSaveLabel(state),
            createdAt: now,
            updatedAt: now,
            state
        };
        saveSaveList([entry]);
        localStorage.setItem(ACTIVE_SAVE_ID_KEY, id);
        localStorage.removeItem(LEGACY_SAVE_KEY);
        log.info('Legacy save migrated', { id, label: entry.label });
    } catch {
        // ignore legacy parse errors
        log.warn('Legacy save migration failed');
    }
}

export function getSortedSaves(): SaveEntry[] {
    migrateLegacySave();
    return loadSaveList().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
}

export function getActiveSaveId(): string | null {
    return localStorage.getItem(ACTIVE_SAVE_ID_KEY);
}

export function setActiveSaveId(id: string): void {
    localStorage.setItem(ACTIVE_SAVE_ID_KEY, id);
}

export function clearActiveSaveId(): void {
    localStorage.removeItem(ACTIVE_SAVE_ID_KEY);
}

export function saveState(state: any, options?: { createNew?: boolean }): string {
    migrateLegacySave();
    const now = Date.now();
    const list = loadSaveList();
    let activeId = getActiveSaveId();

    if (options?.createNew || !activeId) {
        activeId = generateSaveId();
        list.unshift({
            id: activeId,
            label: buildSaveLabel(state),
            createdAt: now,
            updatedAt: now,
            state
        });
    } else {
        const target = list.find(entry => entry.id === activeId);
        if (target) {
            target.state = state;
            target.updatedAt = now;
            target.label = buildSaveLabel(state);
        } else {
            list.unshift({
                id: activeId,
                label: buildSaveLabel(state),
                createdAt: now,
                updatedAt: now,
                state
            });
        }
    }

    saveSaveList(list);
    setActiveSaveId(activeId);
    log.info('Save state stored', {
        id: activeId,
        label: buildSaveLabel(state),
        createNew: !!options?.createNew,
        total: list.length
    });
    return activeId;
}

export function loadActiveState(): any | null {
    migrateLegacySave();
    const activeId = getActiveSaveId();
    if (!activeId) return null;

    const list = loadSaveList();
    const entry = list.find(item => item.id === activeId);
    log.debug('Active save loaded', { id: activeId, found: !!entry });
    return entry ? entry.state : null;
}

export function removeSave(id: string): void {
    const list = loadSaveList().filter(item => item.id !== id);
    saveSaveList(list);
    if (getActiveSaveId() === id) {
        clearActiveSaveId();
    }
    log.info('Save removed', { id, total: list.length });
}

export function clearAllSaves(): void {
    localStorage.removeItem(SAVE_LIST_KEY);
    localStorage.removeItem(ACTIVE_SAVE_ID_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
    log.info('All saves cleared');
}
