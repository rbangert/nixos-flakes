"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = exports.GitRefType = void 0;
const path = require("path");
const fs = require("fs");
const os = require("os");
const vs = require("vscode");
const child_process_1 = require("child_process");
const tracer_1 = require("./tracer");
const EntrySeparator = '[githd-es]';
const FormatSeparator = '[githd-fs]';
function formatDate(timestamp) {
    return new Date(timestamp * 1000).toDateString();
}
function normalizeFilePath(fsPath) {
    fsPath = path.normalize(fsPath);
    if (os.platform() == 'win32') {
        fsPath = fsPath.toLocaleLowerCase();
    }
    return fsPath;
}
var GitRefType;
(function (GitRefType) {
    GitRefType[GitRefType["Head"] = 0] = "Head";
    GitRefType[GitRefType["RemoteHead"] = 1] = "RemoteHead";
    GitRefType[GitRefType["Tag"] = 2] = "Tag";
})(GitRefType = exports.GitRefType || (exports.GitRefType = {}));
class GitCommittedFileImpl {
    constructor(_repo, gitRelativePath, gitRelativeOldPath, status) {
        this._repo = _repo;
        this.gitRelativePath = gitRelativePath;
        this.gitRelativeOldPath = gitRelativeOldPath;
        this.status = status;
    }
    get fileUri() {
        return vs.Uri.file(path.join(this._repo.root, this.gitRelativePath));
    }
    get oldFileUri() {
        return vs.Uri.file(path.join(this._repo.root, this.gitRelativeOldPath));
    }
}
function singleLined(value) {
    return value.replace(/\r?\n|\r/g, ' ');
}
class GitService {
    constructor(context) {
        this._gitRepos = [];
        this._onDidChangeGitRepositories = new vs.EventEmitter();
        this._gitPath = vs.workspace.getConfiguration('git').get('path') ?? 'git';
        context.subscriptions.push(this._onDidChangeGitRepositories);
    }
    get onDidChangeGitRepositories() {
        return this._onDidChangeGitRepositories.event;
    }
    updateGitRoots(wsFolders) {
        // reset repos first. Should optimize it to avoid firing multiple events.
        this._gitRepos = [];
        vs.commands.executeCommand('setContext', 'hasGitRepo', false);
        this._onDidChangeGitRepositories.fire([]);
        const start = Date.now();
        let count = 0;
        if (wsFolders) {
            wsFolders.forEach(wsFolder => {
                count += this._scanFolder(wsFolder.uri.fsPath, true);
            });
        }
        tracer_1.Tracer.info(`updateGitRoots: ${wsFolders?.length} wsFolders ${count} subFolders (${Date.now() - start}ms)`);
    }
    getGitRepos() {
        return this._gitRepos;
    }
    async getGitRepo(fsPath) {
        if (fs.statSync(fsPath).isFile()) {
            fsPath = path.dirname(fsPath);
        }
        fsPath = normalizeFilePath(fsPath);
        let repo = this._gitRepos.find(r => fsPath.startsWith(r.root));
        if (repo) {
            return repo;
        }
        let root = (await this._exec(['rev-parse', '--show-toplevel'], fsPath)).trim();
        if (root) {
            root = normalizeFilePath(root);
            if (this._gitRepos.findIndex((value) => {
                return value.root == root;
            }) === -1) {
                const remoteUrl = await this._getRemoteUrl(fsPath);
                repo = { root, remoteUrl };
                this._gitRepos.push(repo);
                vs.commands.executeCommand('setContext', 'hasGitRepo', true);
                this._onDidChangeGitRepositories.fire(this.getGitRepos());
            }
        }
        return repo;
    }
    async getGitRelativePath(file) {
        if (!file) {
            return;
        }
        const repo = await this.getGitRepo(file.fsPath);
        if (!repo) {
            return;
        }
        let relative = path.relative(repo.root, file.fsPath).replace(/\\/g, '/');
        return relative === '' ? '.' : relative;
    }
    async getCurrentBranch(repo) {
        if (!repo) {
            return;
        }
        return (await this._exec(['rev-parse', '--abbrev-ref', 'HEAD'], repo.root)).trim();
    }
    async getCommitsCount(repo, branch, author) {
        if (!repo) {
            return 0;
        }
        let args = ['rev-list', '--simplify-merges', '--count', branch];
        if (author) {
            args.push(`--author=${author}`);
        }
        return parseInt(await this._exec(args, repo.root));
    }
    async getRefs(repo) {
        if (!repo) {
            return [];
        }
        const result = await this._exec(['for-each-ref', '--format="%(refname) %(objectname:short)"'], repo.root);
        const fn = (line) => {
            let match;
            if ((match = /^refs\/heads\/([^ ]+) ([0-9a-f]+)$/.exec(line))) {
                return { name: match[1], commit: match[2], type: GitRefType.Head };
            }
            else if ((match = /^refs\/remotes\/([^/]+)\/([^ ]+) ([0-9a-f]+)$/.exec(line))) {
                return {
                    name: `${match[1]}/${match[2]}`,
                    commit: match[3],
                    type: GitRefType.RemoteHead
                };
            }
            else if ((match = /^refs\/tags\/([^ ]+) ([0-9a-f]+)$/.exec(line))) {
                return { name: match[1], commit: match[2], type: GitRefType.Tag };
            }
            return null;
        };
        return result
            .trim()
            .split('\n')
            .filter(line => !!line)
            .map(fn)
            .filter(ref => !!ref);
    }
    async getCommittedFiles(repo, rightRef, leftRef, isStash) {
        if (!repo) {
            return [];
        }
        let args = ['show', '--format=%h', '--name-status', rightRef];
        if (leftRef) {
            args = ['diff', '--name-status', `${leftRef}..${rightRef}`];
        }
        else if (isStash) {
            args.unshift('stash');
        }
        const result = await this._exec(args, repo.root);
        let files = [];
        result.split(/\r?\n/g).forEach((value, index) => {
            if (value) {
                let info = value.split(/\t/g);
                if (info.length < 2) {
                    return;
                }
                let gitRelativePath;
                let gitRelativeOldPath;
                const status = info[0][0].toLocaleUpperCase();
                // A    filename
                // M    filename
                // D    filename
                // RXX  file_old    file_new
                // CXX  file_old    file_new
                switch (status) {
                    case 'M':
                    case 'A':
                    case 'D':
                        gitRelativeOldPath = info[1];
                        gitRelativePath = info[1];
                        break;
                    case 'R':
                    case 'C':
                        gitRelativeOldPath = info[1];
                        gitRelativePath = info[2];
                        break;
                    default:
                        throw new Error('Cannot parse ' + info);
                }
                files.push(new GitCommittedFileImpl(repo, gitRelativePath, gitRelativeOldPath, status));
            }
        });
        return files;
    }
    async getLogEntries(repo, express, start, count, branch, isStash, file, line, author) {
        tracer_1.Tracer.info(`Get entries. repo: ${repo.root}, express: ${express}, start: ${start}, count: ${count}, branch: ${branch}, ` +
            `isStash: ${isStash}, file: ${file?.fsPath}, line: ${line}, author: ${author}`);
        if (!repo) {
            return [];
        }
        let format = EntrySeparator;
        if (isStash) {
            format += '%gd:';
        }
        format += `%s${FormatSeparator}%h${FormatSeparator}%d${FormatSeparator}%aN${FormatSeparator}%ae${FormatSeparator}%ct${FormatSeparator}%cr${FormatSeparator}`;
        let args = [`--format="${format}"`];
        if (!express && !line) {
            args.push('--shortstat');
        }
        if (isStash) {
            args.unshift('stash', 'list');
        }
        else {
            args.unshift('log', `--skip=${start}`, `--max-count=${count}`, '--simplify-merges', branch);
            if (author) {
                args.push(`--author=${author}`);
            }
            if (file) {
                const filePath = (await this.getGitRelativePath(file)) ?? '.';
                if (line) {
                    args.push(`-L ${line},${line}:${filePath}`);
                }
                else {
                    args.push('--follow', filePath);
                }
            }
        }
        const result = await this._exec(args, repo.root);
        let entries = [];
        result.split(EntrySeparator).forEach(entry => {
            if (!entry) {
                return;
            }
            let subject;
            let hash;
            let ref;
            let author;
            let email;
            let date;
            let stat;
            let lineInfo;
            entry.split(FormatSeparator).forEach((value, index) => {
                switch (index % 8) {
                    case 0:
                        subject = singleLined(value);
                        break;
                    case 1:
                        hash = value;
                        break;
                    case 2:
                        ref = value;
                        break;
                    case 3:
                        author = value;
                        break;
                    case 4:
                        email = value;
                        break;
                    case 5:
                        date = formatDate(parseInt(value));
                        break;
                    case 6:
                        date += ` (${value})`;
                        break;
                    case 7:
                        if (!!line) {
                            lineInfo = value.trim();
                        }
                        else {
                            stat = value.trim();
                        }
                        entries.push({
                            subject,
                            hash,
                            ref,
                            author,
                            email,
                            date,
                            stat,
                            lineInfo
                        });
                        break;
                }
            });
        });
        return entries;
    }
    async getCommitDetails(repo, ref, isStash) {
        if (!repo) {
            return '';
        }
        const format = isStash
            ? `Stash:         %H %nAuthor:        %aN <%aE> %nAuthorDate:    %ad %n%n%s %n`
            : 'Commit:        %H %nAuthor:        %aN <%aE> %nAuthorDate:    %ad %nCommit:        %cN <%cE> %nCommitDate:    %cd %n%n%s %n';
        let details = await this._exec(['show', `--format="${format}"`, '--no-patch', '--date=local', ref], repo.root);
        const body = (await this._exec(['show', '--format=%b', '--no-patch', ref], repo.root)).trim();
        if (body) {
            details += body + '\r\n\r\n';
        }
        details += '-----------------------------\r\n\r\n';
        details += await this._exec(['show', '--format=', '--stat', ref], repo.root);
        return details;
    }
    async getAuthors(repo) {
        if (!repo) {
            return [];
        }
        const result = (await this._exec(['shortlog', '-se', 'HEAD'], repo.root)).trim();
        return result.split(/\r?\n/g).map(item => {
            item = item.trim();
            let start = item.search(/ |\t/);
            item = item.substr(start + 1).trim();
            start = item.indexOf('<');
            const name = item.substring(0, start);
            const email = item.substring(start + 1, item.length - 1);
            return { name, email };
        });
    }
    async getBlameItem(file, line) {
        const repo = await this.getGitRepo(file.fsPath);
        if (!repo) {
            return;
        }
        const filePath = file.fsPath;
        const result = await this._exec(['blame', `${filePath}`, '-L', `${line + 1},${line + 1}`, '--incremental', '--root'], repo.root);
        let hash = '';
        let subject = '';
        let author = '';
        let date = '';
        let email = '';
        result.split(/\r?\n/g).forEach((line, index) => {
            if (index == 0) {
                hash = line.split(' ')[0];
            }
            else {
                const infoName = line.split(' ')[0];
                const info = line.substr(infoName.length).trim();
                if (!info) {
                    return;
                }
                switch (infoName) {
                    case 'author':
                        author = info;
                        break;
                    case 'committer-time':
                        date = new Date(parseInt(info) * 1000).toLocaleDateString();
                        break;
                    case 'author-mail':
                        email = info;
                        break;
                    case 'summary':
                        subject = singleLined(info);
                        break;
                    default:
                        break;
                }
            }
        });
        if ([hash, subject, author, email, date].some(v => !v)) {
            tracer_1.Tracer.warning(`Blame info missed. repo ${repo.root} file ${filePath}:${line} ${hash}` +
                ` author: ${author}, mail: ${email}, date: ${date}, summary: ${subject}`);
            return;
        }
        // get additional info: abbrev hash, relative date, body, stat
        const addition = await this._exec(['show', `--format=%h${FormatSeparator}%cr${FormatSeparator}%b${FormatSeparator}`, '--stat', `${hash}`], repo.root);
        //const firstLine = addition.split(/\r?\n/g)[0];
        const items = addition.split(FormatSeparator);
        hash = items[0] ?? '';
        const relativeDate = items[1] ?? '';
        const body = items[2]?.trim() ?? '';
        const stat = ' ' + items[3]?.trim() ?? '';
        return {
            file,
            line,
            subject,
            body,
            hash,
            author,
            date,
            email,
            relativeDate,
            stat
        };
    }
    _scanFolder(folder, includeSubFolders) {
        let count = 0;
        const children = fs.readdirSync(folder, { withFileTypes: true });
        children
            .filter(child => child.isDirectory())
            .forEach(async (child) => {
            if (child.name === '.git') {
                this.getGitRepo(folder);
                count++;
            }
            else if (includeSubFolders) {
                count += this._scanFolder(path.join(folder, child.name));
            }
        });
        return count;
    }
    async _getRemoteUrl(fsPath) {
        let remote = (await this._exec(['remote', 'get-url', '--push', 'origin'], fsPath)).trim();
        if (remote.startsWith('git@')) {
            remote = remote.replace(':', '/').replace('git@', 'https://');
        }
        let url = remote.replace(/\.git$/g, '');
        // Do a best guess if it's a valid git repository url. In case user configs
        // the host name.
        if (url.search(/\.(com|org|net|io|cloud)\//g) > 0) {
            return url;
        }
        tracer_1.Tracer.info('Remote URL: ' + remote);
        // If it's not considered as a valid one, we try to compose a github one.
        return url.replace(/:\/\/.*?\//g, '://github.com/');
    }
    async _exec(args, cwd) {
        const start = Date.now();
        const cmd = this._gitPath + ' ' + args.join(' ');
        return new Promise(resolve => {
            (0, child_process_1.exec)(cmd, { encoding: 'utf8', cwd }, (err, stdout) => {
                if (err) {
                    tracer_1.Tracer.error(`git command failed: ${cmd} (${Date.now() - start}ms) ${cwd} ${err.message}`);
                }
                else {
                    tracer_1.Tracer.verbose(`git command: ${cmd}. Output size: ${stdout.length} (${Date.now() - start}ms) ${cwd}`);
                    resolve(stdout);
                }
            });
        });
    }
}
exports.GitService = GitService;
//# sourceMappingURL=gitService.js.map