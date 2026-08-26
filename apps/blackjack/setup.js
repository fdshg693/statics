"use strict";

// ===== 初期配置 =====
// ラウンド開始時のシュー再構築判定・初期 2 枚配り・
// 配った時点でのブラックジャック判定を担う。
// UI 副作用・stats 加算・phase 更新は持たず、machine.js の transition() に委ねる。

import {
  state,
  shuffle,
  buildShoe,
  draw,
  isBlackjack,
  resetCoins,
  RESHUFFLE_THRESHOLD,
} from "./state.js";
import { transition, Event, start } from "./machine.js";

// ベット受付フェーズに入る前の準備（phase 遷移は含まない純粋な状態クリア）。
// 破産していたら所持コインを初期額へリセットする。
// 遷移の発火は呼び出し側が担う:
//   - 起動時:    machine.js の start() がこれを呼んでから BET_READY
//   - 次ラウンド: startBetting() がこれを呼んでから BET_READY
function prepareBetting() {
  if (state.isBroke) resetCoins();
  state.bet = 0;
  state.doubled = false;
}

// 起動時の開始点。machine.js に prepareBetting を注入して
// 初期 phase 確立 → IDLE→BETTING までを machine.js 側に委ねる。
export function startGame() {
  start(prepareBetting);
}

// 次ラウンド／破産リスタート時にベット受付へ戻す。
// 準備してから ROUND_OVER→BETTING を発火する。
export function startBetting() {
  prepareBetting();
  transition(Event.BET_READY);
}

// BETTING 中にベット額を更新する。所持コイン上限でクランプする。
//   "all" … 全額    "0" … クリア    数値文字列 … その額を加算
export function setBet(token) {
  if (state.phase !== "betting") return;
  const max = state.coins;
  if (token === "all") {
    state.bet = max;
  } else if (token === "0") {
    state.bet = 0;
  } else {
    const delta = parseInt(token, 10);
    if (Number.isNaN(delta)) return;
    state.bet = Math.min(Math.max(state.bet + delta, 0), max);
  }
}

export function deal() {
  // ベット未設定（0）では配れない。
  if (state.phase !== "betting" || state.bet <= 0 || state.bet > state.coins) {
    return;
  }
  state.coins -= state.bet; // 賭け金を供託（精算は applyOutcome）
  state.doubled = false;

  // シュー未生成、または残り枚数がペネトレーションを下回ったら作り直す。
  // それ以外はラウンドをまたいでシューを維持する（カードカウンティング可）。
  if (state.deck.length < RESHUFFLE_THRESHOLD) {
    state.deck = shuffle(buildShoe());
  }
  state.player = [draw(), draw()];
  state.dealer = [draw(), draw()];
  transition(Event.DEAL);

  const playerBj = isBlackjack(state.player);
  const dealerBj = isBlackjack(state.dealer);
  if (playerBj && dealerBj) {
    transition(Event.NATURAL_BJ, { result: "push", reason: "blackjack" });
  } else if (playerBj) {
    transition(Event.NATURAL_BJ, { result: "win", reason: "blackjack" });
  } else if (dealerBj) {
    transition(Event.NATURAL_BJ, { result: "lose", reason: "blackjack" });
  }
}
