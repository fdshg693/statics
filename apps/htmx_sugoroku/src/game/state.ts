import type { components } from '../generated/api-types';

type GameStartResponse = components['schemas']['GameStartResponse'];
type RollDiceResponse = components['schemas']['RollDiceResponse'];

export interface GameState {
  gameId: string | null;
  position: number;
  boardSize: number;
  isFinished: boolean;
}

export function createInitialState(): GameState {
  return {
    gameId: null,
    position: 0,
    boardSize: 30,
    isFinished: false,
  };
}

export function applyStartResponse(data: GameStartResponse): GameState {
  return {
    gameId: data.game_id,
    position: data.position,
    boardSize: data.board_size,
    isFinished: false,
  };
}

export function applyRollResponse(state: GameState, data: RollDiceResponse): GameState {
  return {
    ...state,
    position: data.new_position,
    isFinished: data.is_finished,
  };
}
