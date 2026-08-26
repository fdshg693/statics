"use strict";

// ===== エントリポイント =====
// 各層を結線し、操作ボタンとゲーム処理を結びつける。

import { state } from "./state.js";
import { updateScoreboard, updateBank, setControls, bindControls } from "./ui.js";
import { deal, startGame, startBetting, setBet } from "./setup.js";
import { hit, stand, doubleDown, surrender } from "./flow.js";

// ベット操作はゲーム遷移を伴わないため、ここで UI を再反映する
// （配るボタンの活殺・ベット表示の更新）。
function onBet(token) {
  setBet(token);
  updateBank();
  setControls(state.phase);
}

// 次のラウンド／破産後のリスタートはどちらもベット受付へ戻すだけ。
// 破産していれば startBetting() 内で所持コインが初期額へ復帰する。
function onNext() {
  startBetting();
}

bindControls({
  onBet,
  onDeal: deal,
  onHit: hit,
  onStand: stand,
  onDouble: doubleDown,
  onSurrender: surrender,
  onNext,
  onReset: onNext,
});

// 初期表示: スコアボード・残高を描画し、ステートマシンを起動する。
// startGame() → machine.js の start() が初期 phase を確立し
// IDLE→BETTING まで進める（ゲーム進行の開始点は machine.js 内）。
updateScoreboard();
updateBank();
startGame();
