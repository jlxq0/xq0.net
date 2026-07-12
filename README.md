# lindner.earth

Julian Lindner's personal site: https://www.lindner.earth/

The repository retains its `xq0.net` name for historical reasons. The canonical
host is `lindner.earth`, served as a static Caddy image with no active backend.

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
