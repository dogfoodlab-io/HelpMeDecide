import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const storagePath = join(tmpdir(), `helpmedecide-vitest-${process.pid}.json`);
const nodeMajor = Number(process.versions.node.split(".")[0]);
const nodeFlags = nodeMajor >= 25 ? [`--localstorage-file=${storagePath}`] : [];
const vitestCli = join(projectRoot, "node_modules/vitest/vitest.mjs");
const result = spawnSync(
  process.execPath,
  [...nodeFlags, vitestCli, "run", "--config", "vitest.config.ts", "src/app/DecisionBriefPanel.test.tsx", "src/app/A2uiPairwiseChoice.test.tsx", "src/app/PurchaseAlpha.test.tsx", "src/app/DecisionCatalog.test.tsx", "src/domain/exploration.test.ts", "src/domain/whatIf.test.ts"],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, ...nodeFlags].filter(Boolean).join(" "),
    },
  },
);
rmSync(storagePath, { force: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
