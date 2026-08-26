---
paths:
  - "apps/vue_janken/**"
---

## vue_janken: no build step, unlike vue_rpg

Vue 3 is loaded directly as an ES module from `../../cdn_resources/vue.esm-browser.js`
in `js/main.js` — there is no TypeScript, no bundler, no `node_modules`. This
diverges from `apps/vue_rpg`, which compiles from TypeScript sources; do not
look for or expect a `src/` + compiled-output split here. Edit the `.js`
files under `js/` directly.

## `cheat/` is a dev-only console tool, gated by config

`cheat/cheat.js` is not part of the served game UI — it's pasted into the
browser devtools console to drive the app programmatically (`autoPlay()`,
`fixComputerChoice()`, `setScore()`, etc.) via a debug API the app exposes at
`window.__JANKEN_DEBUG__`. It only works when `js/config.js`'s
`APP_CONFIG.debug.enabled` is `true` — `js/main.js` dynamically imports
`js/debug/debugController.js` only in that case, and that controller is what
publishes `window.__JANKEN_DEBUG__` and swaps `gameLogic.choiceStrategy` to
allow the computer's hand to be overridden. `cheat/README.md` documents
usage in full; treat `cheat/` as a debug/demo aid, never as production game
logic, and don't wire it into `index.html` or the component tree.

## localStorage schema (not stated in README)

`js/composables/useScore.js` persists two independent top-level keys via
`useScore(storageKey = 'jankenScore', historyKey = 'jankenHistory')`:

- `jankenScore` — JSON `{ wins, losses, draws }`.
- `jankenHistory` — JSON array of `{ timestamp, playerChoice, computerChoice, result }`, newest first, capped at 100 entries (older entries are silently dropped, not archived).

Both keys are written together on every `updateByResult()` call. `cheat.js`'s
`setScore()` only writes `jankenScore` directly (bypassing history) and
requires a manual page reload to take effect, since Vue's reactive `score`
was already initialized from localStorage at mount time.
