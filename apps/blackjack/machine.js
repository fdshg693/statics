"use strict";

// ===== ステートマシン =====
// ラウンドの局面（phase）と遷移を一元管理する層。
// 遷移テーブル（from→event→to）と各状態の入場時副作用（onEnter）を
// ここに集約し、setup/flow からは transition() だけを呼ばせる。
// state.js と ui.js のみ import する（state.js はこの層を import しない＝循環回避）。

import { state, BLACKJACK_PAYOUT } from "./state.js";
import {
  render,
  setMessage,
  updateScoreboard,
  setControls,
  updateBank,
} from "./ui.js";

// phase の値は state.js の inRound getter の文字列比較と厳密一致させること。
// 値を変更する場合は state.js 側の getter も追従させる。
export const Phase = Object.freeze({
  IDLE: "idle",
  BETTING: "betting", // ベット額を選んで配るのを待つ局面
  PLAYER_TURN: "playerTurn",
  DEALER_TURN: "dealerTurn",
  ROUND_OVER: "roundOver",
});

// ゲーム起動時の初期 phase。ステートマシンの「開始点」はここが真実。
// state.js は循環回避のため phase の初期値を持たず（phase: null）、
// start() がこの値で state.phase を確立してから最初の遷移を発火する。
export const INITIAL_PHASE = Phase.IDLE;

export const Event = Object.freeze({
  BET_READY: "BET_READY", // ベット受付開始（IDLE / ROUND_OVER → BETTING）
  DEAL: "DEAL", // 配る（BETTING → PLAYER_TURN）
  PLAYER_HIT: "PLAYER_HIT", // ヒット（PLAYER_TURN 自己遷移）
  PLAYER_STAND: "PLAYER_STAND", // スタンド（PLAYER_TURN→DEALER_TURN）
  PLAYER_DOUBLE: "PLAYER_DOUBLE", // ダブルダウン（PLAYER_TURN→DEALER_TURN）
  PLAYER_SURRENDER: "PLAYER_SURRENDER", // サレンダー（PLAYER_TURN→ROUND_OVER）
  PLAYER_BUST: "PLAYER_BUST", // 21超（PLAYER_TURN→ROUND_OVER）
  NATURAL_BJ: "NATURAL_BJ", // 配札時BJ（PLAYER_TURN→ROUND_OVER）
  DEALER_DONE: "DEALER_DONE", // 決着（DEALER_TURN→ROUND_OVER）
});

// from → event → to。ここがラウンド進行の唯一の真実。
const TRANSITIONS = {
  [Phase.IDLE]: { [Event.BET_READY]: Phase.BETTING },
  [Phase.BETTING]: { [Event.DEAL]: Phase.PLAYER_TURN },
  [Phase.PLAYER_TURN]: {
    [Event.PLAYER_HIT]: Phase.PLAYER_TURN, // 自己遷移（onEnter スキップ）
    [Event.PLAYER_BUST]: Phase.ROUND_OVER,
    [Event.PLAYER_STAND]: Phase.DEALER_TURN,
    [Event.PLAYER_DOUBLE]: Phase.DEALER_TURN,
    [Event.PLAYER_SURRENDER]: Phase.ROUND_OVER,
    [Event.NATURAL_BJ]: Phase.ROUND_OVER,
  },
  [Phase.DEALER_TURN]: { [Event.DEALER_DONE]: Phase.ROUND_OVER },
  [Phase.ROUND_OVER]: { [Event.BET_READY]: Phase.BETTING },
};

// ROUND_OVER 入場時に参照する直近の勝敗。
// result: "win" | "lose" | "push" | "surrender"
// reason: "blackjack" | "bust" | "dealerBust" | "score" | "surrender" | null
let lastOutcome = { result: null, reason: null };

/**
 * ステートマシンの開始点。ゲーム起動時に main.js から一度だけ呼ぶ。
 * 初期 phase（INITIAL_PHASE）を確立し、ベット準備処理を実行してから
 * 最初の遷移 IDLE→BETTING を発火する。これによりラウンド進行の
 * 「最初の一歩」が machine.js 内に明示される。
 * @param {() => void} prepareBetting ベット受付前の準備（破産リセット・
 *   bet/doubled クリア）。setup.js から渡す（machine→setup の逆依存を
 *   作らず循環を避けるためコールバック注入とする）。
 */
export function start(prepareBetting) {
  state.phase = INITIAL_PHASE; // ここが phase 初期値の唯一の確立点
  prepareBetting();
  transition(Event.BET_READY); // IDLE → BETTING
}

export function getPhase() {
  return state.phase;
}

export function isRoundActive() {
  return state.phase === Phase.PLAYER_TURN || state.phase === Phase.DEALER_TURN;
}

