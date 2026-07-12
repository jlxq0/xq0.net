import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import JavaScriptObfuscator from "javascript-obfuscator";

export const sourcePath = fileURLToPath(new URL("../src/xq.js", import.meta.url));
export const bundlePath = fileURLToPath(new URL("../js/xq.js", import.meta.url));

// A fixed seed makes source-to-bundle parity reproducible on every machine.
const options = Object.freeze({
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: "hexadecimal",
  numbersToExpressions: false,
  renameGlobals: false,
  seed: 4815162342,
  selfDefending: false,
  simplify: true,
  sourceMap: false,
  splitStrings: false,
  stringArray: true,
  stringArrayEncoding: [],
  stringArrayThreshold: 0.75,
  target: "browser",
  transformObjectKeys: false,
  unicodeEscapeSequence: false
});

export function readSource() {
  const source = readFileSync(sourcePath, "utf8");

  if (source.trim().length === 0) {
    throw new Error("src/xq.js is empty");
  }

  return source;
}

export function createBundle(source = readSource()) {
  const result = JavaScriptObfuscator.obfuscate(source, options);
  return `${result.getObfuscatedCode()}\n`;
}
