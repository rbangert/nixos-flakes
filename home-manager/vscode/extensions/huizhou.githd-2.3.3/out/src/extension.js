"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const model_1 = require("./model");
const gitService_1 = require("./gitService");
const commands_1 = require("./commands");
const historyViewProvider_1 = require("./historyViewProvider");
const explorerViewProvider_1 = require("./explorerViewProvider");
const infoViewProvider_1 = require("./infoViewProvider");
const blameViewProvider_1 = require("./blameViewProvider");
function activate(context) {
    let gitService = new gitService_1.GitService(context);
    let model = new model_1.Model(context, gitService);
    let historyViewProvider = new historyViewProvider_1.HistoryViewProvider(context, model, gitService);
    let infoViewProvider = new infoViewProvider_1.InfoViewProvider(context, model, gitService);
    new explorerViewProvider_1.ExplorerViewProvider(context, model, gitService);
    new blameViewProvider_1.BlameViewProvider(context, model, gitService);
    new commands_1.CommandCenter(context, model, gitService, historyViewProvider, infoViewProvider);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map