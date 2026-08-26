import type { PitchZone, PitchZoneId } from '../types/game';

export const PITCH_ZONES: readonly PitchZone[] = [
  {
    id: 'high-inside',
    row: 'high',
    column: 'inside',
    label: '高め内角',
    aimHint: '際どさを優先しつつ、見逃しと打ち損じを狙うコースです。',
    tendency: 'pitcher-friendly',
  },
  {
    id: 'high-center',
    row: 'high',
    column: 'center',
    label: '高め中央',
    aimHint: '高めの球威で押せますが、甘く入ると長打のリスクがあります。',
    tendency: 'balanced',
  },
  {
    id: 'high-outside',
    row: 'high',
    column: 'outside',
    label: '高め外角',
    aimHint: 'ゾーン際を使いやすく、空振りや凡打を狙いやすい位置です。',
    tendency: 'pitcher-friendly',
  },
  {
    id: 'middle-inside',
    row: 'middle',
    column: 'inside',
    label: '真ん中内角',
    aimHint: 'ストライクを取りやすい一方で、強い打球を許しやすい位置です。',
    tendency: 'balanced',
  },
  {
    id: 'middle-center',
    row: 'middle',
    column: 'center',
    label: 'ど真ん中',
    aimHint: '最も打者有利な危険地帯で、単打や長打の比率が高めです。',
    tendency: 'hitter-friendly',
  },
  {
    id: 'middle-outside',
    row: 'middle',
    column: 'outside',
    label: '真ん中外角',
    aimHint: '勝負しやすい反面、芯で捉えられると痛打になりやすい位置です。',
    tendency: 'balanced',
  },
  {
    id: 'low-inside',
    row: 'low',
    column: 'inside',
    label: '低め内角',
    aimHint: 'ゴロや打ち損じを誘いやすく、投手優位を作りやすいコースです。',
    tendency: 'pitcher-friendly',
  },
  {
    id: 'low-center',
    row: 'low',
    column: 'center',
    label: '低め中央',
    aimHint: '低さで抑えられますが、甘く入ると安打は十分にありえます。',
    tendency: 'balanced',
  },
  {
    id: 'low-outside',
    row: 'low',
    column: 'outside',
    label: '低め外角',
    aimHint: 'ボール球にも逃げやすく、見逃しと打ち損じの両方を狙えます。',
    tendency: 'pitcher-friendly',
  },
];

const pitchZoneMap: Record<PitchZoneId, PitchZone> = Object.fromEntries(
  PITCH_ZONES.map((zone) => [zone.id, zone]),
) as Record<PitchZoneId, PitchZone>;

export const getPitchZone = (zoneId: PitchZoneId): PitchZone => pitchZoneMap[zoneId];
