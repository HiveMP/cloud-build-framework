import * as gulp from "gulp";
import { ConfigSchema } from "./src/configSchema";
import { mkdirpAsync } from "./src/mkdirp";
import { join, resolve } from "path";
import { execAsync, captureAsync } from "./src/execAsync";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  createWriteStream,
  createReadStream
} from "fs";
import { c } from "./src/coalesce";
import { ncpAsync } from "./src/ncpAsync";
import * as libxmljs from "libxmljs";
import * as decompress from "decompress";
import fetch from "node-fetch";

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
    await execAsync("git", ["reset", "--hard", "HEAD"], workingDirectory);
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

gulp.task("ue4-setup-deps", async () => {
  await execAsync(
    "Setup.bat",
    ["--force", "--exclude=Mac", "--exclude=Android", "--cache=C:\\.ue4-cache"],
    workingDirectory
  );
});

gulp.task("ue4-apply-env-fixups", async () => {
  await execAsync(
    "powershell",
    ["-ExecutionPolicy", "Bypass", join(__dirname, "scripts", "Fixups.ps1")],
    workingDirectory
  );
});

gulp.task("ue4-reset-options", async () => {
  await execAsync(
    "git",
    ["checkout", "HEAD", "--", "Engine/Build/InstalledEngineBuild.xml"],
    workingDirectory
  );
  await execAsync(
    "git",
    ["checkout", "HEAD", "--", "Engine/Build/InstalledEngineFilters.xml"],
    workingDirectory
  );
});

gulp.task("ue4-apply-patches", async () => {
  if (config["include-server"]) {
    let didPatch = false;
    for (const patchName of ["server-421", "server-420", "server-416"]) {
      try {
        await execAsync(
          "git",
          [
            "apply",
            "--ignore-whitespace",
            "--whitespace=nowarn",
            `../../patches/${patchName}.patch`
          ],
          workingDirectory
        );
        didPatch = true;
        break;
      } catch (err) {
        continue;
      }
    }
    if (!didPatch) {
      throw new Error("no server patch applied cleanly!");
    }
  } else {
    return Promise.resolve();
  }
});

gulp.task("ue4-update-options", async () => {
  const xmlPath = join(
    workingDirectory,
    "Engine/Build/InstalledEngineBuild.xml"
  );
  const xml = readFileSync(xmlPath, "utf-8");
  const data = libxmljs.parseXmlString(xml);

  for (const element of data.find("//*[name()='Option']")) {
    const nameAttr = element.attr("Name");
    const defaultValueAttr = element.attr("DefaultValue");
    for (const name in config.options) {
      if (nameAttr !== null && nameAttr.value() === name) {
        if (defaultValueAttr !== null) {
          console.log(
            `Set option ${nameAttr.value()}: ${defaultValueAttr.value()} -> ${
              config.options[name]
            }`
          );
          defaultValueAttr.value(config.options[name]);
        }
      }
    }
  }

  writeFileSync(xmlPath, data.toString(true));
});

gulp.task("ue4-build-engine", async () => {
  await execAsync(
    join("Engine", "Build", "BatchFiles", "RunUAT.bat"),
    [
      "BuildGraph",
      "-Script=Engine/Build/InstalledEngineBuild.xml",
      "-Target=Make Installed Build Win64"
    ],
    workingDirectory
  );
});

gulp.task("ue4-copy-extras", async () => {
  await ncpAsync(
    join(
      workingDirectory,
      "Engine",
      "Source",
      "ThirdParty",
      "Linux",
      "LibCxx",
      "include"
    ),
    join(
      workingDirectory,
      "LocalBuilds",
      "Engine",
      "Windows",
      "Engine",
      "Source",
      "ThirdParty",
      "Linux",
      "LibCxx",
      "include"
    ),
    {}
  );
  await ncpAsync(
    join(
      workingDirectory,
      "Engine",
      "Source",
      "ThirdParty",
      "Linux",
      "LibCxx",
      "lib"
    ),
    join(
      workingDirectory,
      "LocalBuilds",
      "Engine",
      "Windows",
      "Engine",
      "Source",
      "ThirdParty",
      "Linux",
      "LibCxx",
      "lib"
    ),
    {}
  );
});

gulp.task("ue4-copy-itchio-assets", async () => {});

gulp.task("ensure-butler-available", async () => {
  if (!existsSync(join(__dirname, "build", "butler.zip"))) {
    await mkdirpAsync(workingDirectory);
    console.log("no butler available, downloading...");
    const result = await fetch(
      "https://broth.itch.ovh/butler/windows-amd64/LATEST/archive/default"
    );
    await new Promise((resolve, reject) => {
      const dest = createWriteStream(join(__dirname, "build", "butler.zip"));
      result.body
        .pipe(dest)
        .on("error", reject)
        .on("finish", resolve);
    });
  }

  if (!existsSync(join(__dirname, "build", "butler.exe"))) {
    await decompress(
      join(__dirname, "build", "butler.zip"),
      join(__dirname, "build")
    );
  }
});

const outputDirectory = join(
  workingDirectory,
  "LocalBuilds",
  "Engine",
  "Windows"
);

gulp.task("write-version-file", async () => {
  const version = captureAsync("git", ["rev-parse", "HEAD"], workingDirectory);
  writeFileSync(join(outputDirectory, "Version.txt"), version);
});

gulp.task("ue4-copy-runtime-assets", async () => {
  await ncpAsync(join(__dirname, "assets"), outputDirectory, {
    clobber: false,
    stopOnErr: true
  });
});

gulp.task(
  "ue4-deployment",
  gulp.series(
    "write-version-file",
    "ue4-copy-runtime-assets",
    gulp.parallel(
      config.deployments.map(value => {
        if (value.type === "itch") {
          const pushToItchIo = async () => {
            await execAsync(
              join(__dirname, "build", "butler.exe"),
              ["push", ".", value.target],
              outputDirectory
            );
          };
          return gulp.series("ensure-butler-available", pushToItchIo);
        } else if (value.type === "local-copy") {
          const localCopyTask = async () => {
            try {
              await execAsync(
                "taskkill",
                ["/im", "SwarmAgent.exe", "/f"],
                outputDirectory
              );
            } catch {}
            try {
              // This tool has a non-standard exit code. TODO Check it properly.
              await execAsync(
                "robocopy",
                [".\\", value.target + "\\", "/MIR"],
                outputDirectory
              );
            } catch {}
          };
          return localCopyTask;
        } else {
          // Return a task that does nothing.
          return async () => {};
        }
      })
    )
  )
);

gulp.task("build-ue4-game", gulp.series("init-working-directory"));

gulp.task(
  "build-ue4-engine",
  gulp.series(
    "init-working-directory",
    "ue4-apply-env-fixups",
    "ue4-setup-deps",
    "ue4-reset-options",
    "ue4-apply-patches",
    "ue4-update-options",
    "ue4-build-engine",
    "ue4-copy-extras",
    "ue4-deployment"
  )
);

// Aliases for older targets.
gulp.task("build-ue4-custom", gulp.series("build-ue4-engine"));
gulp.task("build-custom-engine", gulp.series("build-ue4-engine"));
