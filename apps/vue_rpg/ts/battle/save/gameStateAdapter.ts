/**
 * Game State Adapter
 * 永続化されたゲーム状態をGameへ適用する責務を担当
 */

import { Game, GameState } from '../game.js';
import { Inventory } from '../entities/Inventory.js';

export function applyGameState(game: Game, state: GameState): void {
    if (state.player) {
        Object.assign(game.player, {
            name: state.player.name,
            hp: state.player.hp,
            maxHp: state.player.maxHp,
            mp: state.player.mp ?? game.player.mp,
            maxMp: state.player.maxMp ?? game.player.maxMp,
            attack: state.player.attack,
            defense: state.player.defense,
            level: state.player.level,
            exp: state.player.exp,
            expToNextLevel: state.player.expToNextLevel
        });

        if (state.player.inventory) {
            game.player.inventory = Inventory.fromJSON(state.player.inventory);
        }
    }

    game.enemy = state.enemy || null;
    game.battleState = state.battleState || 'idle';
    game.battleLog = state.battleLog || [];
    game.isDefending = state.isDefending ?? false;
    game.turnCount = state.turnCount ?? 0;
    game.floor = state.floor || 1;
    game.battlesOnCurrentFloor = state.battlesOnCurrentFloor || 0;
    game.battlesPerFloor = state.battlesPerFloor || 3;
}
