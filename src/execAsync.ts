import { spawn } from "child_process";

export async function execAsync(
  command: string,
  args: string[],
  cwd?: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log([command, ...args]);
    const cp = spawn(command, args, {
      cwd: cwd,
      stdio: ["ignore", process.stdout, process.stderr]
    });
    cp.on("exit", code => {
      if (code !== 0) {
        reject(new Error("Got exit code: " + code));
      } else {
        resolve();
      }
    });
  });
}
