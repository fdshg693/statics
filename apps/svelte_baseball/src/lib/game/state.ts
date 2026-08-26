import type { Bases, Count, GameState } from '../types/game';

export const createEmptyCount = (): Count => ({
  balls: 0,
  strikes: 0,
});

export const createEmptyBases = (): Bases => ({
  first: false,
  second: false,
  third: false,
});

export const createInitialGameState = (): GameState => ({
  count: createEmptyCount(),
  outs: 0,
  score: 0,
  bases: createEmptyBases(),
  batterNumber: 1,
  pitchNumber: 0,
  lastPitchZone: null,
  lastPitchResult: null,
  isInningOver: false,
});
