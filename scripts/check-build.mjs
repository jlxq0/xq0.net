import { existsSync, readFileSync } from "node:fs";
import { relative } from "node:path";

import { bundlePath, createBundle, sourcePath } from "./obfuscate.mjs";

if (!existsSync(bundlePath)) {
  process.stderr.write(
    `${relative(process.cwd(), bundlePath)} is missing; run npm run build\n`
  );
  process.exit(1);
}

const expected = createBundle();
const actual = readFileSync(bundlePath, "utf8");

if (actual !== expected) {
  process.stderr.write(
    `${relative(process.cwd(), bundlePath)} is stale relative to ${relative(process.cwd(), sourcePath)}; run npm run build and commit the result\n`
  );
  process.exit(1);
}

process.stdout.write(`${relative(process.cwd(), bundlePath)} is current\n`);
