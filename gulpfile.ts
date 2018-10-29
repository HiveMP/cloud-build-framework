import * as gulp from "gulp";
import { ConfigSchema } from "./src/configSchema";
import { mkdirpAsync } from "./src/mkdirp";
import { join, resolve } from "path";
import { execAsync } from "./src/execAsync";
import { existsSync } from "fs";
import { c } from "./src/coalesce";

const config = require("./config.json") as ConfigSchema;
const workingDirectory = join(__dirname, "build", config["build-id"]);

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

  // Fetch target branch.
  await execAsync(
    "git",
    ["fetch", "--depth=1", sourceUrl, c(config.branch, "master")],
    workingDirectory
  );

  // Checkout and switch to target branch.
  await execAsync(
    "git",
    ["checkout", "-fB", "master", "FETCH_HEAD"],
    workingDirectory
  );
});

gulp.task("build-ue4-custom", gulp.series("init-working-directory"));
