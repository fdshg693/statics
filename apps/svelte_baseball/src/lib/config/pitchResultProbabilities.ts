import type { PitchZoneId, WeightedPitchResult } from '../types/game';

const pitcherFriendlyTable: readonly WeightedPitchResult[] = [
  { result: 'ball', weight: 20 },
  { result: 'called-strike', weight: 20 },
  { result: 'swinging-strike', weight: 16 },
  { result: 'foul', weight: 14 },
  { result: 'in-play-out', weight: 18 },
  { result: 'single', weight: 7 },
  { result: 'double', weight: 3 },
  { result: 'triple', weight: 1 },
  { result: 'home-run', weight: 1 },
];

const balancedTable: readonly WeightedPitchResult[] = [
  { result: 'ball', weight: 13 },
  { result: 'called-strike', weight: 15 },
  { result: 'swinging-strike', weight: 13 },
  { result: 'foul', weight: 16 },
  { result: 'in-play-out', weight: 19 },
  { result: 'single', weight: 14 },
  { result: 'double', weight: 6 },
  { result: 'triple', weight: 1 },
  { result: 'home-run', weight: 3 },
];

const hitterFriendlyTable: readonly WeightedPitchResult[] = [
  { result: 'ball', weight: 8 },
  { result: 'called-strike', weight: 8 },
  { result: 'swinging-strike', weight: 10 },
  { result: 'foul', weight: 18 },
  { result: 'in-play-out', weight: 18 },
  { result: 'single', weight: 22 },
  { result: 'double', weight: 8 },
  { result: 'triple', weight: 2 },
  { result: 'home-run', weight: 6 },
];

export const PITCH_RESULT_WEIGHTS_BY_ZONE: Record<
  PitchZoneId,
  readonly WeightedPitchResult[]
> = {
  'high-inside': pitcherFriendlyTable,
  'high-center': balancedTable,
  'high-outside': pitcherFriendlyTable,
  'middle-inside': balancedTable,
  'middle-center': hitterFriendlyTable,
  'middle-outside': balancedTable,
  'low-inside': pitcherFriendlyTable,
  'low-center': balancedTable,
  'low-outside': pitcherFriendlyTable,
};

export const getBasePitchOutcomeTable = (
  zoneId: PitchZoneId,
): readonly WeightedPitchResult[] => PITCH_RESULT_WEIGHTS_BY_ZONE[zoneId];
