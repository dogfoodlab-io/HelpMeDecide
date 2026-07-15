import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";

await rm("dist", { force: true, recursive: true });
await mkdir("dist/assets", { recursive: true });
await cp("public", "dist", { recursive: true });

const css = await readFile("src/styles.css", "utf8");
await writeFile("dist/assets/index.css", css);

await build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outfile: "dist/assets/index.js",
  format: "esm",
  jsx: "automatic",
  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
    ".css": "empty",
  },
  minify: true,
  sourcemap: false,
  target: ["es2020"],
});

await writeFile(
  "dist/index.html",
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
    <title>HelpMeDecide.ai</title>
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index.css" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
);
