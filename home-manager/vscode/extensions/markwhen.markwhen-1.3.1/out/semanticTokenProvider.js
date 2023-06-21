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
exports.provider = exports.legend = void 0;
const vscode = __importStar(require("vscode"));
const parser_1 = require("@markwhen/parser");
const Types_1 = require("@markwhen/parser/lib/Types");
const tokenTypes = [
    "comment",
    "string",
    "function",
    "variable",
    "parameter",
    "property",
    "keyword",
    "type",
    "class"
];
exports.legend = new vscode.SemanticTokensLegend(tokenTypes, []);
exports.provider = {
    provideDocumentSemanticTokens(document) {
        const tokensBuilder = new vscode.SemanticTokensBuilder(exports.legend);
        const markwhen = (0, parser_1.parse)(document.getText());
        markwhen.timelines.forEach((timeline) => {
            timeline.ranges.forEach((range) => {
                const vscodeRange = new vscode.Range(range.lineFrom.line, range.lineFrom.index, range.lineTo.line, range.lineTo.index);
                switch (range.type) {
                    case Types_1.RangeType.Comment:
                        tokensBuilder.push(vscodeRange, "comment");
                        break;
                    case Types_1.RangeType.DateRange:
                        tokensBuilder.push(vscodeRange, "type");
                        break;
                    case Types_1.RangeType.Description:
                    case Types_1.RangeType.Section:
                    case Types_1.RangeType.Title:
                    case Types_1.RangeType.View:
                        tokensBuilder.push(vscodeRange, "keyword");
                        break;
                    case Types_1.RangeType.Tag:
                        tokensBuilder.push(vscodeRange, "property");
                    case Types_1.RangeType.Recurrence:
                        tokensBuilder.push(vscodeRange, "class");
                    default:
                        tokensBuilder.push(vscodeRange, "string");
                }
            });
        });
        return tokensBuilder.build();
    },
};
//# sourceMappingURL=semanticTokenProvider.js.map