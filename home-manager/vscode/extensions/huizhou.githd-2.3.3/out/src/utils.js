"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPullRequest = exports.getTextEditor = exports.decorateWithoutWhitespace = void 0;
const vs = require("vscode");
function decorateWithoutWhitespace(ranges, target, line, offset) {
    let start = 0;
    let newWord = true;
    let i = 0;
    for (; i < target.length; ++i) {
        if (target[i] === ' ' || target[i] === '\t' || target[i] === '\n') {
            if (!newWord) {
                newWord = true;
                ranges.push(new vs.Range(line, offset + start, line, offset + i));
            }
        }
        else {
            if (newWord) {
                newWord = false;
                start = i;
            }
        }
    }
    if (!newWord) {
        ranges.push(new vs.Range(line, offset + start, line, offset + i));
    }
}
exports.decorateWithoutWhitespace = decorateWithoutWhitespace;
function getTextEditor(document) {
    return vs.window.visibleTextEditors.find(editor => editor.document === document);
}
exports.getTextEditor = getTextEditor;
// getRangeForPullRequest finds the pull request id and its start position in the content.
// The assumption is the PR id is represented by #123 in the subject.
function getPullRequest(content) {
    const found = content.match(/#[0-9]+/g);
    if (!found) {
        return ['', 0];
    }
    return [found[0], content.indexOf(found[0])];
}
exports.getPullRequest = getPullRequest;
//# sourceMappingURL=utils.js.map