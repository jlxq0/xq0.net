# lindner.earth

Julian Lindner's personal site: https://www.lindner.earth/

The repository retains its `xq0.net` name for historical reasons. The canonical
host is `lindner.earth`.

**The site is served from `oddie-apps/static-sites`, not from this repository.**
It was consolidated there on 2026-07-12; the `k8s/` manifests and the
`.forgejo/workflows/docker.yaml` push-to-deploy pipeline here describe a
deployment that no longer exists, and the copy of `index.html` in this tree is
behind the deployed one. Read the note at the top of `AGENTS.md` before building
or copying anything out of here.

## Development

The readable application source is `src/xq.js`. Browsers load the generated,
obfuscated `js/xq.js`; commit both whenever the source changes.

```sh
npm ci
npm run build
npm test
```

`npm run build` uses a pinned `javascript-obfuscator` version and fixed seed, so
the same source produces the same bundle. `npm run check` exits non-zero when
the committed bundle is stale. The Docker build runs the complete static test
suite before copying an explicit runtime asset allowlist into the final image;
`src/`, build scripts, tests, and dependencies are never served.
