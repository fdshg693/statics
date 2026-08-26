"use strict";

// ===== UI 層 =====
// DOM 参照と描画のみを担う。ゲームロジックは持たず、
// state を読み取って画面へ反映する。

import { state, cardValue, handScore } from "./state.js";

const el = {
  dealerCards: document.getElementById("dealer-cards"),
  playerCards: document.getElementById("player-cards"),
  dealerScore: document.getElementById("dealer-score"),
  playerScore: document.getElementById("player-score"),
  message: document.getElementById("message"),
  dealBtn: document.getElementById("deal-btn"),
  hitBtn: document.getElementById("hit-btn"),
  standBtn: document.getElementById("stand-btn"),
  doubleBtn: document.getElementById("double-btn"),
  surrenderBtn: document.getElementById("surrender-btn"),
  nextBtn: document.getElementById("next-btn"),
  resetBtn: document.getElementById("reset-btn"),
  betControls: document.getElementById("bet-controls"),
  coins: document.getElementById("coins"),
  bet: document.getElementById("bet"),
  wins: document.getElementById("wins"),
  losses: document.getElementById("losses"),
  pushes: document.getElementById("pushes"),
};

function renderCard(card, hidden) {
  const div = document.createElement("div");
  div.className = "card";
  if (hidden) {
    div.classList.add("back");
    div.setAttribute("aria-label", "裏向きのカード");
    return div;
  }
  if (card.suit.red) div.classList.add("red");
  div.setAttribute("aria-label", card.rank + " " + card.suit.symbol);
  div.innerHTML =
    '<span class="rank-top">' + card.rank + "</span>" +
    '<span class="suit-center">' + card.suit.symbol + "</span>" +
    '<span class="rank-bottom">' + card.rank + "</span>";
  return div;
}

export function render(hideDealerHole) {
  el.playerCards.replaceChildren();
  for (const card of state.player) {
    el.playerCards.appendChild(renderCard(card, false));
  }
  el.playerScore.textContent =
    state.player.length === 0 ? "" : handScore(state.player);

  el.dealerCards.replaceChildren();
  state.dealer.forEach((card, i) => {
    const hidden = hideDealerHole && i === 1;
    el.dealerCards.appendChild(renderCard(card, hidden));
  });
  // ベット受付フェーズなど未配の局面では手札が空。スコアは空表示にする。
  if (state.dealer.length === 0) {
    el.dealerScore.textContent = "";
  } else {
    el.dealerScore.textContent = hideDealerHole
      ? cardValue(state.dealer[0].rank)
      : handScore(state.dealer);
  }
}

export function setMessage(text, kind) {
  el.message.textContent = text;
  el.message.className = "message" + (kind ? " " + kind : "");
}

export function updateScoreboard() {
  el.wins.textContent = state.stats.wins;
  el.losses.textContent = state.stats.losses;
  el.pushes.textContent = state.stats.pushes;
}

// コイン残高と現在のベット額を反映する。
export function updateBank() {
  el.coins.textContent = state.coins;
  el.bet.textContent = state.bet;
}

// phase 文字列に応じて各操作の活殺を一元的に決める。
//   betting   … ベット選択＋配る可（ベット>0 のとき）
//   playerTurn… ヒット/スタンド可、ダブル/サレンダーは条件付き
//   roundOver … 破産なら「リスタート」、そうでなければ「次のラウンドへ」
//   それ以外  … プレイ操作は不可
export function setControls(phase) {
  const betting = phase === "betting";
  const playing = phase === "playerTurn";
  const roundOver = phase === "roundOver";
  const broke = state.isBroke;

  // 破産はラウンド終了後に確定する（賭け金精算後）。
  el.resetBtn.hidden = !(roundOver && broke);
  el.nextBtn.hidden = !(roundOver && !broke);
  el.betControls.hidden = !betting;

  el.dealBtn.disabled = !betting || state.bet <= 0;
  el.hitBtn.disabled = !playing;
  el.standBtn.disabled = !playing;
  el.doubleBtn.disabled = !state.canDouble;
  el.surrenderBtn.disabled = !state.canSurrender;
}

// イベントリスナー登録は main 層に委ねる
export function bindControls({
  onBet,
  onDeal,
  onHit,
  onStand,
  onDouble,
  onSurrender,
  onNext,
  onReset,
}) {
  // data-bet 属性（数値 or "all"）を持つベットボタン群
  el.betControls.querySelectorAll("[data-bet]").forEach((btn) => {
    btn.addEventListener("click", () => onBet(btn.dataset.bet));
  });
  el.dealBtn.addEventListener("click", onDeal);
  el.hitBtn.addEventListener("click", onHit);
  el.standBtn.addEventListener("click", onStand);
  el.doubleBtn.addEventListener("click", onDouble);
  el.surrenderBtn.addEventListener("click", onSurrender);
  el.nextBtn.addEventListener("click", onNext);
  el.resetBtn.addEventListener("click", onReset);
}
