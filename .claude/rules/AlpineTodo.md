---
paths:
  - "apps/alpine_todo/**"
---

## alpine_todo: classic-script module loading

Files under `js/` are **plain classic `<script>` files, not ES modules** — no
`import`/`export`, no bundler. Modules communicate via the shared top-level
script scope (e.g. `js/shared/orderManager.js` declares `class OrderManager`
with no export at all) or an explicit `globalThis.X = X` assignment (e.g.
`js/shared/todoRepository.js`). Either way, **load order in the `<script>`
tags is load-bearing**: a module must appear before anything that references
it. `index.html` and `stats.html` each hard-code their own ordered script
list — they are not derived from a shared manifest, so adding/renaming a
`js/` file means editing both HTML files' `<script>` lists by hand.

## Test harness quirk (`tests/loadScript.js`)

Vitest never imports `js/*.js` as modules. `loadScript()`/`loadAlpineComponent()`
read the raw source text of the files you name, concatenate them, and `eval`
them via `new Function(...)`. `loadAlpineComponent()` additionally mocks
`Alpine.store`/`Alpine.data` and Proxies `document.addEventListener` so an
`alpine:init` listener runs immediately and its store/data definition is
captured — no real Alpine runtime is involved in tests.

Consequence: each test file hard-codes its own `fileNames` array reproducing
the dependency chain from the HTML `<script>` order (see
`tests/todoStore.test.js`). When you add or reorder a `js/shared/*` or
`js/todo|stats/*` file, you must update that array in every test that
depends on it — Vitest gives no import-graph error if you forget, the eval
just silently lacks the symbol.
