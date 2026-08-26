export type Count = {
  balls: number;
  strikes: number;
};

export type Bases = {
  first: boolean;
  second: boolean;
  third: boolean;
};

export type PitchZoneRow = 'high' | 'middle' | 'low';
export type PitchZoneColumn = 'inside' | 'center' | 'outside';

export type PitchZoneId =
  | 'high-inside'
  | 'high-center'
  | 'high-outside'
  | 'middle-inside'
  | 'middle-center'
  | 'middle-outside'
  | 'low-inside'
  | 'low-center'
  | 'low-outside';

export type PitchResultCategory =
  | 'ball'
  | 'called-strike'
  | 'swinging-strike'
  | 'foul'
  | 'in-play-out'
  | 'single'
  | 'double'
  | 'triple'
  | 'home-run';

export type PitchOutcome =
  | PitchResultCategory
  | 'walk'
  | 'strikeout';

export type PitchZoneTendency =
  | 'pitcher-friendly'
  | 'balanced'
  | 'hitter-friendly';

export type PitchZone = {
  id: PitchZoneId;
  row: PitchZoneRow;
  column: PitchZoneColumn;
  label: string;
  aimHint: string;
  tendency: PitchZoneTendency;
};

export type WeightedPitchResult = {
  result: PitchResultCategory;
  weight: number;
};

export type GameState = {
  count: Count;
  outs: number;
  score: number;
  bases: Bases;
  batterNumber: number;
  pitchNumber: number;
  lastPitchZone: PitchZoneId | null;
  lastPitchResult: PitchResultCategory | null;
  isInningOver: boolean;
};

export type PitchStepSummary = {
  pitchResult: PitchResultCategory;
  outcome: PitchOutcome;
  runsScored: number;
  outsRecorded: number;
  didPlateAppearanceEnd: boolean;
  inningEnded: boolean;
};

export type PitchStepResult = {
  nextState: GameState;
  summary: PitchStepSummary;
};
