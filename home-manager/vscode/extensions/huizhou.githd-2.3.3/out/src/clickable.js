"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickableProvider = void 0;
const vs = require("vscode");
const tracer_1 = require("./tracer");
const utils_1 = require("./utils");
class ClickableProvider {
    constructor(_scheme) {
        this._scheme = _scheme;
        this._clickables = [];
        this._disposables = [];
        this._lastClickedItems = [];
        this._decoration = vs.window.createTextEditorDecorationType({
            cursor: 'pointer',
            textDecoration: 'underline'
        });
        this._disposables.push(vs.languages.registerHoverProvider({ scheme: _scheme }, this));
        this._disposables.push(this._decoration);
        vs.window.onDidChangeTextEditorSelection(event => {
            let editor = event.textEditor;
            if (editor && editor.document.uri.scheme === _scheme) {
                if (event.kind === vs.TextEditorSelectionChangeKind.Mouse) {
                    const pos = event.selections[0].anchor;
                    const clickable = this._clickables.find(e => {
                        return e.range.contains(pos);
                    });
                    if (clickable) {
                        this._onClicked(clickable, editor);
                    }
                }
            }
        }, null, this._disposables);
        vs.window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.uri.scheme === _scheme) {
                this._setDecorations(editor);
            }
        }, null, this._disposables);
        vs.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.scheme === _scheme) {
                this._setDecorations((0, utils_1.getTextEditor)(e.document));
            }
        }, null, this._disposables);
    }
    async provideHover(document, position) {
        const clickable = this._clickables.find(e => {
            return e.range.contains(position);
        });
        if (clickable && clickable.getHoverMessage) {
            const content = await clickable.getHoverMessage();
            return new vs.Hover(content);
        }
    }
    addClickable(clickable) {
        this._clickables.push(clickable);
    }
    removeClickable(range) {
        if (range) {
            [this._clickables, this._lastClickedItems].forEach(clickables => {
                const index = clickables.findIndex(e => {
                    return e.range.isEqual(range);
                });
                if (index !== -1) {
                    clickables.splice(index, 1);
                }
            });
        }
    }
    clear() {
        this._clickables = [];
        this._lastClickedItems = [];
    }
    dispose() {
        this._disposables.forEach(d => d.dispose());
    }
    _onClicked(clickable, editor) {
        if (clickable.clickedDecorationType) {
            editor.setDecorations(clickable.clickedDecorationType, [clickable.range]);
            const index = this._lastClickedItems.findIndex(e => {
                return e.clickedDecorationType === clickable.clickedDecorationType;
            });
            if (index !== -1) {
                this._lastClickedItems.splice(index, 1);
            }
            this._lastClickedItems.push(clickable);
        }
        clickable.callback();
    }
    _setDecorations(editor) {
        if (!editor || editor.document.uri.scheme !== this._scheme) {
            tracer_1.Tracer.warning(`Clickable: try to set decoration to wrong scheme: ${editor ? editor.document.uri.scheme : ''}`);
            return;
        }
        this._lastClickedItems.forEach(clickable => {
            if (clickable.clickedDecorationType) {
                editor.setDecorations(clickable.clickedDecorationType, [clickable.range]);
            }
        });
        editor.setDecorations(this._decoration, this._clickables.map(clickable => {
            return clickable.range;
        }));
    }
}
exports.ClickableProvider = ClickableProvider;
//# sourceMappingURL=clickable.js.map