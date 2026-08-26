"use strict";

// ===== 状態遷移トリガ =====
// ヒット・スタンドの手続きと勝敗判定。
// UI 副作用・stats 加算・phase 更新は持たず、machine.js の transition() に委ねる。

import { state, handScore, draw } from "./state.js";
import { transition, Event, isRoundActive } from "./machine.js";

// ディーラーは 17 以上になるまで引き、決着まで進める（同期一括処理）。
// stand() / doubleDown() から共用。
function playOutDealer() {
  while (handScore(state.dealer) < 17) {
    state.dealer.push(draw());
  }
  settle();
}

function settle() {
  const p = handScore(state.player);
  const d = handScore(state.dealer);
  if (d > 21) {
    transition(Event.DEALER_DONE, { result: "win", reason: "dealerBust" });
  } else if (p > d) {
    transition(Event.DEALER_DONE, { result: "win", reason: "score" });
  } else if (p < d) {
    transition(Event.DEALER_DONE, { result: "lose", reason: "score" });
  } else {
    transition(Event.DEALER_DONE, { result: "push", reason: "score" });
  }
}

export function hit() {
  if (!isRoundActive()) return;
  state.player.push(draw());
  transition(Event.PLAYER_HIT); // 自己遷移: 描画のみ
  if (handScore(state.player) > 21) {
    transition(Event.PLAYER_BUST, { result: "lose", reason: "bust" });
  }
}

export function stand() {
  if (!isRoundActive()) return;
  transition(Event.PLAYER_STAND);
  playOutDealer();
}

// ダブルダウン: 最初の 2 枚のときのみ。賭け金を倍にして
// 追加で coins から差し引き、1 枚だけ引いて自動的にスタンド扱い。
// バーストした場合はディーラーを引かずに即決着。
export function doubleDown() {
  if (!isRoundActive() || !state.canDouble) return;
  state.coins -= state.bet; // 追加分を供託
  state.bet *= 2;
  state.doubled = true;
  state.player.push(draw());
  if (handScore(state.player) > 21) {
    transition(Event.PLAYER_BUST, { result: "lose", reason: "bust" });
    return;
  }
  transition(Event.PLAYER_DOUBLE);
  playOutDealer();
}

// サレンダー: 最初の 2 枚のときのみ。即座にラウンド終了し、
// 賭け金の半分は applyOutcome 側で返却する。
export function surrender() {
  if (!isRoundActive() || !state.canSurrender) return;
  transition(Event.PLAYER_SURRENDER, {
    result: "surrender",
    reason: "surrender",
  });
}
