'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    vscode.languages.registerDocumentFormattingEditProvider('yuck', {
        provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {

            let lines: Array<string> = [];
            let edits: Array<vscode.TextEdit> = [];

            for (let i = 0; i < document.lineCount; i++) {
                if (token.isCancellationRequested) {
                    return;
                }
                let line = document.lineAt(i);
                lines.push(line.text.trim());
            }

            let indents = 0;
            for (let i = 0; i < lines.length; i++) {
                if (token.isCancellationRequested) {
                    return;
                }
                let workingLine = lines[i]
                let openers = (workingLine.match(/\(/g) || []).length;
                let closers = (workingLine.match(/\)/g) || []).length;

                let replacementLine = "  ".repeat(indents) + workingLine;
                if (openers == 0 && closers > 0) {
                    replacementLine = "  ".repeat(indents - 1) + workingLine;
                }
                if (openers != closers) {
                    replacementLine = replacementLine.replace(/\)\s+?\)/, ')\n)');
                }
                edits.push(vscode.TextEdit.replace(document.lineAt(i).range, replacementLine));

                if (openers > closers) {
                    indents += openers - closers;
                } else if (closers > openers) {
                    indents -= closers - openers;
                }
            }

            return edits
        }
    });
}