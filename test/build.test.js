const test = require("node:test");
const assert = require("node:assert/strict");
const { cp, mkdtemp, readFile, rm } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");

test("builds userscript and extension page from a path with spaces and percent signs", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "bilibili build% "));

  try {
    await Promise.all([
      cp(path.join(projectRoot, "scripts"), path.join(temporaryRoot, "scripts"), { recursive: true }),
      cp(path.join(projectRoot, "src"), path.join(temporaryRoot, "src"), { recursive: true }),
      cp(path.join(projectRoot, "package.json"), path.join(temporaryRoot, "package.json")),
      cp(path.join(projectRoot, "README.md"), path.join(temporaryRoot, "README.md")),
      cp(path.join(projectRoot, "README.en.md"), path.join(temporaryRoot, "README.en.md"))
    ]);

    const result = spawnSync(process.execPath, [path.join(temporaryRoot, "scripts", "build.mjs")], {
      cwd: os.tmpdir(),
      encoding: "utf8"
    });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

    const [userscript, extensionPage] = await Promise.all([
      readFile(path.join(temporaryRoot, "dist", "bilibili-accelerator.user.js"), "utf8"),
      readFile(path.join(temporaryRoot, "dist", "extension", "bili-accelerator.page.js"), "utf8")
    ]);

    assert.match(userscript, /Bilibili Accelerator/);
    assert.ok(extensionPage.length > 0);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
