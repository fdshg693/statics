import { getBasePitchOutcomeTable } from '../config/pitchResultProbabilities';
import type { PitchResultCategory, PitchZoneId, WeightedPitchResult } from '../types/game';

export type PitchWeightAdjuster = (entry: {
  zoneId: PitchZoneId;
  result: PitchResultCategory;
  baseWeight: number;
}) => number;

export type ResolvePitchResultOptions = {
  random?: () => number;
  adjustWeight?: PitchWeightAdjuster;
};

const normalizePitchOutcomeTable = (
  zoneId: PitchZoneId,
  adjustWeight?: PitchWeightAdjuster,
): WeightedPitchResult[] => {
  const adjustedTable = getBasePitchOutcomeTable(zoneId)
    .map(({ result, weight }) => ({
      result,
      weight: adjustWeight
        ? adjustWeight({ zoneId, result, baseWeight: weight })
        : weight,
    }))
    .filter((entry) => entry.weight > 0);

  if (adjustedTable.length === 0) {
    throw new Error(`No positive pitch outcome weights found for zone "${zoneId}".`);
  }

  return adjustedTable;
};

export const getPitchOutcomeTable = (
  zoneId: PitchZoneId,
  adjustWeight?: PitchWeightAdjuster,
): WeightedPitchResult[] => normalizePitchOutcomeTable(zoneId, adjustWeight);

export const resolvePitchResult = (
  zoneId: PitchZoneId,
  options: ResolvePitchResultOptions = {},
): PitchResultCategory => {
  const table = normalizePitchOutcomeTable(zoneId, options.adjustWeight);
  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  const randomValue = (options.random ?? Math.random)();

  if (randomValue < 0 || randomValue >= 1) {
    throw new Error('Random generator must return a value in the range [0, 1).');
  }

  const threshold = randomValue * totalWeight;
  let cumulativeWeight = 0;

  for (const entry of table) {
    cumulativeWeight += entry.weight;

    if (threshold < cumulativeWeight) {
      return entry.result;
    }
  }

  return table[table.length - 1].result;
};
