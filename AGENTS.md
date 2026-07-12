# Project Guidance

## Commands

- `npm run build` regenerates the obfuscated browser bundle from `src/xq.js`.
- `npm run check` verifies the generated bundle is current.
- `npm test` runs the static smoke tests.

## Known Pitfalls

- Keep the local LLM on WebLLM's direct `CreateMLCEngine` path. The worker-backed replacement failed to load in a real browser even though the direct engine had worked reliably.
- Chat has one explicit consent gate for the Qwen3 4B download. Do not add automatic model selection, preflight probing, fallback models, or a second consent flow unless explicitly requested.
- Keep the visible console prompt distinct from the AI system prompt. The console must open directly at `>:` with `greetings: null`; improving the AI's internal instructions must not add visible startup copy.
- Public biography, project, contact, and prompt facts come from `js/profile.js`; do not duplicate or hardcode them in the terminal source.
- `js/xq.js` is generated. Edit `src/xq.js`, then run `npm run build` and commit both source and output.
- The bundled jQuery Terminal version once deserialized local history with `new Function`. Keep the `JSON.parse` patch and its CSP regression test; executable-string parsing breaks strict CSP and turns browser storage into code.
- jQuery Terminal conflates outside-click blur with an intentional pause. Keep `onBlur` returning `false`, stop quick-command click propagation, and never restore focus when `term.paused()` was already true or a model generation can be interrupted.
- Never put `aria-live` on `#term`; the command editor mutates on every keystroke. Scope live/log semantics to the generated `.terminal-output` element only.
- The legacy plugin's optional `tabcompletion` callback did not work reliably in the deployed terminal. Keep the explicit key-9 handler that completes the final token through `get_command()` and `set_command()`.
- The plugin generates an otherwise unlabeled `.clipboard` textarea. Keep its command-input label and description/output relationships when changing terminal initialization.
- Keep `#term` programmatically focusable (`tabindex="-1"`) so the skip link moves keyboard focus, not only the viewport.
- WebLLM's npm version is fixed, but its default model and WASM config uses upstream-managed `main` URLs. Do not call model binaries pinned unless custom immutable revisions or self-hosted hashes are actually configured.
