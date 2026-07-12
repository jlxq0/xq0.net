import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";

import { bundlePath, createBundle, sourcePath } from "./obfuscate.mjs";

const bundle = createBundle();

mkdirSync(dirname(bundlePath), { recursive: true });
writeFileSync(bundlePath, bundle, "utf8");

process.stdout.write(
  `Built ${relative(process.cwd(), bundlePath)} from ${relative(process.cwd(), sourcePath)} (${Buffer.byteLength(bundle)} bytes)\n`
);