/**
 * 状態遷移を実行する。遷移定義と副作用の唯一の入口。
 * @param {string} event Event.* のいずれか
 * @param {{result?: string, reason?: string}} [payload]
 *   ROUND_OVER への遷移時は result 必須、reason 任意。
 * @returns {boolean} 遷移が成立し副作用を実行したら true。
 *   不正遷移（その phase で未定義の event）は false（no-op）。
 */
export function transition(event, payload = {}) {
  const from = state.phase;
  const to = TRANSITIONS[from]?.[event];
  if (to === undefined) return false; // 不正遷移ガード（例: IDLE で HIT）

  // PLAYER_HIT は自己遷移。message はそのままに、描画と
  // ボタン活殺のみ更新する（1枚引くと canDouble/canSurrender が
  // false になるため、非活性表示を追従させる必要がある）。
  if (event === Event.PLAYER_HIT && to === from) {
    render(true);
    setControls(state.phase);
    return true;
  }

  if (to === Phase.ROUND_OVER) {
    lastOutcome = { result: payload.result, reason: payload.reason ?? null };
  }
  state.phase = to;
  runOnEnter(to);
  return true;
}

function runOnEnter(phase) {
  switch (phase) {
    case Phase.BETTING:
      return onEnterBetting();
    case Phase.PLAYER_TURN:
      return onEnterPlayerTurn();
    case Phase.DEALER_TURN:
      return onEnterDealerTurn();
    case Phase.ROUND_OVER:
      return onEnterRoundOver();
    case Phase.IDLE:
      return onEnterIdle();
  }
}

function onEnterBetting() {
  setControls(state.phase);
  render(true);
  updateBank();
  setMessage("ベット額を選んで「配る」を押してください", null);
}

function onEnterPlayerTurn() {
  setControls(state.phase);
  render(true); // ホールカードは伏せる
  setMessage("ヒット／スタンド／ダブルダウン／サレンダー", null);
}

function onEnterDealerTurn() {
  // 意図的 no-op: ディーラーのドローは flow.js の stand() で同期一括処理する。
  // 状態としては存在させるが描画ステップは持たない。
  // 将来「1枚ずつアニメーション表示」を実装する場合のフック地点。
}

function onEnterRoundOver() {
  render(false); // ホールカードを公開
  applyOutcome(lastOutcome); // 賭け金精算（coins 更新・bet=0）が先
  setControls(state.phase); // 精算後の coins で破産判定する
  updateScoreboard();
  updateBank();
}

function onEnterIdle() {
  // 現状未使用。将来「リセット」操作の入場点として確保。
}

// 勝敗の確定（stats 加算）・賭け金の精算・メッセージ導出を一箇所に集約。
// 賭け金は DEAL 時点で coins から差し引かれている前提で、ここでは
// 結果に応じた払い戻し（元金＋配当）を coins に戻す。
//   win(blackjack) … bet + bet*1.5   win(通常) … bet*2
//   push … bet（元金返却）            surrender … bet/2 返却
//   lose … 返却なし
// 精算後に bet を 0 に戻し、次ラウンドの BETTING 入場に備える。
function applyOutcome({ result, reason }) {
  const bet = state.bet;
  if (result === "win") {
    state.stats.wins++;
    state.coins +=
      reason === "blackjack"
        ? Math.round(bet + bet * BLACKJACK_PAYOUT)
        : bet * 2;
  } else if (result === "lose") {
    state.stats.losses++;
    // 賭け金は没収済み（払い戻しなし）
  } else if (result === "push") {
    state.stats.pushes++;
    state.coins += bet; // 元金返却
  } else if (result === "surrender") {
    state.stats.losses++;
    state.coins += Math.floor(bet / 2); // 半額返却
  }
  state.bet = 0;
  setMessage(messageFor(result, reason), cssClassFor(result)); // CSS class
}

// result を message の CSS クラスへ写像（surrender は lose 系の赤表示）。
function cssClassFor(result) {
  return result === "surrender" ? "lose" : result;
}

function messageFor(result, reason) {
  if (result === "surrender") return "サレンダー：賭け金の半分を返却";
  if (reason === "blackjack" && result === "win") return "ブラックジャック！プレイヤーの勝ち！";
  if (reason === "blackjack" && result === "lose") return "ディーラーのブラックジャック…";
  if (reason === "blackjack" && result === "push") return "両者ブラックジャック。引き分け";
  if (reason === "bust") return "バースト！ディーラーの勝ち…";
  if (reason === "dealerBust") return "ディーラーバースト！プレイヤーの勝ち！";
  if (result === "win") return "プレイヤーの勝ち！";
  if (result === "lose") return "ディーラーの勝ち…";
  return "引き分け";
}
