"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkwhenTimelineEditorProvider = exports.localProcedureCall = exports.webviewPanels = void 0;
const parser_1 = require("@markwhen/parser");
const vscode = __importStar(require("vscode"));
const lpc_1 = require("./lpc");
const nonce_1 = require("./utilities/nonce");
exports.webviewPanels = [];
const getPanel = () => {
    return exports.webviewPanels[exports.webviewPanels.length - 1];
};
class MarkwhenTimelineEditorProvider {
    constructor(context) {
        this.context = context;
    }
    static register(context) {
        const provider = new MarkwhenTimelineEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(MarkwhenTimelineEditorProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
        });
        return { providerRegistration, editor: provider };
    }
    provideFoldingRanges(document, context, token) {
        const mw = (0, parser_1.parse)(document.getText());
        const ranges = [];
        for (const timeline of mw.timelines) {
            const indices = Object.keys(timeline.foldables);
            for (const index of indices) {
                // @ts-ignore
                const foldable = timeline.foldables[index];
                ranges.push(new vscode.FoldingRange(foldable.startLine, document.positionAt(foldable.endIndex).line, foldable.type === "section"
                    ? vscode.FoldingRangeKind.Region
                    : vscode.FoldingRangeKind.Comment));
            }
        }
        return ranges;
    }
    async provideHover(document, position, token) {
        const resp = await exports.localProcedureCall?.hoverFromEditor(document.offsetAt(position));
        if (!resp || !resp.params) {
            return null;
        }
        const viewInTimelineCommandUri = vscode.Uri.parse(`command:markwhen.viewInTimeline?${encodeURIComponent(JSON.stringify(resp.params))}`);
        const view = new vscode.MarkdownString(`[View in timeline](${viewInTimelineCommandUri})`);
        // To enable command URIs in Markdown content, you must set the `isTrusted` flag.
        // When creating trusted Markdown string, make sure to properly sanitize all the
        // input content so that only expected command URIs can be executed
        view.isTrusted = true;
        const rangeFrom = document.positionAt(resp.params.range.from);
        const rangeTo = document.positionAt(resp.params.range.to);
        return new vscode.Hover(view, new vscode.Range(rangeFrom, rangeTo));
    }
    viewInTimeline(...args) {
        const path = args[0].path;
        exports.localProcedureCall?.scrollTo(path);
    }
    async resolveCustomTextEditor(document, webviewPanel, token) {
        exports.webviewPanels.push(webviewPanel);
        getPanel().webview.options = {
            enableScripts: true,
        };
        getPanel().webview.html = this.getHtmlForWebview(webviewPanel.webview);
        const updateWebview = () => {
            exports.localProcedureCall?.updateWebviewText(document.getText());
        };
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });
        getPanel().onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
        const updateTextRequest = (text) => {
            this.setDocument(document, text);
        };
        const allowSource = async (src) => {
            const alreadyAllowed = this.context.globalState.get("allowedSources") || [];
            if (!src) {
                exports.localProcedureCall?.allowedSources(alreadyAllowed);
            }
            else {
                const newSet = Array.from(new Set([src, ...alreadyAllowed]));
                await this.context.globalState.update("allowedSources", newSet);
                exports.localProcedureCall?.allowedSources(newSet);
            }
        };
        const showInEditor = (location) => {
            const activeTextEditor = vscode.window.activeTextEditor;
            if (activeTextEditor) {
                const position = activeTextEditor.document.positionAt(location);
                activeTextEditor.selections = [
                    new vscode.Selection(position, position),
                ];
            }
        };
        exports.localProcedureCall = (0, lpc_1.lpc)(getPanel().webview, updateTextRequest, allowSource, showInEditor);
        updateWebview();
    }
    getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "assets", "index.js"));
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "assets", "index.css"));
        const nonce = (0, nonce_1.getNonce)();
        return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Markwhen</title>
				<meta 
          http-equiv="Content-Security-Policy" 
          content="default-src https://*.markwhen.com; img-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"
        >

        <script type="module" crossorigin src="${scriptUri}" nonce="${nonce}"></script>
        <link rel="stylesheet" href="${cssUri}">
      </head>
      <body>
        <div id="app" style="height: 100%"></div>
      </body>
    </html>
    `;
    }
    setDocument(document, timelineString) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), timelineString);
        return vscode.workspace.applyEdit(edit);
    }
}
exports.MarkwhenTimelineEditorProvider = MarkwhenTimelineEditorProvider;
MarkwhenTimelineEditorProvider.viewType = "markwhen.timeline";
//# sourceMappingURL=timelineEditor.js.map