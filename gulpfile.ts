import * as gulp from "gulp";
import { ConfigSchema } from "./src/configSchema";
import { mkdirpAsync } from "./src/mkdirp";
import { join, resolve } from "path";
import { execAsync, captureAsync } from "./src/execAsync";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { c } from "./src/coalesce";
import { ncpAsync } from "./src/ncpAsync";

const config = require("./config.json") as ConfigSchema;
const workingDirectory = join(__dirname, "build", config["build-id"]);
const refFile = join(__dirname, "build", config["build-id"] + ".ref-cache");

gulp.task("init-working-directory", async () => {
  await mkdirpAsync(workingDirectory);
  if (!existsSync(join(workingDirectory, ".git"))) {
    await execAsync("git", ["init"], workingDirectory);
  }

  let sourceUrl = config.source;
  if (sourceUrl.startsWith("./") || sourceUrl.startsWith("../")) {
    // This is a local file, need to convert to absolute path.
    sourceUrl = resolve(join(__dirname, sourceUrl));
  }

  const currentPointer = (await captureAsync(
    "git",
    ["ls-remote", sourceUrl, c(config.branch, "master")],
    workingDirectory
  )).trim();

  if (existsSync(refFile) && readFileSync(refFile, "utf8") === currentPointer) {
    console.log(
      "Working directory's current commit matches remote, not re-fetching..."
    );

    // Reset to current branch.
    await execAsync(
      "git",
      ["reset", "--progess", "--hard", "HEAD"],
      workingDirectory
    );
  } else {
    console.log("Working directory does not have current commit, fetching...");

    // Fetch target branch.
    await execAsync(
      "git",
      [
        "fetch",
        "--progress",
        "--depth=1",
        sourceUrl,
        c(config.branch, "master")
      ],
      workingDirectory
    );

    // Checkout and switch to target branch.
    await execAsync(
      "git",
      ["checkout", "--progress", "-fB", "build", "FETCH_HEAD"],
      workingDirectory
    );

    writeFileSync(refFile, currentPointer);
  }
});

gulp.task("ue4-copy-assets", async () => {
  await ncpAsync(join(__dirname, "assets"), workingDirectory, {
    clobber: false,
    stopOnErr: true
  });
});

gulp.task("ue4-apply-patches", async () => {
  await execAsync(
    "git",
    ["apply", join(__dirname, "patches", "patch-001.patch")],
    workingDirectory
  );
  await execAsync(
    "git",
    ["apply", join(__dirname, "patches", "patch-002.patch")],
    workingDirectory
  );
});

gulp.task("ue4-setup-deps", async () => {
  await execAsync("Setup.bat", ["--force"], workingDirectory);
});

gulp.task("ue4-apply-env-fixups", async () => {
  await execAsync(
    "powershell",
    [join(__dirname, "scripts", "Fixups.ps1")],
    workingDirectory
  );
});

gulp.task("ue4-build-engine", async () => {
  await execAsync(
    join("Engine", "Build", "BatchFiles", "RunUAT"),
    [
      "BuildGraph",
      "-Script=Engine/Build/InstalledEngineBuild.xml",
      "-Target=Make Installed Build Win64"
    ],
    workingDirectory
  );
});

gulp.task(
  "build-ue4-custom",
  gulp.series(
    "init-working-directory",
    "ue4-copy-assets",
    "ue4-apply-patches",
    "ue4-apply-env-fixups",
    "ue4-setup-deps",
    "ue4-build-engine"
  )
);
