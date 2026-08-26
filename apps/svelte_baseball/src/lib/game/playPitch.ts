import type {
  Bases,
  GameState,
  PitchResultCategory,
  PitchStepResult,
  PitchZoneId,
} from '../types/game';
import type { ResolvePitchResultOptions } from './resolvePitchResult';
import { resolvePitchResult } from './resolvePitchResult';
import { createEmptyBases, createEmptyCount } from './state';

const MAX_BALLS = 4;
const MAX_STRIKES = 3;
const MAX_OUTS = 3;

type BaseAdvanceResult = {
  bases: Bases;
  runsScored: number;
};

const cloneBases = (bases: Bases): Bases => ({
  first: bases.first,
  second: bases.second,
  third: bases.third,
});

const advanceOnWalk = (bases: Bases): BaseAdvanceResult => {
  if (!bases.first) {
    return {
      bases: {
        ...cloneBases(bases),
        first: true,
      },
      runsScored: 0,
    };
  }

  if (!bases.second) {
    return {
      bases: {
        first: true,
        second: true,
        third: bases.third,
      },
      runsScored: 0,
    };
  }

  if (!bases.third) {
    return {
      bases: {
        first: true,
        second: true,
        third: true,
      },
      runsScored: 0,
    };
  }

  return {
    bases: {
      first: true,
      second: true,
      third: true,
    },
    runsScored: 1,
  };
};

const advanceOnSingle = (bases: Bases): BaseAdvanceResult => ({
  bases: {
    first: true,
    second: bases.first,
    third: bases.second,
  },
  runsScored: bases.third ? 1 : 0,
});

const advanceOnDouble = (bases: Bases): BaseAdvanceResult => ({
  bases: {
    first: false,
    second: true,
    third: bases.first,
  },
  runsScored: Number(bases.second) + Number(bases.third),
});

const advanceOnTriple = (bases: Bases): BaseAdvanceResult => ({
  bases: {
    first: false,
    second: false,
    third: true,
  },
  runsScored: Number(bases.first) + Number(bases.second) + Number(bases.third),
});

const advanceOnHomeRun = (bases: Bases): BaseAdvanceResult => ({
  bases: createEmptyBases(),
  runsScored: 1 + Number(bases.first) + Number(bases.second) + Number(bases.third),
});

const completePlateAppearance = (
  state: GameState,
  nextBases: Bases,
  runsScored: number,
  outsRecorded: number,
): GameState => {
  const nextOuts = Math.min(MAX_OUTS, state.outs + outsRecorded);
  const inningEnded = nextOuts >= MAX_OUTS;

  return {
    ...state,
    count: createEmptyCount(),
    outs: nextOuts,
    score: state.score + runsScored,
    bases: nextBases,
    batterNumber: inningEnded ? state.batterNumber : state.batterNumber + 1,
    isInningOver: inningEnded,
  };
};

