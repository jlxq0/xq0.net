# lindner.earth

## ★ This repository is not what deploys the site

The live `www.lindner.earth` is served by **`oddie-apps/static-sites`**, from its
vendored copy at `sites/www.lindner.earth/`, behind the anycast edges. This
repository was consolidated into it on 2026-07-12 and has been behind ever since.

**Do not copy a build from here over the live copy.** `index.html` here is 8,638
bytes; the deployed one is 9,516, and the difference is two changes made only in
`static-sites`:

- the Plausible tag (`static-sites` `252859d`, 2026-08-12) — `<script defer
  data-domain="lindner.earth" src="https://stats.oddie.app/js/script.js">`,
  together with the note that `data-domain` must match a Plausible site exactly
  or every event is discarded server-side with no visible error, and that this
  host's stricter CSP needs `stats.oddie.app` in **both** `script-src` and
  `connect-src` — `script-src` alone loads the file and then `connect-src` blocks
  every event, which looks exactly like "no visitors";
- `?v=1` cache-busting on the css and js references (`599e711`, 2026-07-12).

Overwriting the deployed copy with a build from this tree removes both, silently.

Two more things in this tree describe a deployment that no longer exists:

- **`k8s/`** declares a `lindner-web` Deployment in namespace `web`. It is not on
  the cluster — `kubectl get deploy -n web` returns `static-sites` and nothing
  else — and no ArgoCD Application references this repository.
- **`.forgejo/workflows/docker.yaml`** is a complete push-to-deploy pipeline:
  build the image, self-bump the tag in `k8s/deployment.yaml`, let ArgoCD roll it
  out. The first two steps still work. The third has nothing to roll out. Pushing
  content here builds an image, commits a tag bump to `main`, and changes nothing
  anyone can see. The head commit of this repository is that self-bump, from
  2026-07-12; the images are in the registry, all dated that day, deployed
  nowhere.

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
- `js/xq.js` is generated. Edit `src/xq.js`, then run `npm run build` and commit both source and output. That keeps this repository self-consistent; it does **not** deploy anything — see the note at the top of this file.
- The bundled jQuery Terminal version once deserialized local history with `new Function`. Keep the `JSON.parse` patch and its CSP regression test; executable-string parsing breaks strict CSP and turns browser storage into code.
- jQuery Terminal conflates outside-click blur with an intentional pause. Keep `onBlur` returning `false`, stop quick-command click propagation, and never restore focus when `term.paused()` was already true or a model generation can be interrupted.
- Never put `aria-live` on `#term`; the command editor mutates on every keystroke. Scope live/log semantics to the generated `.terminal-output` element only.
- The legacy plugin's optional `tabcompletion` callback did not work reliably in the deployed terminal. Keep the explicit key-9 handler that completes the final token through `get_command()` and `set_command()`.
- Do not filter terminal history by command type. Arrow-up recall must include free-form chat questions as well as built-in commands; `history clear` remains the explicit removal mechanism.
- The plugin generates an otherwise unlabeled `.clipboard` textarea. Keep its command-input label and description/output relationships when changing terminal initialization.
- Keep `#term` programmatically focusable (`tabindex="-1"`) so the skip link moves keyboard focus, not only the viewport.
- WebLLM's npm version is fixed, but its default model and WASM config uses upstream-managed `main` URLs. Do not call model binaries pinned unless custom immutable revisions or self-hosted hashes are actually configured.
