"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerViewProvider = void 0;
const path = require("path");
const fs = require("fs");
const vs = require("vscode");
const icons_1 = require("./icons");
const rootFolderIcon = {
    dark: (0, icons_1.getIconUri)('structure', 'dark'),
    light: (0, icons_1.getIconUri)('structure', 'light')
};
class InfoItem extends vs.TreeItem {
    constructor(content, label) {
        super(label);
        this.parent = undefined;
        this.command = {
            title: '',
            command: 'githd.openCommitInfo',
            arguments: [content]
        };
        this.iconPath = (0, icons_1.getIconUri)('info', '');
    }
}
class CommittedFileItem extends vs.TreeItem {
    constructor(parent, file, label) {
        super(label);
        this.parent = parent;
        this.file = file;
        this.command = {
            title: '',
            command: 'githd.openCommittedFile',
            arguments: [this.file]
        };
        if (this.file.status) {
            this.iconPath = {
                light: this._getIconPath('light'),
                dark: this._getIconPath('dark')
            };
        }
    }
    _getIconPath(theme) {
        switch (this.file.status[0].toUpperCase()) {
            case 'M':
                return icons_1.Icons[theme].Modified;
            case 'A':
                return icons_1.Icons[theme].Added;
            case 'D':
                return icons_1.Icons[theme].Deleted;
            case 'R':
                return icons_1.Icons[theme].Renamed;
            case 'C':
                return icons_1.Icons[theme].Copied;
            default:
                throw new Error('Unknown git status: ' + this.file.status[0].toUpperCase());
        }
    }
}
class FolderItem extends vs.TreeItem {
    constructor(_parent, _gitRelativePath, label, iconPath) {
        super(label);
        this._parent = _parent;
        this._gitRelativePath = _gitRelativePath;
        this._subFolders = [];
        this._files = [];
        this.parent = this._parent;
        this.gitRelativePath = this._gitRelativePath;
        this.contextValue = 'folder';
        this.iconPath = iconPath;
        this.collapsibleState = vs.TreeItemCollapsibleState.Expanded;
    }
    get subFolders() {
        return this._subFolders;
    }
    set subFolders(value) {
        this._subFolders = value;
    }
    get files() {
        return this._files;
    }
    set files(value) {
        this._files = value;
    }
    get infoItem() {
        return this._infoItem;
    }
    set infoItem(value) {
        this._infoItem = value;
    }
}
function getFormattedLabel(relativePath) {
    const name = path.basename(relativePath);
    let dir = path.dirname(relativePath);
    if (dir === '.') {
        dir = '';
    }
    return name + ' \u00a0\u2022\u00a0 ' + dir;
}
function createCommittedFileItem(rootFolder, file) {
    return new CommittedFileItem(rootFolder, file, getFormattedLabel(file.gitRelativePath));
}
function buildOneFileWithFolder(rootFolder, file, relativePath = '') {
    const segments = relativePath
        ? path.relative(relativePath, file.gitRelativePath).split(/\\|\//)
        : file.gitRelativePath.split('/');
    let gitRelativePath = relativePath;
    let parent = rootFolder;
    let i = 0;
    for (; i < segments.length - 1; ++i) {
        gitRelativePath += segments[i] + '/';
        let folder = parent.subFolders.find(item => {
            return item.label === segments[i];
        });
        if (!folder) {
            folder = new FolderItem(parent, gitRelativePath, segments[i]);
            parent.subFolders.push(folder);
        }
        parent = folder;
    }
    parent.files.push(new CommittedFileItem(parent, file, segments[i]));
}
function buildFileTree(rootFolder, files, withFolder) {
    if (withFolder) {
        files.forEach(file => buildOneFileWithFolder(rootFolder, file));
    }
    else {
        rootFolder.files.push(...files.map(file => {
            return createCommittedFileItem(rootFolder, file);
        }));
    }
}
function buildFilesWithoutFolder(rootFolder, folder) {
    rootFolder.files.push(...folder.files.map(item => {
        item.label = getFormattedLabel(path.relative(rootFolder.gitRelativePath, item.file.gitRelativePath).replace(/\\/g, '/'));
        return item;
    }));
    folder.subFolders.forEach(f => buildFilesWithoutFolder(rootFolder, f));
    folder.files = [];
    folder.subFolders = [];
}
function buildFilesWithFolder(rootFolder) {
    rootFolder.subFolders.forEach(folder => buildFilesWithFolder(folder));
    const files = rootFolder.files;
    rootFolder.files = [];
    files.forEach(fileItem => buildOneFileWithFolder(rootFolder, fileItem.file, rootFolder.gitRelativePath));
}
function setCollapsibleStateOnAll(rootFolder, state) {
    if (rootFolder) {
        rootFolder.collapsibleState = state;
        rootFolder.subFolders.forEach(sub => setCollapsibleStateOnAll(sub, state));
    }
}
class ExplorerViewProvider {
    constructor(context, model, _gitService) {
        this._gitService = _gitService;
        this._onDidChange = new vs.EventEmitter();
        this._treeRoot = [];
        this.onDidChangeTreeData = this._onDidChange.event;
        context.subscriptions.push(vs.window.registerTreeDataProvider('committedFiles', this), vs.commands.registerCommand('githd.showFilesWithFolder', (folder) => this._showFilesWithFolder(folder)), vs.commands.registerCommand('githd.showFilesWithoutFolder', (folder) => this._showFilesWithoutFolder(folder)), vs.commands.registerCommand('githd.collapseFolder', (folder) => this._setCollapsibleStateOnAll(folder, vs.TreeItemCollapsibleState.Collapsed)), vs.commands.registerCommand('githd.expandFolder', (folder) => this._setCollapsibleStateOnAll(folder, vs.TreeItemCollapsibleState.Expanded)), vs.commands.registerCommand('githd.viewFileHistoryFromTree', (fileItem) => model.setHistoryViewContext(this._context
            ? {
                repo: this._context.repo,
                specifiedPath: fileItem.file.fileUri,
                branch: ''
            }
            : undefined)), vs.commands.registerCommand('githd.viewFolderHistoryFromTree', (folder) => model.setHistoryViewContext(this._context
            ? {
                repo: this._context.repo,
                specifiedPath: vs.Uri.file(path.join(this._context.repo.root, folder.gitRelativePath)),
                branch: ''
            }
            : undefined)), this._onDidChange);
        model.onDidChangeFilesViewContext(context => {
            this._context = context;
            this._update();
        }, null, context.subscriptions);
        this._context = model.filesViewContext;
        this._withFolder = model.configuration.withFolder;
        this._update();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return this._treeRoot;
        }
        let items = [];
        let folder = element;
        if (folder) {
            items = [...folder.subFolders, ...folder.files];
            if (folder.infoItem) {
                items.push(folder.infoItem);
            }
        }
        return items;
    }
    getParent(element) {
        return element.parent;
    }
    get commitOrStashString() {
        return this._context?.isStash ? 'Stash' : 'Commit';
    }
    async _update() {
        this._treeRoot = [];
        if (!this._context) {
            return;
        }
        const leftRef = this._context.leftRef;
        const rightRef = this._context.rightRef;
        const specifiedPath = this._context.specifiedPath;
        const lineInfo = this._context.focusedLineInfo;
        if (!rightRef) {
            this._onDidChange.fire(undefined);
            return;
        }
        const committedFiles = await this._gitService.getCommittedFiles(this._context.repo, rightRef, leftRef, this._context.isStash);
        if (!leftRef) {
            await this._buildCommitInfo(rightRef);
        }
        if (!leftRef && !specifiedPath) {
            this._buildCommitTree(committedFiles, rightRef);
        }
        else if (leftRef && !specifiedPath) {
            this._buildDiffBranchTree(committedFiles, leftRef, rightRef);
        }
        else if (!leftRef && specifiedPath) {
            await this._buildPathSpecifiedCommitTree(committedFiles, specifiedPath, rightRef, lineInfo);
        }
        else {
            await this._buildPathSpecifiedDiffBranchTree(committedFiles, this._context);
        }
        this._onDidChange.fire(undefined);
    }
    async _buildCommitInfo(ref) {
        await this._treeRoot.push(new InfoItem(await this._gitService.getCommitDetails(this._context?.repo, ref, this._context?.isStash), `${this.commitOrStashString} Info`));
    }
    _buildCommitTree(files, ref) {
        this._buildCommitFolder(`${this.commitOrStashString} ${ref} \u00a0 (${files.length} files changed)`, files);
    }
    _buildDiffBranchTree(files, leftRef, rightRef) {
        this._buildCommitFolder(`Diffs between ${leftRef} and ${rightRef} \u00a0 (${files.length} files)`, files);
    }
    async _buildPathSpecifiedCommitTree(files, specifiedPath, ref, lineInfo) {
        await this._buildFocusFolder('Focus', files, specifiedPath, lineInfo);
        this._buildCommitTree(files, ref);
    }
    async _buildPathSpecifiedDiffBranchTree(files, context) {
        if (context.specifiedPath) {
            await this._buildFocusFolder(`${context.leftRef} .. ${context.rightRef}`, files, context.specifiedPath);
        }
    }
    _buildCommitFolder(label, committedFiles) {
        let folder = new FolderItem(undefined, '', label, rootFolderIcon);
        buildFileTree(folder, committedFiles, this._withFolder);
        this._treeRoot.push(folder);
    }
    async _buildFocusFolder(label, committedFiles, specifiedPath, lineInfo) {
        let folder = new FolderItem(undefined, '', label, rootFolderIcon);
        const relativePath = await this._gitService.getGitRelativePath(specifiedPath);
        if (fs.lstatSync(specifiedPath.fsPath).isFile()) {
            if (lineInfo) {
                folder.infoItem = new InfoItem(lineInfo, 'line diff');
            }
            let file = committedFiles.find(value => {
                return value.gitRelativePath === relativePath;
            });
            if (file) {
                folder.files.push(createCommittedFileItem(folder, file));
            }
        }
        else {
            let focus = [];
            committedFiles.forEach(file => {
                if (relativePath && file.gitRelativePath.search(relativePath) === 0) {
                    focus.push(file);
                }
            });
            buildFileTree(folder, focus, this._withFolder);
        }
        if (folder.files.length + folder.subFolders.length > 0 || folder.infoItem) {
            this._treeRoot.push(folder);
        }
    }
    _showFilesWithFolder(parent) {
        if (!parent) {
            this._withFolder = true;
            this._update();
        }
        else {
            buildFilesWithFolder(parent);
            this._onDidChange.fire(parent);
        }
    }
    _showFilesWithoutFolder(parent) {
        if (!parent) {
            this._withFolder = false;
            this._update();
        }
        else {
            parent.subFolders.forEach(folder => buildFilesWithoutFolder(parent, folder));
            parent.subFolders = [];
            this._onDidChange.fire(parent);
        }
    }
    _setCollapsibleStateOnAll(folder, state) {
        let parent;
        if (!folder) {
            this._treeRoot.forEach(sub => {
                if (sub instanceof FolderItem) {
                    setCollapsibleStateOnAll(sub, state);
                }
            });
        }
        else {
            parent = folder.parent;
            folder.collapsibleState = state;
            folder.subFolders.forEach(sub => setCollapsibleStateOnAll(sub, state));
        }
        // HACK: workaround of vscode regression.
        // seems vscode people are planing to add new API https://github.com/Microsoft/vscode/issues/55879
        if (parent) {
            const temp = parent.subFolders;
            parent.subFolders = [];
            this._onDidChange.fire(parent);
            setTimeout(() => {
                if (parent) {
                    parent.subFolders = temp;
                    this._onDidChange.fire(parent);
                }
            }, 250);
        }
        else {
            const root = this._treeRoot;
            this._treeRoot = [];
            this._onDidChange.fire(undefined);
            setTimeout(() => {
                this._treeRoot = root;
                this._onDidChange.fire(undefined);
            }, 250);
        }
    }
}
exports.ExplorerViewProvider = ExplorerViewProvider;
//# sourceMappingURL=explorerViewProvider.js.map