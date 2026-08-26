---
paths:
  - "apps/blackjack/state.js"
  - "apps/blackjack/machine.js"
  - "apps/blackjack/flow.js"
  - "apps/blackjack/setup.js"
  - "apps/blackjack/main.js"
  - "apps/blackjack/ui.js"
---

## Round State Machine (blackjack)

- `machine.js#transition()` is the ONLY place `state.phase` is mutated and the
  only place UI/onEnter side effects fire. `flow.js` and `setup.js` never set
  `state.phase` or call `ui.js` render functions directly — they only call
  `transition(Event.X, payload)`. Exception: `Event.PLAYER_HIT` is a
  self-transition (phase→same phase) that skips `onEnter` and instead calls
  `render(true)` + `setControls()` inline inside `transition()` itself.
- `state.js` cannot import `machine.js` (would create a cycle), so its
  `inRound` getter re-implements phase checks as string literals
  (`"playerTurn"`, `"dealerTurn"`). If you rename a `Phase` enum value in
  `machine.js`, you must manually update `state.js`'s getters to match —
  nothing enforces this at compile time.
- Startup sequence: `state.phase` starts as `null`. `main.js` calls
  `setup.js#startGame()` → `machine.js#start()`, which sets
  `state.phase = INITIAL_PHASE` then fires `BET_READY`. `start()` takes
  `setup.js#prepareBetting` as an injected callback (not an import) purely to
  avoid a `machine.js → setup.js` reverse dependency.
- Payout/settlement math lives in `machine.js#applyOutcome()`, run from
  `onEnterRoundOver()` — NOT in `flow.js` (which only decides win/lose/push
  and calls `transition(DEALER_DONE/PLAYER_BUST/...)` with a `result`/`reason`
  payload). The bet itself is deducted earlier, in `setup.js#deal()`.
- Dealer auto-play (`flow.js#playOutDealer`, draws to 17) runs synchronously
  inside `stand()`/`doubleDown()`, not as a `DEALER_TURN` `onEnter` effect —
  `onEnterDealerTurn()` is intentionally a no-op reserved for future
  animation.
