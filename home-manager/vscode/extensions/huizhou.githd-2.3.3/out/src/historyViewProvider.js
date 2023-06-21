"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryViewProvider = void 0;
const vs = require("vscode");
const icons_1 = require("./icons");
const clickable_1 = require("./clickable");
const utils_1 = require("./utils");
const tracer_1 = require("./tracer");
const firstLoadingCount = 25;
const loadingPageSize = 300;
const stashTitleLabel = 'Git Stashes';
const titleLabel = 'Git History';
const moreLabel = '\u00b7\u00b7\u00b7';
const separatorLabel = '--------------------------------------------------------------';
const branchHoverMessage = new vs.MarkdownString('Select a branch to see its history');
const authorHoverMessage = new vs.MarkdownString('Select an author to see the commits');
const loadMoreHoverMessage = new vs.MarkdownString('Load more commits');
const prHoverMessage = new vs.MarkdownString('Click to see GitHub PR');
function getHistoryViewEditor() {
    return vs.window.visibleTextEditors.find(editor => editor.document.uri.scheme === HistoryViewProvider.scheme);
}
class HistoryViewProvider {
    constructor(context, _model, _gitService) {
        this._model = _model;
        this._gitService = _gitService;
        this._clickableProvider = new clickable_1.ClickableProvider(HistoryViewProvider.scheme);
        this._commitsCount = 200;
        this._content = '';
        this._logCount = 0;
        this._currentLine = 0;
        this._loadAll = false;
        this._updating = false;
        this._loadMoreClicked = false;
        this._leftCount = 0;
        this._totalCommitsCount = 0;
        this._onDidChange = new vs.EventEmitter();
        this._titleDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.title')
        });
        this._branchDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.branch')
        });
        this._fileDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.filePath')
        });
        this._subjectDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.subject')
        });
        this._hashDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.hash')
        });
        this._selectedHashDecoration = vs.window.createTextEditorDecorationType({
            backgroundColor: new vs.ThemeColor('merge.currentContentBackground'),
            isWholeLine: true,
            overviewRulerColor: 'darkgreen',
            overviewRulerLane: vs.OverviewRulerLane.Full
        });
        this._refDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.ref')
        });
        this._authorDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.author')
        });
        this._emailDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.email')
        });
        this._moreDecoration = vs.window.createTextEditorDecorationType({
            color: new vs.ThemeColor('githd.historyView.more')
        });
        this._loadingDecoration = vs.window.createTextEditorDecorationType({
            light: {
                after: {
                    contentIconPath: (0, icons_1.getIconUri)('loading', 'light')
                }
            },
            dark: {
                after: {
                    contentIconPath: (0, icons_1.getIconUri)('loading', 'dark')
                }
            }
        });
        this._titleDecorationOptions = [];
        this._subjectDecorationOptions = [];
        this._hashDecorationOptions = [];
        this._refDecorationOptions = [];
        this._authorDecorationOptions = [];
        this._emailDecorationOptions = [];
        this._repoStatusBar = vs.window.createStatusBarItem(undefined, 1);
        this._expressStatusBar = vs.window.createStatusBarItem(undefined, 2);
        this._express = false;
        tracer_1.Tracer.info('Creating history view');
        context.subscriptions.push(vs.workspace.registerTextDocumentContentProvider(HistoryViewProvider.scheme, this));
        this._expressStatusBar.command = 'githd.setExpressMode';
        this._expressStatusBar.tooltip = 'Turn on or off of the history view Express mode';
        this.express = this._model.configuration.expressMode;
        this.commitsCount = this._model.configuration.commitsCount;
        this._model.onDidChangeConfiguration(config => {
            this.commitsCount = config.commitsCount;
            this._updateExpressStatusBar();
        }, null, context.subscriptions);
        this._model.onDidChangeHistoryViewContext(context => {
            tracer_1.Tracer.verbose(`HistoryView: onDidChangeHistoryViewContext`);
            vs.workspace.openTextDocument(HistoryViewProvider.defaultUri).then(async (doc) => {
                vs.window.showTextDocument(doc, {
                    preview: false,
                    preserveFocus: true
                });
                this._loadMoreClicked = false;
                await this._updateContent(false);
                this._moveToTop(getHistoryViewEditor());
            });
        });
        this._gitService.onDidChangeGitRepositories(repos => {
            this._updateExpressStatusBar();
        });
        vs.window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.uri.scheme === HistoryViewProvider.scheme) {
                tracer_1.Tracer.verbose(`HistoryView: onDidChangeActiveTextEditor`);
                if (!this._updating) {
                    // If it's updating, _setDecorations will be called after it's updated.
                    this._setDecorations(editor);
                }
                this.repo = this._model.historyViewContext?.repo?.root;
            }
            else {
                this.repo = undefined;
            }
        }, null, context.subscriptions);
        vs.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.scheme === HistoryViewProvider.scheme) {
                tracer_1.Tracer.verbose('HistoryView: onDidChangeTextDocument');
                const editor = (0, utils_1.getTextEditor)(e.document);
                this._setDecorations(editor);
                if (this._leftCount > 0) {
                    this._updateContent(false);
                }
                else {
                    if (!this._loadMoreClicked) {
                        this._moveToTop(editor);
                    }
                    this._updating = false;
                }
            }
        }, null, context.subscriptions);
        vs.workspace.onDidCloseTextDocument(doc => {
            if (doc.uri.scheme === HistoryViewProvider.scheme) {
                tracer_1.Tracer.verbose('HistoryView: onDidCloseTextDocument');
                this._reset();
            }
        });
        this._updateExpressStatusBar();
        context.subscriptions.push(this._expressStatusBar, this._repoStatusBar, this._onDidChange, this._clickableProvider, this._titleDecoration, this._fileDecoration, this._subjectDecoration, this._hashDecoration, this._selectedHashDecoration, this._refDecoration, this._authorDecoration, this._emailDecoration, this._moreDecoration, this._branchDecoration, this._loadingDecoration);
        tracer_1.Tracer.info('History view created');
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    set loadAll(value) {
        this._loadAll = value;
    }
    get express() {
        return this._express;
    }
    set express(value) {
        this._express = value;
        this._expressStatusBar.text = 'githd: Express ' + (value ? 'On' : 'Off');
    }
    set commitsCount(count) {
        if ([100, 200, 300, 400, 500, 1000].findIndex(a => {
            return a === count;
        }) >= 0) {
            this._commitsCount = count;
        }
    }
    set repo(repo) {
        if (repo) {
            this._repoStatusBar.text = 'githd: Repository ' + repo;
            this._repoStatusBar.show();
        }
        else {
            this._repoStatusBar.hide();
        }
    }
    provideTextDocumentContent(uri) {
        tracer_1.Tracer.verbose(`HistoryView: provideTextDocumentContent length: ${this._content.length}`);
        return this._content;
    }
    _updateExpressStatusBar() {
        if (this._model.configuration.displayExpress && this._gitService.getGitRepos().length > 0) {
            this._expressStatusBar.show();
        }
        else {
            this._expressStatusBar.hide();
        }
    }
    _update() {
        tracer_1.Tracer.info(`HistoryView: _update`);
        this._onDidChange.fire(HistoryViewProvider.defaultUri);
    }
    // When start showing the history view page, we do two phase loading for better
    // user experience. Firstly, it displays the first firstLoadingCount entries.
    // Then, it displays the left ones right after the first displaying.
    async _updateContent(loadMore) {
        const context = this._model.historyViewContext;
        if (!context) {
            return;
        }
        tracer_1.Tracer.verbose(`HistoryView: left count ${this._leftCount}, current total count ${this._totalCommitsCount}, load more ${loadMore}`);
        this._updating = true;
        tracer_1.Tracer.info(`HistoryView: _updateContent. ${JSON.stringify(context)}`);
        const prevContent = this._content;
        const isStash = context.isStash ?? false;
        const firstLoading = this._leftCount == 0;
        let logCount = this._express ? 2 * firstLoadingCount : firstLoadingCount;
        if (firstLoading) {
            if (loadMore) {
                this._content = this._content.substring(0, this._content.length - moreLabel.length - 1);
                this._content += separatorLabel + '\n\n';
                this._currentLine += 2;
            }
            else {
                this._reset();
            }
            // No pagination loading for statsh, file history and line history.
            if (isStash || context.specifiedPath) {
                logCount = Number.MAX_SAFE_INTEGER;
            }
            else {
                const commitsCount = await this._gitService.getCommitsCount(context.repo, context.branch, context.author);
                let loadingCount = Math.min(commitsCount - this._logCount, this._commitsCount);
                if (this._loadAll) {
                    loadingCount = commitsCount - this._logCount;
                }
                this._leftCount = Math.max(0, loadingCount - firstLoadingCount);
                this._totalCommitsCount = commitsCount;
            }
        }
        else {
            logCount = this._express ? 5 * loadingPageSize : loadingPageSize;
            logCount = Math.min(logCount, this._leftCount);
            this._leftCount = this._leftCount - logCount;
        }
        const entries = await this._gitService.getLogEntries(context.repo, this._express, this._logCount, logCount, context.branch, context.isStash, context.specifiedPath, context.line, context.author);
        if (entries.length === 0) {
            this._reset();
            this._content = isStash ? 'No Stash' : 'No History';
            this._update();
            return;
        }
        let content = '';
        if (firstLoading && !loadMore) {
            this._reset();
            content = await this._updateTitleInfo(context);
        }
        // const hasMore = !firstLoading && !isStash && this._currentTotalCount > logCount + this._logCount;
        entries.forEach(entry => {
            ++this._logCount;
            content += this._updateSubject(entry.subject, context.repo.remoteUrl);
            content += this._updateInfo(context, entry, isStash);
            content += this._updateStat(context, entry);
            content += '\n';
            ++this._currentLine;
        });
        // All loadings are finished.
        if (this._leftCount == 0) {
            if (this._totalCommitsCount > this._logCount) {
                content += this._createClickableForMore();
            }
            else {
                this._moreClickableRange = undefined;
            }
            this._totalCommitsCount = 0;
        }
        this._content += content;
        if (this._content == prevContent) {
            this._setDecorations(getHistoryViewEditor());
            this._updating = false;
        }
        else {
            this._update();
        }
        this.repo = context.repo.root; // Update the status bar UI.
    }
    async _updateTitleInfo(context) {
        let content = context.isStash ? stashTitleLabel : titleLabel;
        (0, utils_1.decorateWithoutWhitespace)(this._titleDecorationOptions, content, 0, 0);
        if (context.isStash) {
            this._currentLine += 2;
            return content + ' \n\n';
        }
        if (context.specifiedPath) {
            content += ' of ';
            let start = content.length;
            content += await this._gitService.getGitRelativePath(context.specifiedPath);
            this._fileDecorationRange = new vs.Range(this._currentLine, start, this._currentLine, content.length);
            if (context.line) {
                content += ' at line ' + context.line;
            }
        }
        content += ' on ';
        this._branchDecorationRange = new vs.Range(0, content.length, 0, content.length + context.branch.length);
        this._clickableProvider.addClickable({
            range: this._branchDecorationRange,
            callback: () => vs.commands.executeCommand('githd.viewBranchHistory', context),
            getHoverMessage: () => branchHoverMessage
        });
        content += context.branch;
        content += ' by ';
        let author = context.author;
        if (!author) {
            content += 'all ';
            author = 'authors';
        }
        let start = content.length;
        content += author;
        let range = new vs.Range(this._currentLine, start, this._currentLine, content.length);
        this._emailDecorationOptions.push(range);
        this._clickableProvider.addClickable({
            range,
            callback: () => vs.commands.executeCommand('githd.viewAuthorHistory'),
            getHoverMessage: () => authorHoverMessage
        });
        this._currentLine += 2;
        return content + ' \n\n';
    }
    _updateSubject(subject, remoteUrl) {
        // PR link only works for github for now.
        if (remoteUrl.indexOf('github.com') > 0) {
            const [pr, start] = (0, utils_1.getPullRequest)(subject);
            if (pr) {
                // Only work for github PR url.
                const url = remoteUrl + '/pull/' + pr.substring(1);
                this._clickableProvider.addClickable({
                    range: new vs.Range(this._currentLine, start, this._currentLine, start + pr.length),
                    callback: () => {
                        vs.env.openExternal(vs.Uri.parse(url));
                    },
                    getHoverMessage: () => prHoverMessage
                });
            }
        }
        (0, utils_1.decorateWithoutWhitespace)(this._subjectDecorationOptions, subject, this._currentLine, 0);
        ++this._currentLine;
        return subject + '\n';
    }
    _updateInfo(context, entry, isStash) {
        let info = entry.hash;
        let range = new vs.Range(this._currentLine, 0, this._currentLine, info.length);
        this._hashDecorationOptions.push(range);
        this._clickableProvider.addClickable({
            range,
            callback: () => {
                this._model.filesViewContext = {
                    repo: context.repo,
                    isStash,
                    leftRef: undefined,
                    rightRef: entry.hash,
                    specifiedPath: context.specifiedPath,
                    focusedLineInfo: entry.lineInfo
                };
            },
            clickedDecorationType: this._selectedHashDecoration,
            getHoverMessage: async () => {
                const markdown = new vs.MarkdownString();
                const details = await this._gitService.getCommitDetails(context.repo, entry.hash, isStash);
                markdown.appendCodeblock(details, 'txt');
                return markdown;
            }
        });
        if (entry.ref) {
            let start = info.length;
            info += entry.ref;
            (0, utils_1.decorateWithoutWhitespace)(this._refDecorationOptions, entry.ref, this._currentLine, start);
        }
        if (entry.author) {
            info += ' by ';
            let start = info.length;
            info += entry.author;
            (0, utils_1.decorateWithoutWhitespace)(this._authorDecorationOptions, entry.author, this._currentLine, start);
        }
        if (entry.email) {
            info += ' <';
            let start = info.length;
            info += entry.email;
            range = new vs.Range(this._currentLine, start, this._currentLine, info.length);
            this._emailDecorationOptions.push(range);
            info += '>';
        }
        if (entry.date) {
            info += ', ';
            info += entry.date;
        }
        ++this._currentLine;
        return info + '\n';
    }
    _updateStat(context, entry) {
        if (!entry.stat) {
            return '';
        }
        let stat = entry.stat;
        if (context.specifiedPath) {
            stat = entry.stat.replace('1 file changed, ', '');
        }
        ++this._currentLine;
        return stat + '\n';
    }
    _createClickableForMore() {
        this._moreClickableRange = new vs.Range(this._currentLine, 0, this._currentLine, moreLabel.length);
        this._clickableProvider.addClickable({
            range: this._moreClickableRange,
            callback: () => {
                if (this._moreClickableRange) {
                    this._clickableProvider.removeClickable(this._moreClickableRange);
                    this._moreClickableRange = undefined;
                }
                this._loadMoreClicked = true;
                this._updateContent(true);
            },
            getHoverMessage: () => loadMoreHoverMessage
        });
        return moreLabel + ' '; // Add a space to avoid user clicking on it by accident.
    }
    _moveToTop(editor) {
        tracer_1.Tracer.verbose('HistoryView: _moveToTop');
        if (editor) {
            editor.selection = new vs.Selection(0, 0, 0, 0);
            editor.revealRange(new vs.Range(0, 0, 0, 0));
        }
    }
    _setDecorations(editor) {
        if (editor?.document.uri.scheme !== HistoryViewProvider.scheme) {
            tracer_1.Tracer.warning(`HistoryView: try to set decoration to wrong scheme: ${editor ? editor.document.uri.scheme : ''}`);
            return;
        }
        tracer_1.Tracer.verbose(`HistoryView: _setDecorations cnontent length: ${this._content.length}, _subjectDecorationOptions size: ${this._subjectDecorationOptions.length}`);
        if (!this._content) {
            tracer_1.Tracer.verbose('HistoryView: _loadingDecoration used');
            editor.setDecorations(this._loadingDecoration, [new vs.Range(0, 0, 0, 1)]);
            return;
        }
        editor.selection = new vs.Selection(0, 0, 0, 0);
        editor.setDecorations(this._loadingDecoration, []);
        editor.setDecorations(this._titleDecoration, this._titleDecorationOptions);
        editor.setDecorations(this._fileDecoration, this._fileDecorationRange ? [this._fileDecorationRange] : []);
        editor.setDecorations(this._branchDecoration, this._branchDecorationRange ? [this._branchDecorationRange] : []);
        editor.setDecorations(this._subjectDecoration, this._subjectDecorationOptions);
        editor.setDecorations(this._hashDecoration, this._hashDecorationOptions);
        editor.setDecorations(this._refDecoration, this._refDecorationOptions);
        editor.setDecorations(this._authorDecoration, this._authorDecorationOptions);
        editor.setDecorations(this._emailDecoration, this._emailDecorationOptions);
        editor.setDecorations(this._moreDecoration, this._moreClickableRange ? [this._moreClickableRange] : []);
    }
    _clearDecorations() {
        tracer_1.Tracer.verbose('HistoryView: _clearDecorations');
        this._clickableProvider.clear();
        this._moreClickableRange = undefined;
        this._titleDecorationOptions = [];
        this._fileDecorationRange = undefined;
        this._branchDecorationRange = undefined;
        this._subjectDecorationOptions = [];
        this._hashDecorationOptions = [];
        this._refDecorationOptions = [];
        this._authorDecorationOptions = [];
        this._emailDecorationOptions = [];
    }
    _reset() {
        tracer_1.Tracer.verbose('HistoryView: _reset');
        this._clearDecorations();
        this._content = '';
        this._logCount = 0;
        this._currentLine = 0;
    }
}
exports.HistoryViewProvider = HistoryViewProvider;
HistoryViewProvider.scheme = 'githd-logs';
HistoryViewProvider.defaultUri = vs.Uri.parse(HistoryViewProvider.scheme + '://authority/Git History');
//# sourceMappingURL=historyViewProvider.js.map