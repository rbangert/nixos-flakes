"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlameViewProvider = void 0;
const vs = require("vscode");
const tracer_1 = require("./tracer");
const utils_1 = require("./utils");
const NotCommitted = `Not committed yet`;
class BlameViewStatProvider {
    constructor(_owner) {
        this._owner = _owner;
        this._disposables = [];
        this._disposables.push(vs.languages.registerHoverProvider({ scheme: 'file' }, this));
    }
    dispose() {
        vs.Disposable.from(...this._disposables).dispose();
    }
    provideHover(document, position) {
        if (!this._owner.isAvailable(document, position)) {
            return;
        }
        let markdown = new vs.MarkdownString(`*\`Committed Files\`*\r\n>\r\n`);
        markdown.appendCodeblock(this._owner.blame?.stat ?? '', 'txt');
        markdown.appendMarkdown('>');
        return new vs.Hover(markdown);
    }
}
class BlameViewProvider {
    constructor(context, model, _gitService) {
        this._gitService = _gitService;
        this._enabled = false;
        this._decoration = vs.window.createTextEditorDecorationType({
            after: {
                color: new vs.ThemeColor('githd.blameView.info'),
                fontStyle: 'italic'
            }
        });
        this.enabled = model.configuration.blameEnabled;
        this._statProvider = new BlameViewStatProvider(this);
        context.subscriptions.push(vs.languages.registerHoverProvider({ scheme: 'file' }, this), this._statProvider, this._decoration);
        vs.window.onDidChangeTextEditorSelection(e => {
            this._onDidChangeSelection(e.textEditor);
        }, null, context.subscriptions);
        vs.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                this._onDidChangeActiveTextEditor(editor);
            }
        }, null, context.subscriptions);
        vs.workspace.onDidChangeTextDocument(e => {
            this._onDidChangeTextDocument((0, utils_1.getTextEditor)(e.document));
        }, null, context.subscriptions);
        model.onDidChangeConfiguration(config => {
            this.enabled = config.blameEnabled;
        }, null, context.subscriptions);
    }
    set enabled(value) {
        if (this._enabled !== value) {
            tracer_1.Tracer.info(`Blame view: set enabled ${value}`);
            this._enabled = value;
        }
    }
    get blame() {
        return this._blame;
    }
    provideHover(document, position) {
        if (!this.isAvailable(document, position)) {
            return;
        }
        const blame = this._blame;
        if (!blame) {
            return;
        }
        return new Promise(async (resolve) => {
            const repo = await this._gitService.getGitRepo(blame.file.fsPath);
            const ref = blame.hash;
            const args = encodeURIComponent(JSON.stringify([repo, ref, blame.file]));
            const cmd = `[*${ref}*](command:githd.openCommit?${args} "Click to see commit details")`;
            let subject = blame.subject;
            const [pr, start] = (0, utils_1.getPullRequest)(blame.subject);
            if (pr) {
                subject =
                    subject.substring(0, start) +
                        `[*${pr}*](${repo?.remoteUrl}/pull/${pr.substring(1)})` +
                        subject.substring(start + pr.length);
            }
            tracer_1.Tracer.verbose(`Blame view: ${cmd}`);
            const content = `
${cmd}
*\`${blame.author}\`*
*\`${blame.email}\`*
*\`(${blame.date})\`*

${subject}

${blame.body}
>`;
            let markdown = new vs.MarkdownString(content);
            markdown.isTrusted = true;
            return resolve(new vs.Hover(markdown));
        });
    }
    isAvailable(doc, pos) {
        if (!this._enabled ||
            !this._blame?.hash ||
            doc.isDirty ||
            pos.line != this._blame?.line ||
            pos.character < doc.lineAt(this._blame.line).range.end.character ||
            doc.uri !== this._blame?.file) {
            return false;
        }
        return true;
    }
    async _onDidChangeSelection(editor) {
        if (!editor) {
            tracer_1.Tracer.info('_onDidChangeSelection with null or undefined editor');
            return;
        }
        const file = editor.document.uri;
        if (!this._enabled || file.scheme !== 'file' || editor.document.isDirty) {
            return;
        }
        tracer_1.Tracer.verbose('Blame view: onDidChangeSelection');
        const line = editor.selection.active.line;
        if (!this._blame || line != this._blame.line || file !== this._blame.file) {
            // this._blame = { file, line, stat: '' };
            this._clear(editor);
            clearTimeout(this._debouncing);
            this._debouncing = setTimeout(() => this._update(editor), 250);
        }
    }
    async _onDidChangeActiveTextEditor(editor) {
        if (!editor) {
            tracer_1.Tracer.info('_onDidChangeActiveTextEditor with null or undefined editor');
            return;
        }
        const file = editor.document.uri;
        if (!this._enabled || file.scheme !== 'file' || editor.document.isDirty) {
            return;
        }
        tracer_1.Tracer.verbose('Blame view: onDidChangeActiveTextEditor');
        this._clear(editor);
        this._update(editor);
    }
    async _onDidChangeTextDocument(editor) {
        if (!editor) {
            return;
        }
        const file = editor.document.uri;
        if (!this._enabled || file.scheme !== 'file') {
            return;
        }
        tracer_1.Tracer.verbose(`Blame view: onDidChange.TextDocument. isDirty ${editor.document.isDirty}`);
        this._clear(editor);
        if (!editor.document.isDirty) {
            this._update(editor);
        }
    }
    async _update(editor) {
        const file = editor.document.uri;
        const line = editor.selection.active.line;
        tracer_1.Tracer.verbose(`Try to update blame. ${file.fsPath}: ${line}`);
        this._blame = await this._gitService.getBlameItem(file, line);
        if (file !== editor.document.uri || line != editor.selection.active.line || editor.document.isDirty) {
            // git blame could take long time and the active line has changed
            tracer_1.Tracer.info(`This update is outdated. ${file.fsPath}: ${line}, dirty ${editor.document.isDirty}`);
            this._blame = undefined;
        }
        if (!this._blame) {
            return;
        }
        let contentText = '\u00a0\u00a0\u00a0\u00a0';
        if (this._blame?.hash) {
            contentText += `${this._blame.author} [${this._blame.relativeDate}]\u00a0\u2022\u00a0${this._blame.subject}`;
        }
        else {
            contentText += NotCommitted;
        }
        const options = {
            range: new vs.Range(line, Number.MAX_SAFE_INTEGER, line, Number.MAX_SAFE_INTEGER),
            renderOptions: { after: { contentText } }
        };
        editor.setDecorations(this._decoration, [options]);
    }
    _clear(editor) {
        this._blame = undefined;
        editor.setDecorations(this._decoration, []);
    }
}
exports.BlameViewProvider = BlameViewProvider;
//# sourceMappingURL=blameViewProvider.js.map