# lindner.earth

## ★ This repository is not what deploys the site

The live `www.lindner.earth` is served by **`oddie-apps/static-sites`**, from its
vendored copy at `sites/www.lindner.earth/`, behind the anycast edges. This
repository was consolidated into it on 2026-07-12.

As of 2026-08-26 every runtime file in this tree is byte-identical to the
deployed copy. `index.html` was 8,638 bytes here against 9,516 live for six
weeks; the two changes that made up the difference were brought back on that
date, so the trap of building here and copying the result over the live copy is
gone rather than documented:

- the Plausible tag (`static-sites` `252859d`, 2026-08-12), `<script defer
  data-domain="lindner.earth" src="https://stats.oddie.app/js/script.js">`.
  `data-domain` must match a Plausible site exactly or every event is discarded
  server-side with no visible error, and `stats.oddie.app` must appear in **both**
  `script-src` and `connect-src`. With it in `script-src` alone the file loads and
  `connect-src` then blocks every event it sends, which looks exactly like "no
  visitors";
- `?v=1` cache-busting on the css and js references (`599e711`, 2026-07-12).

**They are two copies with no automation between them, so check before assuming
they still agree.** `diff -r --brief` this directory against
`sites/www.lindner.earth/` in an `oddie-apps/static-sites` checkout; the only
expected differences are the files that never ship (`src/`, `test/`, `scripts/`,
`package*.json`, `Dockerfile`, `Caddyfile`, `AGENTS.md`, `README.md`, `CNAME`).

The push-to-deploy pipeline that used to sit here is gone, removed 2026-08-26.
`k8s/` declared a `lindner-web` Deployment in namespace `web` that is not on the
cluster, and `.forgejo/workflows/docker.yaml` built an image, pushed it, and
committed a `chore(deploy)` tag bump back to `main` naming a tag nothing
consumes. Both steps worked; there was nothing to roll out. The last time it ran
was the merge of the pull request that documented it as dead, which built
`lindner_web:449d90d` and wrote `a5afbae`.

**Do not reintroduce either without an ArgoCD Application to consume them.**
`kubectl get deploy -n web` returns `static-sites` and nothing else, and the only
Application touching this site is `static-sites`, from `oddie-apps/static-sites`.
`Dockerfile` and `Caddyfile` survive as the description of an origin nobody
builds. The `Caddyfile` CSP is kept byte-for-byte equal to the one the edge
actually serves, so it is worth reading, but it is a copy and not the source:

    curl -sSI https://www.lindner.earth | grep -i content-security-policy

is the CSP in force, and it comes from `oddie-apps/edge-config`.

Which copy should be authoritative is an open question — see the repository's
issue. Until it is answered, **`static-sites` is what serves the site** and this
tree is the source of record for `src/xq.js` only.

## Commands

- `npm run build` regenerates the obfuscated browser bundle from `src/xq.js`.
- `npm run check` verifies the generated bundle is current.
- `npm test` runs the static smoke tests.

## Known Pitfalls

- Keep the local LLM on WebLLM's direct `CreateMLCEngine` path. The worker-backed replacement failed to load in a real browser even though the direct engine had worked reliably.
- Chat has one explicit consent gate for the Qwen3 4B download. Do not add automatic model selection, preflight probing, fallback models, or a second consent flow unless explicitly requested.
- Keep the visible console prompt distinct from the AI system prompt. The console must open directly at `>:` with `greetings: null`; improving the AI's internal instructions must not add visible startup copy.
- Public biography, project, contact, and prompt facts come from `js/profile.js`; do not duplicate or hardcode them in the terminal source.
- `index.html` and `Caddyfile` are coupled: every absolute script origin the page loads must appear in the Caddyfile's `script-src`, and anything it talks to must appear in `connect-src`. A test enforces the `script-src` half. The `connect-src` half is not mechanically checked, and its failure is silent: the script loads and every request it makes is blocked, which reads as no traffic rather than as an error.
- `js/xq.js` is generated. Edit `src/xq.js`, then run `npm run build` and commit both source and output. That keeps this repository self-consistent; it does **not** deploy anything — see the note at the top of this file.
- The bundled jQuery Terminal version once deserialized local history with `new Function`. Keep the `JSON.parse` patch and its CSP regression test; executable-string parsing breaks strict CSP and turns browser storage into code.
- jQuery Terminal conflates outside-click blur with an intentional pause. Keep `onBlur` returning `false`, stop quick-command click propagation, and never restore focus when `term.paused()` was already true or a model generation can be interrupted.
- Never put `aria-live` on `#term`; the command editor mutates on every keystroke. Scope live/log semantics to the generated `.terminal-output` element only.
- The legacy plugin's optional `tabcompletion` callback did not work reliably in the deployed terminal. Keep the explicit key-9 handler that completes the final token through `get_command()` and `set_command()`.
- Do not filter terminal history by command type. Arrow-up recall must include free-form chat questions as well as built-in commands; `history clear` remains the explicit removal mechanism.
- The plugin generates an otherwise unlabeled `.clipboard` textarea. Keep its command-input label and description/output relationships when changing terminal initialization.
- Keep `#term` programmatically focusable (`tabindex="-1"`) so the skip link moves keyboard focus, not only the viewport.
- WebLLM's npm version is fixed, but its default model and WASM config uses upstream-managed `main` URLs. Do not call model binaries pinned unless custom immutable revisions or self-hosted hashes are actually configured.
