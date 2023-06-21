"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  treeKill: () => treeKill
});
module.exports = __toCommonJS(src_exports);
var import_node_child_process = require("child_process");
var import_node_fs = require("fs");
var import_node_process = require("process");
function treeKill(pid, signal, callback) {
  const tree = /* @__PURE__ */ new Map();
  tree.set(pid, []);
  const pidsToProcess = /* @__PURE__ */ new Map();
  pidsToProcess.set(pid, 1);
  switch (process.platform) {
    case "win32":
      (0, import_node_child_process.exec)(`taskkill /pid ${pid.toString()} /T /F`, (error) => {
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
          return (0, import_node_child_process.spawn)(pathToPgrep(), ["-P", parentPid.toString()]);
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
          return (0, import_node_child_process.spawn)("ps", ["-o", "pid", "--no-headers", "--ppid", parentPid.toString()]);
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
    (0, import_node_process.kill)(pid, signal);
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
    pgrep = (0, import_node_fs.existsSync)("/usr/bin/pgrep") ? "/usr/bin/pgrep" : "pgrep";
  } catch (_) {
    pgrep = "pgrep";
  }
  return pgrep;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  treeKill
});
