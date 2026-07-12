import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

import { bundlePath, createBundle, readSource } from "../scripts/obfuscate.mjs";

const root = resolve(import.meta.dirname, "..");
const applicationSource = readSource();
const requiredRuntimeFiles = [
  "CNAME",
  "Caddyfile",
  "css/crt.css",
  "css/jquery.terminal.css",
  "favicon.svg",
  "index.html",
  "js/jquery-1.7.1.min.js",
  "js/jquery.terminal-min.js",
  "js/profile.js",
  "js/xq.js",
  "pinterest-41d5c.html",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml"
];
const runtimeJavaScriptFiles = requiredRuntimeFiles.filter((path) => path.endsWith(".js"));

function sourceFunction(name) {
  const start = applicationSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `function ${name} must exist`);

  const nextFunction = applicationSource.indexOf("\n    function ", start + 1);
  return applicationSource.slice(start, nextFunction >= 0 ? nextFunction : undefined);
}

test("the obfuscator is deterministic", () => {
  const source = readSource();
  assert.equal(createBundle(source), createBundle(source));
});

test("the committed bundle is generated and current", () => {
  const source = readSource();
  const bundle = readFileSync(bundlePath, "utf8");

  assert.ok(bundle === createBundle(source), "js/xq.js is stale; run npm run build");
  assert.ok(bundle !== source, "js/xq.js must be obfuscated");
  assert.doesNotMatch(bundle, /sourceMappingURL/);
});

test("all runtime and discovery files exist", () => {
  for (const path of requiredRuntimeFiles) {
    assert.ok(existsSync(resolve(root, path)), `${path} must exist`);
  }
});

test("all runtime JavaScript parses", () => {
  for (const path of runtimeJavaScriptFiles) {
    const result = spawnSync(process.execPath, ["--check", resolve(root, path)], {
      encoding: "utf8"
    });

    assert.equal(result.status, 0, `${path} failed to parse:\n${result.stderr}`);
  }
});

