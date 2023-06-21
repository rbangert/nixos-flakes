"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandCenter = void 0;
const path = require("path");
const assert = require("assert");
const vs = require("vscode");
const infoViewProvider_1 = require("./infoViewProvider");
const gitService_1 = require("./gitService");
const tracer_1 = require("./tracer");
function toGitUri(uri, ref) {
    return uri.with({
        scheme: 'git',
        path: uri.path,
        query: JSON.stringify({
            path: uri.fsPath,
            ref
        })
    });
}
async function selectBranch(gitService, repo, allowEnterSha) {
    const refs = await gitService.getRefs(repo);
    const items = refs.map(ref => {
        let description;
        if (ref.type === gitService_1.GitRefType.Head) {
            description = ref.commit;
        }
        else if (ref.type === gitService_1.GitRefType.Tag) {
            description = `Tag at ${ref.commit}`;
        }
        else if (ref.type === gitService_1.GitRefType.RemoteHead) {
            description = `Remote branch at ${ref.commit}`;
        }
        return { label: ref.name || ref.commit, description };
    });
    if (allowEnterSha)
        items.unshift(new EnterShaPickItem());
    return items;
}
async function branchCombination(gitService, repo) {
    const refs = (await gitService.getRefs(repo)).filter(ref => {
        return ref.type != gitService_1.GitRefType.Tag;
    });
    const localRefs = refs.filter(ref => {
        return ref.type != gitService_1.GitRefType.RemoteHead;
    });
    let items = [];
    localRefs.forEach(source => {
        refs.forEach(target => {
            if (source.name != target.name && source.commit != target.commit) {
                items.push({
                    label: `${source.name || source.commit} .. ${target.name || target.commit}`
                });
            }
        });
    });
    return items;
}
class EnterShaPickItem {
    constructor() {
        this.label = 'Enter commit SHA';
        this.description = '';
        this.openShaTextBox = true;
    }
}
async function selectGitRepo(gitService) {
    const repos = gitService.getGitRepos();
    if (repos.length === 0) {
        return;
    }
    if (repos.length === 1) {
        return repos[0];
    }
    const pickItems = repos.map(repo => {
        return { label: path.basename(repo.root), description: repo.root, repo };
    });
    const item = await vs.window.showQuickPick(pickItems, {
        placeHolder: 'Select the git repo'
    });
    return item?.repo;
}
async function getRefFromQuickPickItem(item, inputBoxTitle) {
    return item.openShaTextBox ? await vs.window.showInputBox({ prompt: inputBoxTitle }) : item.label;
}
async function selectAuthor(gitService, repo) {
    let authors = await gitService.getAuthors(repo);
    authors.unshift({ name: 'All', email: '' });
    return authors.map(author => {
        return { label: author.name, description: author.email };
    });
}
const Commands = [];
function command(id) {
    return function (_target, _key, descriptor) {
        if (!(typeof descriptor.value === 'function')) {
            throw new Error('not supported');
        }
        Commands.push({ id, method: descriptor.value });
    };
}
class CommandCenter {
    constructor(context, _model, _gitService, _historyView, _infoView) {
        this._model = _model;
        this._gitService = _gitService;
        this._historyView = _historyView;
        this._infoView = _infoView;
        context.subscriptions.push(...Commands.map(({ id, method }) => {
            return vs.commands.registerCommand(id, (...args) => {
                Promise.resolve(method.apply(this, args));
            });
        }));
    }
    async clear() {
        tracer_1.Tracer.verbose('Command: githd.clear');
        this._model.filesViewContext = undefined;
    }
    async viewHistory() {
        tracer_1.Tracer.verbose('Command: githd.viewHistory');
        const repo = await selectGitRepo(this._gitService);
        if (repo) {
            this._viewHistory({ repo, branch: '' });
        }
    }
    async viewFileHistory(specifiedPath = vs.window.activeTextEditor?.document?.uri) {
        tracer_1.Tracer.verbose('Command: githd.viewFileHistory');
        if (!specifiedPath) {
            return;
        }
        let repo = await this._gitService.getGitRepo(specifiedPath.fsPath);
        if (!repo) {
            return;
        }
        return this._viewHistory({ specifiedPath, repo, branch: '' });
    }
    async viewFolderHistory(specifiedPath) {
        tracer_1.Tracer.verbose('Command: githd.viewFolderHistory');
        return this.viewFileHistory(specifiedPath);
    }
    async viewLineHistory(file = vs.window.activeTextEditor?.document?.uri) {
        tracer_1.Tracer.verbose('Command: githd.viewLineHistory');
        if (!file) {
            return;
        }
        let repo = await this._gitService.getGitRepo(file.fsPath);
        if (!repo) {
            return;
        }
        let line = vs.window.activeTextEditor?.selection?.active?.line;
        if (!line) {
            return;
        }
        line++;
        return this._viewHistory({ specifiedPath: file, line, repo, branch: '' });
    }
    async viewAllHistory() {
        tracer_1.Tracer.verbose('Command: githd.viewAllHistory');
        let context = this._model.historyViewContext ?? {
            repo: this._gitService.getGitRepos()[0],
            branch: ''
        };
        return this._viewHistory(context, true);
    }
    async viewBranchHistory(context) {
        tracer_1.Tracer.verbose('Command: githd.viewBranchHistory');
        let placeHolder = `Select a ref to see it's history`;
        let repo;
        if (context) {
            repo = context.repo;
            const specifiedPath = this._model.historyViewContext?.specifiedPath;
            if (specifiedPath) {
                placeHolder += ` of ${path.basename(specifiedPath.fsPath)}`;
            }
        }
        else {
            const selected = await selectGitRepo(this._gitService);
            if (!selected) {
                return;
            }
            repo = selected;
        }
        placeHolder += ` (${repo.root})`;
        vs.window.showQuickPick(selectBranch(this._gitService, repo), { placeHolder }).then(item => {
            if (item) {
                if (context) {
                    context.branch = item.label;
                    this._viewHistory(context);
                }
                else {
                    this._viewHistory({ branch: item.label, repo });
                }
            }
        });
    }
    async viewAuthorHistory() {
        tracer_1.Tracer.verbose('Command: githd.viewAuthorHistory');
        assert(this._model.historyViewContext, 'history view context should exist');
        const context = this._model.historyViewContext;
        let placeHolder = `Select a author to see his/her commits`;
        vs.window
            .showQuickPick(selectAuthor(this._gitService, context.repo), {
            placeHolder
        })
            .then(item => {
            if (item) {
                const email = item.description;
                let context = this._model.historyViewContext;
                if (context) {
                    context.author = email;
                    this._viewHistory(context);
                }
            }
        });
    }
    async viewStashes() {
        tracer_1.Tracer.verbose('Command: githd.viewStashes');
        const repo = await selectGitRepo(this._gitService);
        if (repo) {
            this._viewHistory({ repo, isStash: true, branch: '' });
        }
    }
    async diffBranch() {
        tracer_1.Tracer.verbose('Command: githd.diffBranch');
        const repo = await selectGitRepo(this._gitService);
        if (!repo) {
            return;
        }
        this._diffSelections({ repo });
    }
    async diffFile(specifiedPath) {
        tracer_1.Tracer.verbose('Command: githd.diffFile');
        return this._diffPath(specifiedPath);
    }
    async diffFolder(specifiedPath) {
        tracer_1.Tracer.verbose('Command: githd.diffFolder');
        return this._diffPath(specifiedPath);
    }
    async inputRef() {
        tracer_1.Tracer.verbose('Command: githd.inputRef');
        const repo = await selectGitRepo(this._gitService);
        if (!repo) {
            return;
        }
        vs.window
            .showInputBox({
            placeHolder: `Input a ref(sha1) to see it's committed files`
        })
            .then(ref => (this._model.filesViewContext = { rightRef: ref?.trim(), repo }));
    }
    async openCommit(repo, ref, specifiedPath) {
        tracer_1.Tracer.verbose('Command: githd.openCommit');
        this._model.filesViewContext = { rightRef: ref, repo, specifiedPath };
    }
    async openCommittedFile(file) {
        tracer_1.Tracer.verbose('Command: githd.openCommittedFile');
        let rightRef = this._model.filesViewContext?.rightRef;
        let leftRef = rightRef + '~';
        let title = rightRef;
        if (this._model.filesViewContext?.leftRef) {
            leftRef = this._model.filesViewContext.leftRef;
            title = `${leftRef} .. ${rightRef}`;
        }
        vs.commands.executeCommand('vscode.diff', toGitUri(file.oldFileUri, leftRef), toGitUri(file.fileUri, rightRef), title + ' | ' + path.basename(file.gitRelativePath), { preview: true });
    }
    async openCommitInfo(content) {
        tracer_1.Tracer.verbose('Command: githd.openCommitInfo');
        this._infoView.update(content);
        vs.workspace
            .openTextDocument(infoViewProvider_1.InfoViewProvider.defaultUri)
            .then(doc => vs.window
            .showTextDocument(doc, { preview: true, preserveFocus: true })
            .then(() => vs.commands.executeCommand('cursorTop')));
    }
    async diffUncommittedFile(file = vs.window.activeTextEditor?.document?.uri) {
        if (!file) {
            return;
        }
        tracer_1.Tracer.verbose('Command: githd.diffUncommittedFile');
        const repo = await this._gitService.getGitRepo(file.fsPath);
        if (!repo) {
            return;
        }
        vs.window
            .showQuickPick(selectBranch(this._gitService, repo), {
            placeHolder: `Select a ref to see the diff with local copy of ${path.basename(file.path)}`
        })
            .then(async (item) => {
            if (item) {
                return await vs.commands.executeCommand('vscode.diff', toGitUri(file, item.label), file, `${item.label} .. Uncommitted (${path.basename(file.path)})`, { preview: true });
            }
        });
    }
    async setExpressMode() {
        tracer_1.Tracer.verbose('Command: githd.setExpressMode');
        this._historyView.express = !this._historyView.express;
    }
    async _viewHistory(context, all = false) {
        this._historyView.loadAll = all;
        await this._model.setHistoryViewContext(context);
    }
    async _diffPath(specifiedPath) {
        if (specifiedPath) {
            const repo = await this._gitService.getGitRepo(specifiedPath.fsPath);
            if (repo) {
                this._diffSelections({ repo, specifiedPath });
            }
        }
    }
    async _diffSelections({ repo, specifiedPath }) {
        const branches = await selectBranch(this._gitService, repo, true);
        const branchWithCombination = await branchCombination(this._gitService, repo);
        const items = [...branches, ...branchWithCombination];
        const currentRef = await this._gitService.getCurrentBranch(repo);
        const placeHolder = `Select a ref to see it's diff with ${currentRef} or select two refs to see their diffs`;
        vs.window.showQuickPick(items, { placeHolder: placeHolder }).then(async (item) => {
            if (!item) {
                return;
            }
            let leftRef = await getRefFromQuickPickItem(item, `Input a ref(sha1) to compare with ${currentRef} or ` + `'ref(sha1) .. ref(sha2)' to compare with two commits`);
            let rightRef = currentRef;
            if (!leftRef) {
                return;
            }
            if (leftRef.indexOf('..') != -1) {
                const diffBranch = leftRef.split('..');
                leftRef = diffBranch[0].trim();
                rightRef = diffBranch[1].trim();
            }
            this._model.filesViewContext = {
                repo,
                leftRef,
                rightRef,
                specifiedPath
            };
        });
    }
}
__decorate([
    command('githd.clear')
], CommandCenter.prototype, "clear", null);
__decorate([
    command('githd.viewHistory')
], CommandCenter.prototype, "viewHistory", null);
__decorate([
    command('githd.viewFileHistory')
], CommandCenter.prototype, "viewFileHistory", null);
__decorate([
    command('githd.viewFolderHistory')
], CommandCenter.prototype, "viewFolderHistory", null);
__decorate([
    command('githd.viewLineHistory')
], CommandCenter.prototype, "viewLineHistory", null);
__decorate([
    command('githd.viewAllHistory')
], CommandCenter.prototype, "viewAllHistory", null);
__decorate([
    command('githd.viewBranchHistory')
], CommandCenter.prototype, "viewBranchHistory", null);
__decorate([
    command('githd.viewAuthorHistory')
], CommandCenter.prototype, "viewAuthorHistory", null);
__decorate([
    command('githd.viewStashes')
], CommandCenter.prototype, "viewStashes", null);
__decorate([
    command('githd.diffBranch')
], CommandCenter.prototype, "diffBranch", null);
__decorate([
    command('githd.diffFile')
], CommandCenter.prototype, "diffFile", null);
__decorate([
    command('githd.diffFolder')
], CommandCenter.prototype, "diffFolder", null);
__decorate([
    command('githd.inputRef')
], CommandCenter.prototype, "inputRef", null);
__decorate([
    command('githd.openCommit')
], CommandCenter.prototype, "openCommit", null);
__decorate([
    command('githd.openCommittedFile')
], CommandCenter.prototype, "openCommittedFile", null);
__decorate([
    command('githd.openCommitInfo')
], CommandCenter.prototype, "openCommitInfo", null);
__decorate([
    command('githd.diffUncommittedFile')
], CommandCenter.prototype, "diffUncommittedFile", null);
__decorate([
    command('githd.setExpressMode')
], CommandCenter.prototype, "setExpressMode", null);
exports.CommandCenter = CommandCenter;
//# sourceMappingURL=commands.js.map