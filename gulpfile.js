eval(
  require("typescript").transpile(
    require("fs")
      .readFileSync("./gulpfile.ts")
      .toString()
  )
);
