import mkdirp = require("mkdirp");

export function mkdirpAsync(dir: string) {
  return new Promise((resolve, reject) => {
    mkdirp(dir, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
