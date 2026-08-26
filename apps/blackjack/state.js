"use strict";

// ===== ステート管理 =====
// ゲームの状態（デッキ・手札・統計）の保持と、状態に依存しない
// 純粋なカードロジック（シュー生成・シャッフル・スコア計算）を担う。

const SUITS = [
  { symbol: "♠", red: false }, // スペード
  { symbol: "♥", red: true },  // ハート
  { symbol: "♦", red: true },  // ダイヤ
  { symbol: "♣", red: false }, // クラブ
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// シュー設定: NUM_DECKS 組をまとめて使い、残り枚数が
// RESHUFFLE_THRESHOLD を下回ったラウンド開始時に作り直す。
export const NUM_DECKS = 6;
export const RESHUFFLE_THRESHOLD = 52 * NUM_DECKS * 0.25; // ペネトレーション 75%

// 賭け設定。STARTING_COINS は初期所持／破産リセット後の所持コイン。
// BLACKJACK_PAYOUT は配当倍率（3:2 → 1.5）。プッシュは賭け金返却。
export const STARTING_COINS = 10;
export const BLACKJACK_PAYOUT = 1.5;

// 各層が参照・更新する単一の共有ステート。
// phase はラウンドの局面で、machine.js の Phase enum の値と一対一対応する。
// 初期値は持たず null（＝未初期化）とし、起動時に machine.js の start() が
// INITIAL_PHASE で確立する。初期 phase の真実の出所は machine.js 側に一元化。
// この層は machine.js を import しない（循環回避）ため、phase 比較は
// 文字列リテラルで行い、inRound は phase から導出する読み取り専用 getter とする。
// phase の文字列を変更する場合は machine.js の Phase と本 getter を必ず追従させること。
// coins: 現在の所持コイン。bet: このラウンドで賭けている額。
// doubled: このラウンドでダブルダウン済みか（配当・UI 制御で参照）。
// isBroke は所持コインのみで判定する（破産＝コインが尽きた状態。
//   ベット可否やプレイ中かは別の関心事として持たない）。
// canDouble は最初の 2 枚かつ追加供託分のコインがある場合、
// canSurrender は最初の 2 枚であれば可（半額没収のためコイン条件は不要）。
export const state = {
  deck: [],
  player: [],
  dealer: [],
  phase: null, // 起動時に machine.js の start() が INITIAL_PHASE で確立する
  coins: STARTING_COINS,
  bet: 0,
  doubled: false,
  get inRound() {
    return this.phase === "playerTurn" || this.phase === "dealerTurn";
  },
  get isBroke() {
    return this.coins <= 0;
  },
  get canDouble() {
    return (
      this.phase === "playerTurn" &&
      this.player.length === 2 &&
      !this.doubled &&
      this.coins >= this.bet
    );
  },
  get canSurrender() {
    return this.phase === "playerTurn" && this.player.length === 2 && !this.doubled;
  },
  stats: { wins: 0, losses: 0, pushes: 0 },
};

// 破産時のみ呼ぶ。所持コインを初期額へ戻す（統計は維持）。
export function resetCoins() {
  state.coins = STARTING_COINS;
  state.bet = 0;
}

// NUM_DECKS 組ぶんのカードを 1 つのシューにまとめる
export function buildShoe() {
  const shoe = [];
  for (let d = 0; d < NUM_DECKS; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit });
      }
    }
  }
  return shoe;
}

// Fisher-Yates シャッフル
export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cardValue(rank) {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J") return 10;
  return parseInt(rank, 10);
}

// エースを 11 → 1 に降格しながら最善の合計を計算
export function handScore(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    total += cardValue(card.rank);
    if (card.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isBlackjack(hand) {
  return hand.length === 2 && handScore(hand) === 21;
}

// シューが空になった場合のみ作り直す（通常は deal() 開始時に
// ペネトレーション判定で再シャッフルされるため、ここはセーフガード）
export function draw() {
  if (state.deck.length === 0) {
    state.deck = shuffle(buildShoe());
  }
  return state.deck.pop();
}
