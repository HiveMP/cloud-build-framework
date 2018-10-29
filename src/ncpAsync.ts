import { ncp } from "ncp";

export function ncpAsync(source, destination, options) {
  return new Promise((resolve, reject) => {
    ncp(source, destination, options, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
