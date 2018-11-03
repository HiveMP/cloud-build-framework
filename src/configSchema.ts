export interface ItchDeploymentSchema {
  type: "itch";
  target: string;
}

export interface LocalCopyDeploymentSchema {
  type: "local-copy";
  target: string;
}

export interface ConfigSchema {
  "gulp-task": string;
  "build-id": string;
  "include-server": boolean;
  branch: string;
  source: string;
  options: { [optionName: string]: string };
  deployments: (ItchDeploymentSchema | LocalCopyDeploymentSchema)[];
}
