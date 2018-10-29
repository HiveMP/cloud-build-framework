import * as gulp from "gulp";
import { ConfigSchema } from "./src/configSchema";
import { mkdirpAsync } from "./src/mkdirp";
import { join } from "path";
import { execAsync } from "./src/execAsync";
import { existsSync } from "fs";

const config = require("./config.example.json") as ConfigSchema;
const workingDirectory = join(__dirname, config["build-id"]);

gulp.task("init-working-directory", async () => {
  await mkdirpAsync(workingDirectory);
  if (existsSync(join(workingDirectory, ".git"))) {
    await execAsync("git", ["init"], workingDirectory);
  }

  // Fetch target branch.
  await execAsync(
    "git",
    ["fetch", config.source, config.branch],
    workingDirectory
  );
});

gulp.task("build-ue4-custom", gulp.series("init-working-directory"));

// Run the target task.
gulp.series(config["gulp-task"]);
