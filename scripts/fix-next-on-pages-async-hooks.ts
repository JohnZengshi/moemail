import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const functionsDir = join(
  process.cwd(),
  ".vercel/output/static/_worker.js/__next-on-pages-dist__/functions"
);

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
};

const run = async () => {
  const targets = await walk(functionsDir);
  let updated = 0;

  for (const file of targets) {
    const content = await readFile(file, "utf8");
    const next = content.replace(/(["'])async_hooks\1/g, "$1node:async_hooks$1");

    if (next !== content) {
      await writeFile(file, next, "utf8");
      updated += 1;
    }
  }

  console.log(`Patched async_hooks imports in ${updated} file(s).`);
};

run().catch((error) => {
  console.error("Failed to patch next-on-pages output:", error);
  process.exit(1);
});
