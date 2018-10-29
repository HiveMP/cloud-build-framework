export interface ConfigSchema {
  "gulp-task": string;
  "build-id": string;
  branch: string;
  source: string;
  options: { [optionName: string]: string };
}
