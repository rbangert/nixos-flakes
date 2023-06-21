"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoViewProvider = void 0;
const vs = require("vscode");
const utils_1 = require("./utils");
class InfoViewProvider {
    constructor(context, model, gitService) {
        this._infoDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.infoView.content')
        });
        this._pathDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.infoView.path')
        });
        this._oldLineDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.infoView.old')
        });
        this._newLineDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.infoView.new')
        });
        this._onDidChange = new vs.EventEmitter();
        context.subscriptions.push(vs.workspace.registerTextDocumentContentProvider(InfoViewProvider.scheme, this));
        vs.window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.uri.scheme === InfoViewProvider.scheme) {
                this._decorate(editor);
            }
        }, null, context.subscriptions);
        vs.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.scheme === InfoViewProvider.scheme) {
                this._decorate((0, utils_1.getTextEditor)(e.document));
            }
        }, null, context.subscriptions);
        model.onDidChangeFilesViewContext(async (context) => {
            if (context?.rightRef && !context.leftRef) {
                // It is not a diff of two commits so there will be a commit info update
                this.update(await gitService.getCommitDetails(context?.repo, context.rightRef, context.isStash ?? false));
            }
        }, null, context.subscriptions);
        context.subscriptions.push(this._onDidChange, this._infoDecoration, this._pathDecoration, this._oldLineDecoration, this._newLineDecoration);
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    provideTextDocumentContent(uri) {
        return this._content ?? '';
    }
    update(content) {
        this._content = content;
        this._onDidChange.fire(InfoViewProvider.defaultUri);
    }
    _decorate(editor) {
        if (editor && this._content) {
            let infoRanges = [];
            let pathRanges = [];
            let oldLineRange = [];
            let newLineRange = [];
            let diffStarted = false;
            let i = 0;
            this._content.split(/\r?\n/g).forEach(line => {
                if (line.substring(0, 6) == 'diff --') {
                    diffStarted = true;
                    (0, utils_1.decorateWithoutWhitespace)(pathRanges, line, i, 0);
                }
                else if (line.substring(0, 3) == '--- ') {
                    (0, utils_1.decorateWithoutWhitespace)(pathRanges, line, i, 0);
                }
                else if (line.substring(0, 3) == '+++ ') {
                    (0, utils_1.decorateWithoutWhitespace)(pathRanges, line, i, 0);
                }
                else if (line[0] == '-') {
                    (0, utils_1.decorateWithoutWhitespace)(oldLineRange, line, i, 0);
                }
                else if (line[0] == '+') {
                    (0, utils_1.decorateWithoutWhitespace)(newLineRange, line, i, 0);
                }
                else if (!diffStarted) {
                    (0, utils_1.decorateWithoutWhitespace)(infoRanges, line, i, 0);
                }
                ++i;
            });
            editor.setDecorations(this._infoDecoration, infoRanges);
            editor.setDecorations(this._pathDecoration, pathRanges);
            editor.setDecorations(this._oldLineDecoration, oldLineRange);
            editor.setDecorations(this._newLineDecoration, newLineRange);
        }
    }
}
exports.InfoViewProvider = InfoViewProvider;
InfoViewProvider.scheme = 'githd-line';
InfoViewProvider.defaultUri = vs.Uri.parse(InfoViewProvider.scheme + '://authority/Commit Info');
//# sourceMappingURL=infoViewProvider.js.map