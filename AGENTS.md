# Project Guidance

## Commands

- `npm run build` regenerates the obfuscated browser bundle from `src/xq.js`.
- `npm run check` verifies the generated bundle is current.
- `npm test` runs the static smoke tests.

## Known Pitfalls

- WebLLM worker failures can happen after engine initialization. Keep persistent `error` and `messageerror` handlers, invalidate stale async attempts, and always resume the terminal if a worker dies during generation.
- A fallback model is a separate execution choice. Never load it without explicit consent, even when its weights are already cached.
- Public biography, project, contact, and prompt facts come from `js/profile.js`; do not duplicate or hardcode them in the terminal source.
- `js/xq.js` is generated. Edit `src/xq.js`, then run `npm run build` and commit both source and output.
- The bundled jQuery Terminal version once deserialized local history with `new Function`. Keep the `JSON.parse` patch and its CSP regression test; executable-string parsing breaks strict CSP and turns browser storage into code.
- jQuery Terminal conflates outside-click blur with an intentional pause. Keep `onBlur` returning `false`, stop quick-command click propagation, and never restore focus when `term.paused()` was already true or a model generation can be interrupted.
- Never put `aria-live` on `#term`; the command editor mutates on every keystroke. Scope live/log semantics to the generated `.terminal-output` element only.
- The legacy editor captures Tab and Shift+Tab unless its `keydown` option returns `true` for key 9. Preserve that override so keyboard users can leave the terminal.
- The plugin generates an otherwise unlabeled `.clipboard` textarea. Keep its command-input label and description/output relationships when changing terminal initialization.
- Keep `#term` programmatically focusable (`tabindex="-1"`) so the skip link moves keyboard focus, not only the viewport.
- WebLLM's npm version is fixed, but its default model and WASM config uses upstream-managed `main` URLs. Do not call model binaries pinned unless custom immutable revisions or self-hosted hashes are actually configured.
