import { ConfigSchema } from "./src/configSchema";

const config = require("./config.json") as ConfigSchema;

process.argv = ["node", "gulp", config["gulp-task"]];
const run = require("gulp-cli");
run();
