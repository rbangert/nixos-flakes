"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const vs = require("vscode");
const tracer_1 = require("./tracer");
function getConfiguration() {
    return {
        withFolder: vs.workspace.getConfiguration('githd.explorerView').get('withFolder'),
        commitsCount: vs.workspace.getConfiguration('githd.logView').get('commitsCount'),
        expressMode: vs.workspace.getConfiguration('githd.logView').get('expressMode'),
        displayExpress: vs.workspace.getConfiguration('githd.logView').get('displayExpressStatus'),
        blameEnabled: vs.workspace.getConfiguration('githd.blameView').get('enabled'),
        disabledInEditor: vs.workspace.getConfiguration('githd.editor').get('disabled'),
        traceLevel: vs.workspace.getConfiguration('githd').get('traceLevel')
    };
}
class Model {
    constructor(context, _gitService) {
        this._gitService = _gitService;
        this._onDidChangeConfiguration = new vs.EventEmitter();
        this._onDidChangeFilesViewContext = new vs.EventEmitter();
        this._onDidChangeHistoryViewContext = new vs.EventEmitter();
        this._config = getConfiguration();
        tracer_1.Tracer.level = this._config.traceLevel;
        vs.commands.executeCommand('setContext', 'disableInEditor', this._config.disabledInEditor);
        vs.workspace.onDidChangeConfiguration(() => {
            let newConfig = getConfiguration();
            if (newConfig.withFolder !== this._config.withFolder ||
                newConfig.commitsCount !== this._config.commitsCount ||
                newConfig.expressMode !== this._config.expressMode ||
                newConfig.displayExpress !== this._config.displayExpress ||
                newConfig.blameEnabled !== this._config.blameEnabled ||
                newConfig.disabledInEditor !== this._config.disabledInEditor ||
                newConfig.traceLevel !== this._config.traceLevel) {
                tracer_1.Tracer.info(`Model: configuration updated ${JSON.stringify(newConfig)}`);
                this._config = newConfig;
                this._onDidChangeConfiguration.fire(newConfig);
                tracer_1.Tracer.level = newConfig.traceLevel;
                vs.commands.executeCommand('setContext', 'disableInEditor', newConfig.disabledInEditor);
            }
        }, null, context.subscriptions);
        vs.workspace.onDidChangeWorkspaceFolders(e => {
            this._gitService.updateGitRoots(vs.workspace.workspaceFolders);
        }, null, context.subscriptions);
        this._gitService.updateGitRoots(vs.workspace.workspaceFolders);
        context.subscriptions.push(this._onDidChangeConfiguration, this._onDidChangeFilesViewContext, this._onDidChangeHistoryViewContext);
    }
    get configuration() {
        return this._config;
    }
    get filesViewContext() {
        return this._filesViewContext;
    }
    set filesViewContext(context) {
        tracer_1.Tracer.info(`Model: set filesViewContext - ${JSON.stringify(context)}`);
        if (!this._filesViewContext) {
            this._filesViewContext = context;
            this._onDidChangeFilesViewContext.fire(this._filesViewContext);
        }
        else if (this._filesViewContext.leftRef != context?.leftRef ||
            this._filesViewContext.rightRef != context?.rightRef ||
            this._filesViewContext.specifiedPath != context?.specifiedPath ||
            this._filesViewContext.focusedLineInfo != context?.focusedLineInfo) {
            this._filesViewContext = context;
            this._onDidChangeFilesViewContext.fire(this._filesViewContext);
        }
        vs.commands.executeCommand('workbench.view.extension.githd-explorer');
    }
    get historyViewContext() {
        return this._historyViewContext;
    }
    async setHistoryViewContext(context) {
        tracer_1.Tracer.info(`Model: set historyViewContext - ${JSON.stringify(context)}`);
        this._historyViewContext = context;
        if (this._historyViewContext && !this._historyViewContext?.branch) {
            this._historyViewContext.branch = (await this._gitService.getCurrentBranch(context?.repo)) ?? '';
        }
        this._onDidChangeHistoryViewContext.fire(this._historyViewContext);
    }
    get onDidChangeConfiguration() {
        return this._onDidChangeConfiguration.event;
    }
    get onDidChangeFilesViewContext() {
        return this._onDidChangeFilesViewContext.event;
    }
    get onDidChangeHistoryViewContext() {
        return this._onDidChangeHistoryViewContext.event;
    }
}
exports.Model = Model;
//# sourceMappingURL=model.js.map