test("legacy terminal history is parsed as data, never executable code", () => {
  const terminalSource = readFileSync(resolve(root, "js/jquery.terminal-min.js"), "utf8");
  const historyStart = terminalSource.indexOf("function la(d,k)");
  const historyEnd = terminalSource.indexOf("function da(d)", historyStart);
  const historyParser = terminalSource.slice(historyStart, historyEnd);

  assert.ok(historyStart >= 0 && historyEnd > historyStart, "history parser must exist");
  assert.match(historyParser, /JSON\.parse\(f\)/);
  assert.match(historyParser, /catch\(e\)\{f=\[\]\}/);
  assert.doesNotMatch(historyParser, /new Function\(|\beval\s*\(/);
});

test("the page loads only the generated application bundle", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const profilePosition = html.indexOf('./js/profile.js');
  const bundlePosition = html.indexOf('./js/xq.js');

  assert.match(html, /<script\s+src=["']\.\/js\/xq\.js["']/);
  assert.doesNotMatch(html, /src\/xq\.js|_xq_unscrambled\.js/);
  assert.ok(profilePosition >= 0, "index.html must load js/profile.js");
  assert.ok(profilePosition < bundlePosition, "profile data must load before js/xq.js");
});

test("the page does not add a persistent command rail", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");

  assert.doesNotMatch(html, /command-deck|data-command=/);
  assert.doesNotMatch(applicationSource, /\$\('\[data-command\]'\)/);
  assert.match(applicationSource, /onBlur: function\(\) \{ return false; \}/);
});

test("the terminal is not hidden behind a boot screen", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const css = readFileSync(resolve(root, "css/crt.css"), "utf8");

  assert.doesNotMatch(html, /boot-sequence|ENTER THE SWAN/);
  assert.doesNotMatch(css, /boot-sequence|boot-release|boot-line/);
});

test("the interactive terminal keeps the original CRT visual treatment", () => {
  const css = readFileSync(resolve(root, "css/crt.css"), "utf8");
  const terminalCss = readFileSync(resolve(root, "css/jquery.terminal.css"), "utf8");

  assert.match(css, /--crt-fg: #33ff66/);
  assert.match(css, /font-family: 'Menlo', 'Monaco', 'Courier New', monospace/);
  assert.match(css, /#term\.terminal[\s\S]*padding: 24px/);
  assert.match(terminalCss, /color: #007edf/);
  assert.doesNotMatch(css, /dossier-header h1|radial-gradient\(circle at 50% -20%/);
});

test("live announcements are scoped to output rather than the command editor", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const termTag = html.match(/<main id="term"[^>]*>/);

  assert.ok(termTag, "interactive terminal main must exist");
  assert.doesNotMatch(termTag[0], /aria-live/);
  assert.match(applicationSource, /\$\('#term > \.terminal-output'\)\.attr\(\{/);
  assert.match(applicationSource, /role: 'log'/);
  assert.match(applicationSource, /'aria-relevant': 'additions text'/);
  assert.match(applicationSource, /'aria-label': 'Terminal command input'/);
  assert.match(applicationSource, /'aria-controls': 'terminal-log'/);
});

test("Tab completes terminal commands", () => {
  assert.match(applicationSource, /tabcompletion: true/);
  assert.match(applicationSource, /completion: completeCommand/);
});

test("the progressive dossier contains every canonical project and contact", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(readFileSync(resolve(root, "js/profile.js"), "utf8"), context);

  for (const project of context.window.LINDNER_PROFILE.projects) {
    assert.ok(html.includes(project.name), `index.html must include ${project.name}`);
    assert.ok(html.includes(project.url), `index.html must include ${project.url}`);
  }
  for (const contact of context.window.LINDNER_PROFILE.contacts) {
    assert.ok(html.includes(contact.value), `index.html must include ${contact.value}`);
  }
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, "inline event handlers are not allowed");
  assert.match(html, /<main id="term" tabindex="-1"/, "skip target must be focusable");
});

test("project dossiers do not claim an unverified activity status", () => {
  const dossier = sourceFunction("projectDossier");
  const html = readFileSync(resolve(root, "index.html"), "utf8");

  assert.doesNotMatch(dossier, /Status:\s+current/);
  assert.match(html, /Projects and archives/);
  assert.doesNotMatch(html, /Active signals/);
});

test("the runtime image uses an explicit asset allowlist", () => {
  const dockerfile = readFileSync(resolve(root, "Dockerfile"), "utf8");
  const runtimeStage = dockerfile.slice(dockerfile.lastIndexOf("\nFROM "));

  assert.doesNotMatch(dockerfile, /^COPY\s+(?:\.\/?|js\/?|src\/?)(?:\s|$)/m);
  assert.doesNotMatch(dockerfile, /_xq_unscrambled|\/srv\/src/);
  assert.doesNotMatch(
    runtimeStage,
    /\/build\/(?:src|scripts|test|node_modules|package(?:-lock)?\.json)/
  );

  for (const path of requiredRuntimeFiles) {
    assert.match(dockerfile, new RegExp(path.replaceAll(".", "\\.")));
  }
});

test("security headers allow only the intended client-side uplinks", () => {
  const caddyfile = readFileSync(resolve(root, "Caddyfile"), "utf8");
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

  assert.ok(jsonLd, "index.html must contain JSON-LD");
  const hash = createHash("sha256").update(jsonLd[1]).digest("base64");
  assert.ok(caddyfile.includes(`'sha256-${hash}'`), "CSP must allow the exact JSON-LD block");
  assert.match(caddyfile, /Content-Security-Policy/);
  assert.match(caddyfile, /frame-ancestors 'none'/);
  assert.match(caddyfile, /https:\/\/mastodon\.kampong\.social/);
  assert.match(caddyfile, /https:\/\/huggingface\.co/);
  assert.match(caddyfile, /'wasm-unsafe-eval'/);
  assert.doesNotMatch(caddyfile, /'unsafe-inline'|'unsafe-eval'/);
});

test("chat uses one consent gate and the direct WebLLM engine", () => {
  assert.match(applicationSource, /chatState = 'awaiting-consent'/);
  assert.match(applicationSource, /Download and run it\? \[y\/n\]/);
  assert.match(applicationSource, /CreateMLCEngine\(chatModelId/);
  assert.doesNotMatch(applicationSource, /awaiting-fallback|CHAT_WORKER|CreateWebWorkerMLCEngine|requestAdapter\(\)/);
});

test("Tab completion and the executable easter egg are functional", () => {
  assert.match(applicationSource, /tabcompletion: true/);
  assert.match(applicationSource, /completion: completeCommand/);
  assert.match(applicationSource, /'\.\/please-execute'/);
  assert.match(applicationSource, /function runPleaseExecute\(term\)/);
  assert.match(applicationSource, /term\.pause\(\)[\s\S]*term\.resume\(\)/);
});

test("chat cannot be disabled or persisted across tab sessions", () => {
  assert.doesNotMatch(applicationSource, /chat\s+off/i);
  assert.doesNotMatch(applicationSource, /xq_chat/);
});

test("free-form questions are excluded from persistent terminal history", () => {
  const remember = sourceFunction("rememberCommand");
  const sanitize = sourceFunction("sanitizeStoredHistory");

  assert.match(remember, /help/);
  assert.match(remember, /history clear/);
  assert.match(applicationSource, /historyFilter: rememberCommand/);
  assert.match(applicationSource, /term\.history\(\)\.clear\(\)/);
  assert.match(sanitize, /\$\.grep\(saved, rememberCommand\)/);
  assert.match(applicationSource, /sanitizeStoredHistory\(term\)/);
  assert.doesNotMatch(remember, /chat/);
});

test("the privacy command stays concise and accurate", () => {
  const privacy = sourceFunction("renderPrivacy");

  assert.match(privacy, /static site with no analytics or chat backend/);
  assert.match(privacy, /runs locally in your browser/);
  assert.match(privacy, /history clear/);
  assert.doesNotMatch(privacy, /DHARMA|LOCAL OPERATION|Public file:/);
});

test("entering the numbers disables the countdown instead of restarting it", () => {
  assert.match(applicationSource, /function disableCountdown\(\)/);
  assert.match(applicationSource, /clearInterval\(countdownInterval\)/);
  assert.match(applicationSource, /\$\('#countdown'\)\.remove\(\)/);
  assert.match(applicationSource, /Countdown disabled\./);
  assert.doesNotMatch(applicationSource, /function resetCountdown\(|Countdown reset\./);
});