export const applyPitchResult = (
  state: GameState,
  zoneId: PitchZoneId,
  pitchResult: PitchResultCategory,
): PitchStepResult => {
  if (state.isInningOver) {
    throw new Error('Cannot apply a pitch result after the inning has ended.');
  }

  const pitchState: GameState = {
    ...state,
    count: { ...state.count },
    bases: cloneBases(state.bases),
    pitchNumber: state.pitchNumber + 1,
    lastPitchZone: zoneId,
    lastPitchResult: pitchResult,
  };

  switch (pitchResult) {
    case 'ball': {
      const nextBalls = state.count.balls + 1;

      if (nextBalls >= MAX_BALLS) {
        const walkResult = advanceOnWalk(state.bases);
        const nextState = completePlateAppearance(pitchState, walkResult.bases, walkResult.runsScored, 0);

        return {
          nextState,
          summary: {
            pitchResult,
            outcome: 'walk',
            runsScored: walkResult.runsScored,
            outsRecorded: 0,
            didPlateAppearanceEnd: true,
            inningEnded: nextState.isInningOver,
          },
        };
      }

      return {
        nextState: {
          ...pitchState,
          count: {
            balls: nextBalls,
            strikes: state.count.strikes,
          },
        },
        summary: {
          pitchResult,
          outcome: 'ball',
          runsScored: 0,
          outsRecorded: 0,
          didPlateAppearanceEnd: false,
          inningEnded: false,
        },
      };
    }

    case 'called-strike':
    case 'swinging-strike': {
      const nextStrikes = state.count.strikes + 1;

      if (nextStrikes >= MAX_STRIKES) {
        const nextState = completePlateAppearance(pitchState, state.bases, 0, 1);

        return {
          nextState,
          summary: {
            pitchResult,
            outcome: 'strikeout',
            runsScored: 0,
            outsRecorded: 1,
            didPlateAppearanceEnd: true,
            inningEnded: nextState.isInningOver,
          },
        };
      }

      return {
        nextState: {
          ...pitchState,
          count: {
            balls: state.count.balls,
            strikes: nextStrikes,
          },
        },
        summary: {
          pitchResult,
          outcome: pitchResult,
          runsScored: 0,
          outsRecorded: 0,
          didPlateAppearanceEnd: false,
          inningEnded: false,
        },
      };
    }

    case 'foul': {
      const nextStrikes = Math.min(2, state.count.strikes + 1);

      return {
        nextState: {
          ...pitchState,
          count: {
            balls: state.count.balls,
            strikes: nextStrikes,
          },
        },
        summary: {
          pitchResult,
          outcome: 'foul',
          runsScored: 0,
          outsRecorded: 0,
          didPlateAppearanceEnd: false,
          inningEnded: false,
        },
      };
    }

    case 'in-play-out': {
      const nextState = completePlateAppearance(pitchState, state.bases, 0, 1);

      return {
        nextState,
        summary: {
          pitchResult,
          outcome: 'in-play-out',
          runsScored: 0,
          outsRecorded: 1,
          didPlateAppearanceEnd: true,
          inningEnded: nextState.isInningOver,
        },
      };
    }

    case 'single': {
      const hitResult = advanceOnSingle(state.bases);
      const nextState = completePlateAppearance(pitchState, hitResult.bases, hitResult.runsScored, 0);

      return {
        nextState,
        summary: {
          pitchResult,
          outcome: 'single',
          runsScored: hitResult.runsScored,
          outsRecorded: 0,
          didPlateAppearanceEnd: true,
          inningEnded: false,
        },
      };
    }

    case 'double': {
      const hitResult = advanceOnDouble(state.bases);
      const nextState = completePlateAppearance(pitchState, hitResult.bases, hitResult.runsScored, 0);

      return {
        nextState,
        summary: {
          pitchResult,
          outcome: 'double',
          runsScored: hitResult.runsScored,
          outsRecorded: 0,
          didPlateAppearanceEnd: true,
          inningEnded: false,
        },
      };
    }

    case 'triple': {
      const hitResult = advanceOnTriple(state.bases);
      const nextState = completePlateAppearance(pitchState, hitResult.bases, hitResult.runsScored, 0);

      return {
        nextState,
        summary: {
          pitchResult,
          outcome: 'triple',
          runsScored: hitResult.runsScored,
          outsRecorded: 0,
          didPlateAppearanceEnd: true,
          inningEnded: false,
        },
      };
    }

    case 'home-run': {
      const hitResult = advanceOnHomeRun(state.bases);
      const nextState = completePlateAppearance(pitchState, hitResult.bases, hitResult.runsScored, 0);

      return {
        nextState,
        summary: {
          pitchResult,
          outcome: 'home-run',
          runsScored: hitResult.runsScored,
          outsRecorded: 0,
          didPlateAppearanceEnd: true,
          inningEnded: false,
        },
      };
    }
  }
};

export const playPitch = (
  state: GameState,
  zoneId: PitchZoneId,
  options: ResolvePitchResultOptions = {},
): PitchStepResult => applyPitchResult(state, zoneId, resolvePitchResult(zoneId, options));
