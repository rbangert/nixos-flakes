// src/index.ts
import { exec, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { kill as killProcess } from "node:process";
function treeKill(pid, signal, callback) {
  const tree = /* @__PURE__ */ new Map();
  tree.set(pid, []);
  const pidsToProcess = /* @__PURE__ */ new Map();
  pidsToProcess.set(pid, 1);
  switch (process.platform) {
    case "win32":
      exec(`taskkill /pid ${pid.toString()} /T /F`, (error) => {
        if (callback === void 0) {
          return;
        }
        callback(error ?? void 0);
      });
      break;
    case "darwin":
      buildProcessTree(
        pid,
        tree,
        pidsToProcess,
        (parentPid) => {
          return spawn(pathToPgrep(), ["-P", parentPid.toString()]);
        },
        function() {
          killAll(tree, signal, callback);
        }
      );
      break;
    default:
      buildProcessTree(
        pid,
        tree,
        pidsToProcess,
        (parentPid) => {
          return spawn("ps", ["-o", "pid", "--no-headers", "--ppid", parentPid.toString()]);
        },
        () => {
          killAll(tree, signal, callback);
        }
      );
      break;
  }
}
function killAll(tree, signal, callback) {
  const killed = /* @__PURE__ */ new Map();
  try {
    for (const [pid, pids] of tree) {
      for (const pid2 of pids) {
        if (killed.get(pid2) !== void 0) {
          continue;
        }
        killPid(pid2, signal);
        killed.set(pid2, 1);
      }
      if (killed.get(pid) !== void 0) {
        continue;
      }
      killPid(pid, signal);
      killed.set(pid, 1);
    }
  } catch (error) {
    if (error instanceof Error && callback !== void 0) {
      return callback(error);
    }
    throw error;
  }
  if (callback !== void 0) {
    callback();
  }
}
function killPid(pid, signal) {
  try {
    killProcess(pid, signal);
  } catch (error) {
    if (error?.code === "ESRCH") {
      return;
    }
    throw error;
  }
}
function buildProcessTree(parentPid, tree, pidsToProcess, spawnChildProcessesList, cb) {
  const ps = spawnChildProcessesList(parentPid);
  let allData = "";
  ps.stdout.on("data", (v) => {
    const data = v.toString("ascii");
    allData += data;
  });
  ps.on("close", (code) => {
    pidsToProcess.delete(parentPid);
    if (code != 0) {
      if (pidsToProcess.size == 0) {
        cb();
      }
      return;
    }
    allData.match(/\d+/g)?.forEach((v) => {
      const pid = parseInt(v, 10);
      const pids = tree.get(parentPid);
      tree.set(parentPid, pids?.concat(pid) ?? []);
      tree.set(pid, []);
      pidsToProcess.set(pid, 1);
      buildProcessTree(pid, tree, pidsToProcess, spawnChildProcessesList, cb);
    });
  });
}
var pgrep;
function pathToPgrep() {
  if (pgrep !== void 0) {
    return pgrep;
  }
  try {
    pgrep = existsSync("/usr/bin/pgrep") ? "/usr/bin/pgrep" : "pgrep";
  } catch (_) {
    pgrep = "pgrep";
  }
  return pgrep;
}
export {
  treeKill
};
