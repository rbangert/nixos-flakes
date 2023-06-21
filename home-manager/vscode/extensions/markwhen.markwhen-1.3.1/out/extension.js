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
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const timelineEditor_1 = require("./timelineEditor");
require("./semanticTokenProvider");
const semanticTokenProvider_1 = require("./semanticTokenProvider");
const command_preview = "markwhen.openPreview";
const command_viewInTimeline = "markwhen.viewInTimeline";
function activate(context) {
    const { providerRegistration, editor } = timelineEditor_1.MarkwhenTimelineEditorProvider.register(context);
    vscode.languages.registerDocumentSemanticTokensProvider({ language: "markwhen", scheme: "file" }, semanticTokenProvider_1.provider, semanticTokenProvider_1.legend);
    vscode.languages.registerHoverProvider("markwhen", editor);
    vscode.languages.registerFoldingRangeProvider("markwhen", editor);
    const previewHandler = () => {
        const active = vscode.window.activeTextEditor;
        if (!active) {
            return;
        }
        vscode.commands.executeCommand("vscode.openWith", active.document.uri, "markwhen.timeline", vscode.ViewColumn.Beside);
    };
    context.subscriptions.push(providerRegistration, vscode.commands.registerCommand(command_preview, previewHandler), vscode.commands.registerCommand(command_viewInTimeline, async (arg) => {
        if (!timelineEditor_1.webviewPanels.length) {
            const active = vscode.window.activeTextEditor;
            if (!active) {
                return;
            }
            await vscode.commands.executeCommand("vscode.openWith", active.document.uri, "markwhen.timeline", vscode.ViewColumn.Beside);
        }
        editor.viewInTimeline(arg);
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map