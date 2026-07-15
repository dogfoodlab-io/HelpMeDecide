import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

await import("./build.mjs");

const [html, logo, favicon, hero, diagram] = await Promise.all([
  readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
  readFile(new URL("../dist/evidence-fold-mark.svg", import.meta.url)),
  readFile(new URL("../dist/favicon.svg", import.meta.url)),
  readFile(new URL("../dist/decision-atlas.jpg", import.meta.url)),
  readFile(new URL("../dist/decision-constellation.svg", import.meta.url)),
]);

assert.match(html, /href="\/favicon\.svg\?v=2"/);
assert.ok(logo.byteLength > 0);
assert.ok(favicon.byteLength > 0);
assert.ok(hero.byteLength > 0);
assert.ok(diagram.byteLength > 0);

console.log("ok - production build includes public assets");
